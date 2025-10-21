import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi, tokenUtils } from '../api/auth';
import type { User } from '../api/auth';

// User interface is now imported from auth API

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name?: string;
    last_name?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialiser le token au démarrage
  useEffect(() => {
    tokenUtils.initializeToken();
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = tokenUtils.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const { authenticated, user: userData } = await authApi.checkAuth();
      if (authenticated) {
        setUser(userData);
      } else {
        tokenUtils.removeToken();
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      tokenUtils.removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      tokenUtils.setToken(response.token);
      setUser(response.user);
      console.log('✅ Connexion réussie');
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.response?.data?.email?.[0] || error.response?.data?.password?.[0] || 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name?: string;
    last_name?: string;
  }) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(userData);
      tokenUtils.setToken(response.token);
      setUser(response.user);
      console.log('✅ Inscription réussie');
    } catch (error: any) {
      const errorMessage = error.response?.data?.email?.[0] || 
                          error.response?.data?.username?.[0] ||
                          error.response?.data?.password?.[0] ||
                          error.response?.data?.non_field_errors?.[0] ||
                          'Erreur lors de l\'inscription';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      tokenUtils.removeToken();
      setUser(null);
      console.log('✅ Déconnexion réussie');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
