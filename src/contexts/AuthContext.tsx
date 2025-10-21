import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, authApi, tokenUtils } from '../api/auth';

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
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
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
    console.log('🔐 [AUTH DEBUG] Tentative de connexion pour:', email);
    console.log('🔐 [AUTH DEBUG] URL API:', 'api/auth/login/');
    
    try {
      console.log('🔐 [AUTH DEBUG] Envoi requête login...');
      const response = await authApi.login({ email, password });
      console.log('🔐 [AUTH DEBUG] Réponse login reçue:', response);
      
      tokenUtils.setToken(response.token);
      setUser(response.user);
      console.log('🔐 [AUTH DEBUG] Login réussi, token sauvé');
    } catch (error: any) {
      console.error('🔐 [AUTH DEBUG] Erreur login:', error);
      console.error('🔐 [AUTH DEBUG] Détails erreur:', error.response?.data);
      console.error('🔐 [AUTH DEBUG] Status:', error.response?.status);
      // Parse different error formats from Django REST Framework
      const errorData = error.response?.data;
      
      if (errorData) {
        // Check for non-field errors first
        if (errorData.non_field_errors && errorData.non_field_errors.length > 0) {
          throw new Error(errorData.non_field_errors[0]);
        }
        
        // Check for field-specific errors
        if (errorData.email && errorData.email.length > 0) {
          throw new Error(`Email: ${errorData.email[0]}`);
        }
        
        if (errorData.password && errorData.password.length > 0) {
          throw new Error(`Mot de passe: ${errorData.password[0]}`);
        }
        
        // Check for generic error field
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        
        // Check for detail field (common in DRF)
        if (errorData.detail) {
          throw new Error(errorData.detail);
        }
      }
      
      // Fallback error message
      throw new Error('Erreur de connexion. Vérifiez vos identifiants.');
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
    console.log('📝 [AUTH DEBUG] Tentative d\'inscription pour:', userData.email);
    console.log('📝 [AUTH DEBUG] Données envoyées:', { ...userData, password: '[HIDDEN]', password_confirm: '[HIDDEN]' });
    console.log('📝 [AUTH DEBUG] URL API:', 'api/auth/register/');
    
    try {
      console.log('📝 [AUTH DEBUG] Envoi requête register...');
      const response = await authApi.register(userData);
      console.log('📝 [AUTH DEBUG] Réponse register reçue:', response);
      
      tokenUtils.setToken(response.token);
      setUser(response.user);
      console.log('📝 [AUTH DEBUG] Registration réussie, token sauvé');
    } catch (error: any) {
      console.error('📝 [AUTH DEBUG] Erreur register:', error);
      console.error('📝 [AUTH DEBUG] Détails erreur:', error.response?.data);
      console.error('📝 [AUTH DEBUG] Status:', error.response?.status);
      // Parse different error formats from Django REST Framework
      const errorData = error.response?.data;
      
      if (errorData) {
        // Check for non-field errors first (like password mismatch)
        if (errorData.non_field_errors && errorData.non_field_errors.length > 0) {
          throw new Error(errorData.non_field_errors[0]);
        }
        
        // Collect all field errors
        const fieldErrors: string[] = [];
        
        if (errorData.username && errorData.username.length > 0) {
          fieldErrors.push(`Nom d'utilisateur: ${errorData.username[0]}`);
        }
        
        if (errorData.email && errorData.email.length > 0) {
          fieldErrors.push(`Email: ${errorData.email[0]}`);
        }
        
        if (errorData.password && errorData.password.length > 0) {
          fieldErrors.push(`Mot de passe: ${errorData.password[0]}`);
        }
        
        if (errorData.password_confirm && errorData.password_confirm.length > 0) {
          fieldErrors.push(`Confirmation: ${errorData.password_confirm[0]}`);
        }
        
        if (errorData.first_name && errorData.first_name.length > 0) {
          fieldErrors.push(`Prénom: ${errorData.first_name[0]}`);
        }
        
        if (errorData.last_name && errorData.last_name.length > 0) {
          fieldErrors.push(`Nom: ${errorData.last_name[0]}`);
        }
        
        // Return the first field error if any
        if (fieldErrors.length > 0) {
          throw new Error(fieldErrors[0]);
        }
        
        // Check for generic error field
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        
        // Check for detail field (common in DRF)
        if (errorData.detail) {
          throw new Error(errorData.detail);
        }
      }
      
      // Fallback error message
      throw new Error('Erreur lors de l\'inscription. Vérifiez vos données.');
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
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await authApi.updateProfile(data);
      setUser(response.user);
    } catch (error: any) {
      const errorData = error.response?.data;
      
      if (errorData) {
        // Check for field-specific errors
        if (errorData.email && errorData.email.length > 0) {
          throw new Error(`Email: ${errorData.email[0]}`);
        }
        
        if (errorData.first_name && errorData.first_name.length > 0) {
          throw new Error(`Prénom: ${errorData.first_name[0]}`);
        }
        
        if (errorData.last_name && errorData.last_name.length > 0) {
          throw new Error(`Nom: ${errorData.last_name[0]}`);
        }
        
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        
        if (errorData.detail) {
          throw new Error(errorData.detail);
        }
      }
      
      throw new Error('Erreur lors de la mise à jour du profil');
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
    } catch (error: any) {
      const errorData = error.response?.data;
      
      if (errorData) {
        if (errorData.current_password && errorData.current_password.length > 0) {
          throw new Error(`Mot de passe actuel: ${errorData.current_password[0]}`);
        }
        
        if (errorData.new_password && errorData.new_password.length > 0) {
          throw new Error(`Nouveau mot de passe: ${errorData.new_password[0]}`);
        }
        
        if (errorData.confirm_password && errorData.confirm_password.length > 0) {
          throw new Error(`Confirmation: ${errorData.confirm_password[0]}`);
        }
        
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        
        if (errorData.detail) {
          throw new Error(errorData.detail);
        }
      }
      
      throw new Error('Erreur lors du changement de mot de passe');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
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
