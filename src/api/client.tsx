import axios from "axios";

// Détection automatique de l'URL API selon l'environnement
const getApiUrl = () => {
  // En production, utiliser la variable d'environnement
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 
           import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 
           'https://invitationauvoyage-backend.onrender.com/';
  }
  // En développement
  return import.meta.env.VITE_API_URL || "http://127.0.0.1:8003/";
};

const apiUrl = getApiUrl();
console.log('🌐 [CONFIG] URL API utilisée:', apiUrl);

export const api = axios.create({
  baseURL: apiUrl,
  timeout: 180000, // Augmenté à 180 secondes (3 minutes) pour les opérations complexes (scraping + ChatGPT)
  withCredentials: false,
});

// Nouvel export pour la compatibilité avec le système d'authentification
export const apiClient = api;

// Intercepteur pour gérer les réponses d'erreur et l'authentification
api.interceptors.response.use(
  (res) => {
    console.log('🌐 [HTTP DEBUG] Réponse reçue:', {
      status: res.status,
      statusText: res.statusText,
      url: res.config.url,
      data: res.data
    });
    return res;
  },
  (error) => {
    console.error('🌐 [HTTP DEBUG] Erreur HTTP:', {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      url: error?.config?.url,
      data: error?.response?.data,
      message: error.message
    });
    
    // Log plus détaillé des erreurs de validation
    if (error?.response?.data) {
      console.error('🌐 [HTTP DEBUG] Détails erreurs validation:');
      Object.keys(error.response.data).forEach(field => {
        const fieldErrors = error.response.data[field];
        if (Array.isArray(fieldErrors)) {
          fieldErrors.forEach(err => {
            console.error(`  - ${field}: ${err}`);
          });
        } else {
          console.error(`  - ${field}: ${fieldErrors}`);
        }
      });
    }
    
    const status = error?.response?.status;
    
    // Si l'utilisateur n'est pas authentifié, supprimer le token local
    if (status === 401) {
      console.log('🌐 [HTTP DEBUG] Token expiré, suppression...');
      localStorage.removeItem('auth_token');
      delete api.defaults.headers.common['Authorization'];
    }
    
    const detail =
      error?.response?.data?.error ||
      error?.response?.data?.detail ||
      error.message;
    return Promise.reject({ status, detail, raw: error });
  }
);

// Intercepteur pour ajouter automatiquement le token d'authentification
api.interceptors.request.use(
  (config) => {
    console.log('🌐 [HTTP DEBUG] Requête sortante:', {
      method: config.method?.toUpperCase(),
      url: config.baseURL + config.url,
      headers: config.headers,
      data: config.data
    });
    
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
      console.log('🌐 [HTTP DEBUG] Token ajouté à la requête');
    } else {
      console.log('🌐 [HTTP DEBUG] Aucun token trouvé');
    }
    return config;
  },
  (error) => {
    console.error('🌐 [HTTP DEBUG] Erreur dans intercepteur request:', error);
    return Promise.reject(error);
  }
);
