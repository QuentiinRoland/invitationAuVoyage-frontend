// Configuration API pour différents environnements

// Détection de l'environnement
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// URLs par environnement
const API_URLS = {
  development: 'http://127.0.0.1:8003/api',  // Port 8003 comme demandé
  production: import.meta.env.VITE_API_BASE_URL || 'https://your-backend-url.onrender.com/api'
};

// Export de l'URL API
export const API_BASE_URL = isDevelopment ? API_URLS.development : API_URLS.production;

// Configuration des timeouts
export const API_CONFIG = {
  timeout: isProduction ? 30000 : 10000, // 30s en production, 10s en dev
  retries: isProduction ? 3 : 1
};

// Helper pour les appels API avec gestion d'erreur et authentification
export const apiCall = async (url: string, options: RequestInit = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  // Récupérer le token d'authentification depuis localStorage
  const token = localStorage.getItem('auth_token');
  const authHeaders = token ? { 'Authorization': `Token ${token}` } : {};

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
    }

    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Timeout: La requête a pris trop de temps');
    }
    
    throw error;
  }
};

console.log(`🌐 API configurée pour l'environnement: ${isDevelopment ? 'development' : 'production'}`);
console.log(`📡 URL API: ${API_BASE_URL}`);
