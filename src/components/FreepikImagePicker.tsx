import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Search, X, Loader2, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { API_BASE_URL } from '../config/api';

interface FreepikImagePickerProps {
  onSelectImage: (url: string) => void;
  onClose: () => void;
}

interface FreepikImage {
  id: number | string;
  url: string;
  preview: string;
  thumbnail: string;
  author: string;
}

const FreepikImagePicker: React.FC<FreepikImagePickerProps> = ({ onSelectImage, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [images, setImages] = useState<FreepikImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  // Cacher la barre Puck quand le modal est ouvert avec CSS forcé
  React.useEffect(() => {
    // Injecter un style CSS global avec !important pour forcer
    const style = document.createElement('style');
    style.id = 'freepik-modal-override';
    style.textContent = `
      .Puck,
      .Puck-portal,
      [data-puck-portal],
      .Puck-header,
      [class*="Puck"] {
        z-index: 0 !important;
      }
      
      /* Forcer le modal Freepik au-dessus */
      #freepik-modal-container {
        z-index: 999999 !important;
      }
    `;
    document.head.appendChild(style);
    
    // Retirer le style quand le modal se ferme
    return () => {
      const styleEl = document.getElementById('freepik-modal-override');
      if (styleEl) {
        styleEl.remove();
      }
    };
  }, []);

  // Génération d'images fallback DYNAMIQUES basées sur la recherche
  const getFallbackImages = (searchTerm: string, count: number = 30): FreepikImage[] => {
    console.log(`🎨 Génération de ${count} images fallback pour: "${searchTerm}"`);
    
    const images: FreepikImage[] = [];
    const timestamp = Date.now();
    
    for (let i = 0; i < count; i++) {
      // Utiliser un random unique à chaque fois pour forcer des images différentes
      const randomSeed = Math.random().toString(36).substring(7) + timestamp + i;
      const imageUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(searchTerm)}&random=${randomSeed}`;
      
      images.push({
        id: `${searchTerm}-${randomSeed}`,
        url: imageUrl,
        preview: imageUrl.replace('800x600', '400x400'),
        thumbnail: imageUrl.replace('800x600', '200x200'),
        author: 'Unsplash'
      });
      
      if (i === 0) {
        console.log(`   📸 Exemple URL: ${imageUrl.substring(0, 100)}...`);
      }
    }
    
    console.log(`   ✅ ${images.length} URLs uniques générées`);
    return images;
  };

  // Recherche avec pagination via Backend Proxy
  const searchImages = async (page: number = 1, customQuery?: string) => {
    const query = customQuery || searchQuery;
    if (!query.trim()) return;

    console.log(`\n═══════════════════════════════════════`);
    console.log(`🔍 NOUVELLE RECHERCHE: "${query}" (page ${page})`);
    console.log(`═══════════════════════════════════════\n`);

    // FORCER la réinitialisation COMPLÈTE
    setImages([]);
    setIsUsingFallback(false);
    setLoading(true);
    setError('');
    setHasSearched(true);
    
    try {
      // Appel au backend proxy pour éviter les problèmes CORS
      // Ajouter un timestamp pour éviter le cache
      const timestamp = Date.now();
      const apiUrl = `${API_BASE_URL}/freepik/search/?query=${encodeURIComponent(query)}&page=${page}&limit=30&_t=${timestamp}`;
      
      console.log(`📡 Appel API: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        cache: 'no-store' // Désactiver le cache du navigateur
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend proxy error:', errorData);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Formater les résultats Freepik
      const formattedImages: FreepikImage[] = (data.data || []).map((img: any) => {
        // L'URL de l'image est toujours dans image.source.url
        const imageUrl = img.image?.source?.url || '';
        
        return {
          id: img.id,
          url: imageUrl,
          preview: imageUrl, // Même URL pour preview
          thumbnail: imageUrl, // Même URL pour thumbnail
          author: img.author?.name || img.author?.username || 'Freepik'
        };
      });

      setImages(formattedImages);
      setCurrentPage(page);
      setIsUsingFallback(false);
      
      // Calculer le nombre total de pages (CORRECTION : meta.total et pas meta.pagination.total !)
      const totalResults = data.meta?.total || data.meta?.last_page * 30 || 300;
      const totalPagesCalc = data.meta?.last_page || Math.ceil(totalResults / 30);
      const finalTotalPages = Math.min(totalPagesCalc, 10); // Limiter à 10 pages max
      setTotalPages(finalTotalPages);
      
      console.log(`✅ ${formattedImages.length} images FREEPIK chargées (page ${page}/${finalTotalPages})`);
      console.log(`   📊 Total disponible: ${totalResults.toLocaleString()} images !`);
      
      if (formattedImages.length > 0) {
        console.log(`\n   🖼️ PREMIÈRES IMAGES (photos paysage uniquement):`);
        formattedImages.slice(0, 5).forEach((img, i) => {
          const title = data.data[i]?.title || 'No title';
          const imageType = data.data[i]?.image?.type || 'unknown';
          const orientation = data.data[i]?.image?.orientation || 'unknown';
          console.log(`   ${i+1}. "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}"`);
          console.log(`      Type: ${imageType} | Orientation: ${orientation} | ID: ${img.id}`);
        });
        console.log(``);
      }
    } catch (err: any) {
      // En cas d'erreur API, utiliser Unsplash Source (dynamique!)
      console.log(`⚠️ Freepik API error, using Unsplash fallback for "${query}"`);
      console.error(err);
      
      setIsUsingFallback(true);
      
      // Générer des images Unsplash basées sur le terme de recherche
      const fallbackImages = getFallbackImages(query, 30);
      
      setImages(fallbackImages);
      setCurrentPage(page);
      setTotalPages(3); // Simuler 3 pages
      
      console.log(`\n📊 RÉSUMÉ:`);
      console.log(`   Source: MODE SECOURS Unsplash`);
      console.log(`   Terme: "${query}"`);
      console.log(`   Images: ${fallbackImages.length}`);
      console.log(`   Premières URLs:`);
      fallbackImages.slice(0, 3).forEach((img, i) => {
        console.log(`   ${i+1}. ${img.url.substring(0, 120)}...`);
      });
      
      setError('❌ Backend non accessible - Images Unsplash affichées (recherche dynamique activée)');
    } finally {
      setLoading(false);
      console.log(`\n✅ Recherche terminée\n`);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      searchImages(newPage);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchImages(1, searchQuery);
      setCurrentPage(1);
    }
  };

  const modalContent = (
    <div 
      id="freepik-modal-container" 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" 
      style={{ 
        zIndex: 2147483647, // Max z-index possible !
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Rechercher une image
                {isUsingFallback && (
                  <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                    MODE SECOURS
                  </span>
                )}
                {!isUsingFallback && hasSearched && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    FREEPIK
                  </span>
                )}
              </h2>
              <p className="text-sm text-gray-500">
                {hasSearched 
                  ? (
                    <>
                      {images.length} images • Page {currentPage}/{totalPages}
                      <span className="ml-2 text-xs text-purple-600 font-mono">
                        "{searchQuery}"
                      </span>
                    </>
                  )
                  : 'Trouvez l\'image parfaite pour votre offre'
                }
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Rechercher des images (ex: beach, mountain, city, travel...)"
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => {
                searchImages(1);
                setCurrentPage(1);
              }}
              disabled={loading || !searchQuery.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Rechercher'
              )}
            </Button>
          </div>
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ImageIcon className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Recherchez des images</h3>
              <p className="text-sm text-gray-500 max-w-md mb-4">
                Utilisez la barre de recherche ci-dessus pour trouver des images professionnelles pour votre offre de voyage
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                {['beach', 'mountain', 'city', 'travel', 'hotel', 'food', 'sunset', 'nature'].map((keyword) => (
                  <button
                    key={keyword}
                    onClick={() => {
                      setSearchQuery(keyword);
                      searchImages(1, keyword); // Passer le mot-clé directement
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-colors"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((image, index) => (
                <button
                  key={`${searchQuery}-${image.id}-${index}`}
                  onClick={() => {
                    onSelectImage(image.url);
                    onClose();
                  }}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-purple-500 transition-all"
                >
                  <img
                    key={`img-${searchQuery}-${image.id}-${index}`}
                    src={image.preview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Sélectionner
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white truncate">Par {image.author}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {hasSearched && images.length > 0 && totalPages > 1 && (
          <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </Button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                    className={`w-8 h-8 rounded ${
                      currentPage === pageNum
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    } text-sm font-medium transition-colors`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="flex items-center gap-2"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Footer */}
        {!hasSearched && (
          <div className="p-4 border-t bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              🎨 Propulsé par <strong>Freepik API</strong> • Millions d'images professionnelles disponibles
            </p>
          </div>
        )}
        {hasSearched && images.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              📸 Images fournies par Freepik • Haute qualité professionnelle
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Utiliser un portail React pour monter le modal directement sur le body
  // Cela contourne complètement la hiérarchie z-index de Puck !
  return ReactDOM.createPortal(modalContent, document.body);
};

export default FreepikImagePicker;

