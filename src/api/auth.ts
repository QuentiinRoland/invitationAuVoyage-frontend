import { apiClient } from './client';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export const authApi = {
  // Inscription
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('api/auth/register/', data);
    return response.data;
  },

  // Connexion
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('api/auth/login/', data);
    return response.data;
  },

  // Déconnexion
  logout: async (): Promise<void> => {
    await apiClient.post('api/auth/logout/');
  },

  // Vérifier l'authentification
  checkAuth: async (): Promise<{ authenticated: boolean; user: User }> => {
    const response = await apiClient.get('api/auth/check/');
    return response.data;
  },

  // Récupérer le profil
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get('api/auth/profile/');
    return response.data;
  },

  // Mettre à jour le profil
  updateProfile: async (data: Partial<User>): Promise<{ message: string; user: User }> => {
    const response = await apiClient.put('api/auth/profile/', data);
    return response.data;
  },

  // Changer le mot de passe
  changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    const response = await apiClient.post('api/auth/change-password/', data);
    return response.data;
  },

  // Demander une réinitialisation de mot de passe
  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post('api/auth/password-reset/', { email });
    return response.data;
  },

  // Confirmer la réinitialisation de mot de passe
  confirmPasswordReset: async (data: {
    uid: string;
    token: string;
    new_password: string;
  }): Promise<{ message: string }> => {
    const response = await apiClient.post('api/auth/password-reset-confirm/', data);
    return response.data;
  },
};

// Utilitaires pour gérer le token
export const tokenUtils = {
  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  setToken: (token: string): void => {
    localStorage.setItem('auth_token', token);
    // Configurer le token pour les futures requêtes
    apiClient.defaults.headers.common['Authorization'] = `Token ${token}`;
  },

  removeToken: (): void => {
    localStorage.removeItem('auth_token');
    delete apiClient.defaults.headers.common['Authorization'];
  },

  initializeToken: (): void => {
    const token = tokenUtils.getToken();
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Token ${token}`;
    }
  },
};
