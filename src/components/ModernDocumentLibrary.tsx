import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  FileText, 
  FolderPlus, 
  Search, 
  MoreHorizontal, 
  Grid3X3, 
  List, 
  Calendar, 
  Edit, 
  Home,
  ChevronRight,
  Plus,
  Loader2,
  Trash2,
  Eye,
  X
} from 'lucide-react';

interface Document {
  id: number;
  title: string;
  description: string;
  document_type: string;
  document_type_display: string;
  created_at: string;
  updated_at: string;
  file_size_mb: number;
  has_pdf: boolean;
  has_thumbnail: boolean;
  company_info: any;
  assets_count: number;
  folder_id?: number;
}

interface Folder {
  id: number;
  name: string;
  description: string;
  color: string;
  icon: string;
  position: number;
  full_path: string;
  documents_count: number;
  total_documents_count: number;
  created_at: string;
  updated_at: string;
  parent_id?: number;
}

interface DocumentLibraryProps {
  onLoadDocument?: (document: any) => void;
  onNavigateToEditor?: () => void;
  isActive?: boolean;
}

const ModernDocumentLibrary: React.FC<DocumentLibraryProps> = ({
  onLoadDocument,
  onNavigateToEditor,
  isActive = false
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument] = useState<number | null>(null);
  const [currentFolder, setCurrentFolder] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showDocumentMenu, setShowDocumentMenu] = useState<number | null>(null);
  const [showMoveModal, setShowMoveModal] = useState<number | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('📁');
  const [newFolderColor, setNewFolderColor] = useState('#3B82F6');
  const [isUsingDemoData, setIsUsingDemoData] = useState(false);

  // Charger les dossiers et documents UNE SEULE FOIS au montage
  useEffect(() => {
    // Vérifier si nous devons forcer une réinitialisation (nouvelle structure de dossiers)
    const currentVersion = localStorage.getItem('folders_version');
    if (currentVersion !== '2.0') {
      console.log('🔄 Nouvelle structure de dossiers détectée - réinitialisation...');
      localStorage.removeItem('demo_folders');
      localStorage.removeItem('demo_documents');
      localStorage.setItem('folders_version', '2.0');
    }
    
    loadFolders();
    loadDocuments();
  }, []); // Pas de dépendances = une seule fois au montage

  // Sauvegarder les documents dans localStorage à chaque modification EN MODE LOCAL
  useEffect(() => {
    // Sauvegarder UNIQUEMENT si en mode local (isUsingDemoData = true)
    if (isUsingDemoData && documents.length > 0) {
      console.log('💾 Sauvegarde des documents dans localStorage', {
        count: documents.length,
        isDemo: isUsingDemoData,
        docs: documents.map(d => ({ id: d.id, title: d.title, folder_id: d.folder_id }))
      });
      localStorage.setItem('demo_documents', JSON.stringify(documents));
      localStorage.setItem('demo_data_timestamp', Date.now().toString());
    }
  }, [documents, isUsingDemoData]);

  // Sauvegarder les dossiers dans localStorage à chaque modification
  useEffect(() => {
    if (folders.length > 0) {
      console.log('💾 Sauvegarde des dossiers dans localStorage', folders);
      localStorage.setItem('demo_folders', JSON.stringify(folders));
    }
  }, [folders]);

  // Recharger toutes les 30 secondes UNIQUEMENT si l'API est disponible (pas en mode démo)
  useEffect(() => {
    if (!isUsingDemoData) {
      const interval = setInterval(() => {
        console.log('🔄 Rechargement automatique des documents API...');
        loadDocuments();
      }, 30000); // 30 secondes

      return () => clearInterval(interval);
    }
  }, [isUsingDemoData]); // Dépend du mode

  // Fermer le menu des documents quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => setShowDocumentMenu(null);
    if (showDocumentMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDocumentMenu]);

  // Recharger quand la bibliothèque devient active
  useEffect(() => {
    if (isActive) {
      console.log('📚 Bibliothèque activée - rechargement des documents...');
      loadDocuments(true); // Force reload
    }
  }, [isActive]);

  const loadFolders = async () => {
    // Essayer de charger depuis localStorage d'abord
    const savedFolders = localStorage.getItem('demo_folders');
    if (savedFolders) {
      console.log('📦 Chargement des dossiers depuis localStorage');
      try {
        const parsedFolders = JSON.parse(savedFolders);
        setFolders(parsedFolders);
        return;
      } catch (e) {
        console.error('Erreur lors du parsing de localStorage:', e);
        localStorage.removeItem('demo_folders');
      }
    }
    
    // FALLBACK : Dossiers principaux par défaut (3 dossiers pour chaque utilisateur)
    console.log('Chargement des 3 dossiers principaux...');
    const demoFolders: Folder[] = [
          {
            id: 1,
            name: 'Dossier de Denis',
            description: 'Documents et projets de Denis',
            color: '#3B82F6',
            icon: '👤',
            position: 0,
            full_path: 'Dossier de Denis',
            documents_count: 0,
            total_documents_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            parent_id: undefined
          },
          {
            id: 2,
            name: 'Dossier de Sandrine',
            description: 'Documents et projets de Sandrine',
            color: '#10B981',
            icon: '👤',
            position: 1,
            full_path: 'Dossier de Sandrine',
            documents_count: 0,
            total_documents_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            parent_id: undefined
          },
          {
            id: 3,
            name: 'Dossier Commun',
            description: 'Documents partagés et communs',
            color: '#8B5CF6',
            icon: '📂',
            position: 2,
            full_path: 'Dossier Commun',
            documents_count: 0,
            total_documents_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            parent_id: undefined
          }
        ];
    setFolders(demoFolders);
  };

  const loadDocuments = async (forceReload: boolean = false) => {
    // Si on a déjà des documents chargés, ne pas recharger (pour préserver les modifications)
    if (documents.length > 0 && !forceReload) {
      console.log('Documents déjà en mémoire, pas de rechargement');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // PRIORITÉ 1 : Toujours charger depuis localStorage EN PREMIER si disponible
    const savedDocuments = localStorage.getItem('demo_documents');
    const savedTimestamp = localStorage.getItem('demo_data_timestamp');
    
    if (savedDocuments && savedTimestamp) {
      console.log('📦 Chargement des documents depuis localStorage (priorité aux données locales)');
      try {
        const parsedDocuments = JSON.parse(savedDocuments);
        setDocuments(parsedDocuments);
        setIsUsingDemoData(true); // Mode local activé
        setIsLoading(false);
        return;
      } catch (e) {
        console.error('Erreur lors du parsing de localStorage:', e);
        localStorage.removeItem('demo_documents');
        localStorage.removeItem('demo_data_timestamp');
      }
    }
    
    // PRIORITÉ 2 : Si pas de localStorage, essayer l'API
    try {
      const response = await api.get('api/documents/');
      
      console.log('📄 Documents API chargés (pas de sauvegarde locale trouvée):', response.data);
      setDocuments(response.data);
      setIsUsingDemoData(false);
      setIsLoading(false);
      return; // Sortir si l'API fonctionne
      
    } catch (err: any) {
      console.warn('API non disponible, utilisation des données de démonstration:', err);
    }
    
    // FALLBACK FINAL : Documents de démonstration si l'API échoue
    // Démarrer avec quelques documents à la racine
    console.log('Chargement des documents de démonstration...');
    setIsUsingDemoData(true);
    const allDemoDocuments: Document[] = [
      // Documents à la racine (pas encore organisés)
      {
        id: 1,
        title: 'Offre Générale 2024',
        description: 'Offre commerciale générale pour l\'année 2024',
        document_type: 'craftjs_project',
        document_type_display: 'Projet Craft.js',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        file_size_mb: 2.1,
        has_pdf: true,
        has_thumbnail: true,
        company_info: null,
        assets_count: 2,
        folder_id: undefined
      },
      {
        id: 2,
        title: 'Circuit Europe',
        description: 'Circuit découverte de l\'Europe',
        document_type: 'craftjs_project',
        document_type_display: 'Projet Craft.js',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        file_size_mb: 3.2,
        has_pdf: true,
        has_thumbnail: true,
        company_info: null,
        assets_count: 5,
        folder_id: undefined
      },
      {
        id: 3,
        title: 'Voyage en Asie',
        description: 'Découverte des temples d\'Asie',
        document_type: 'pdf_import',
        document_type_display: 'Import PDF',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 172800000).toISOString(),
        file_size_mb: 1.5,
        has_pdf: true,
        has_thumbnail: false,
        company_info: null,
        assets_count: 1,
        folder_id: undefined
      }
    ];
        
    setDocuments(allDemoDocuments);
    setIsLoading(false);
  };

  const loadDocument = async (documentId: number) => {
    try {
      const response = await api.get(`api/documents/${documentId}/`);
      const document = response.data;
      
      if (onLoadDocument) {
        onLoadDocument(document);
      }
      
      if (onNavigateToEditor) {
        onNavigateToEditor();
      }
    } catch (err: any) {
      setError(`Erreur chargement document: ${err.message}`);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const response = await api.post('api/folders/', {
        name: newFolderName,
        icon: newFolderIcon,
        color: newFolderColor,
        parent_id: currentFolder
      });
      
      // Ajouter le nouveau dossier localement
      const newFolder = response.data;
      setFolders(prev => [...prev, newFolder]);
      
      setNewFolderName('');
      setNewFolderIcon('📁');
      setNewFolderColor('#3B82F6');
      setShowCreateFolder(false);
      
    } catch (err: any) {
      // Si l'API échoue, créer un dossier temporaire localement
      console.warn('API non disponible, création locale:', err);
      const tempFolder: Folder = {
        id: Date.now(), // ID temporaire
        name: newFolderName,
        description: '',
        color: newFolderColor,
        icon: newFolderIcon,
        position: folders.length,
        full_path: currentFolder ? `${currentFolder}/${newFolderName}` : newFolderName,
        documents_count: 0,
        total_documents_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        parent_id: currentFolder ?? undefined
      };
      
      setFolders(prev => [...prev, tempFolder]);
      setNewFolderName('');
      setNewFolderIcon('📁');
      setNewFolderColor('#3B82F6');
      setShowCreateFolder(false);
    }
  };

  const deleteDocument = async (documentId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;
    
    try {
      await api.delete(`api/documents/${documentId}/`);
      // Mise à jour locale
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      setShowDocumentMenu(null);
    } catch (err: any) {
      // Suppression locale si l'API échoue
      console.warn('API non disponible, suppression locale:', err);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      setShowDocumentMenu(null);
    }
  };

  const moveDocumentToFolder = async (documentId: number, folderId: number | undefined) => {
    console.log('🔄 moveDocumentToFolder appelé:', { documentId, folderId });
    
    try {
      console.log('📡 Tentative API patch...');
      await api.patch(`api/documents/${documentId}/`, {
        folder_id: folderId
      });
      
      console.log('✅ API patch réussie');
      
      // Mise à jour locale (pas de rechargement, ça écraserait les modifs)
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, folder_id: folderId }
          : doc
      ));
      
      setShowMoveModal(null);
      alert(`✅ Document déplacé avec succès !`);
      
    } catch (err: any) {
      // Mise à jour locale si l'API échoue (mode local)
      console.warn('API non disponible, déplacement local:', err);
      
      // Activer le mode local pour forcer la sauvegarde dans localStorage
      setIsUsingDemoData(true);
      
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, folder_id: folderId }
          : doc
      ));
      setShowMoveModal(null);
      alert(`💾 Document déplacé en local (sauvegardé dans le navigateur)`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB < 1) {
      return `${Math.round(sizeInMB * 1024)} KB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'pdf_import':
        return 'bg-red-100 text-red-800';
      case 'craftjs_project':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getDocumentCountForFolder = (folderId: number): number => {
    // Compter les documents directement dans ce dossier
    const directCount = documents.filter(doc => doc.folder_id === folderId).length;
    
    // Compter récursivement les documents dans les sous-dossiers
    const subFolders = folders.filter(f => f.parent_id === folderId);
    const subFoldersCount = subFolders.reduce((sum, subFolder) => {
      return sum + getDocumentCountForFolder(subFolder.id);
    }, 0);
    
    return directCount + subFoldersCount;
  };

  const getCurrentLevelFolders = () => {
    const filtered = folders.filter(folder => {
      // Traiter null et undefined comme équivalents pour la racine
      if (currentFolder === null) {
        return folder.parent_id === null || folder.parent_id === undefined;
      }
      return folder.parent_id === currentFolder;
    });
    console.log(`getCurrentLevelFolders: currentFolder=${currentFolder}, folders=`, folders, 'filtered=', filtered);
    return filtered;
  };

  const getFolderPath = () => {
    if (!currentFolder) return [];
    
    const path: Folder[] = [];
    let folder = folders.find(f => f.id === currentFolder);
    
    while (folder) {
      path.unshift(folder);
      folder = folders.find(f => f.id === folder?.parent_id);
    }
    
    return path;
  };

  const filteredDocuments = documents.filter(doc => {
    // Filtrer par dossier actuel
    const isInCurrentFolder = currentFolder === null 
      ? (doc.folder_id === null || doc.folder_id === undefined)
      : doc.folder_id === currentFolder;
    
    // Filtrer par recherche textuelle
    const matchesSearch = searchQuery === '' || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return isInCurrentFolder && matchesSearch;
  });

  const DocumentCard = ({ document }: { document: Document }) => (
    <Card className={`transition-all hover:shadow-md ${
      selectedDocument === document.id ? 'ring-2 ring-primary' : ''
    } relative`}>
      <div 
        className="cursor-pointer"
        onClick={() => loadDocument(document.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base font-semibold line-clamp-1">
                {document.title}
              </CardTitle>
              <CardDescription className="text-sm mt-1 line-clamp-2">
                {document.description}
              </CardDescription>
            </div>
            <Badge className={`ml-2 text-xs ${getDocumentTypeColor(document.document_type)}`}>
              {document.document_type_display}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(document.created_at)}
              </span>
              <span>{formatFileSize(document.file_size_mb)}</span>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Menu à 3 points */}
      <div className="absolute top-3 right-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setShowDocumentMenu(showDocumentMenu === document.id ? null : document.id);
          }}
          className="h-8 w-8 p-0"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
        
        {showDocumentMenu === document.id && (
          <div className="absolute right-0 top-8 w-48 bg-popover rounded-lg shadow-lg border border-border py-1 z-50">
            <Button
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                loadDocument(document.id);
                setShowDocumentMenu(null);
              }}
              className="w-full justify-start px-3 py-2 h-auto text-sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              Voir le document
            </Button>
            <Button
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                loadDocument(document.id);
                setShowDocumentMenu(null);
              }}
              className="w-full justify-start px-3 py-2 h-auto text-sm"
            >
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <Button
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                console.log('🔄 Ouverture modal déplacement pour document:', document.id);
                setShowMoveModal(document.id);
                setShowDocumentMenu(null);
              }}
              className="w-full justify-start px-3 py-2 h-auto text-sm"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Déplacer vers dossier
            </Button>
            <Button
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                deleteDocument(document.id);
              }}
              className="w-full justify-start px-3 py-2 h-auto text-sm text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        )}
      </div>
    </Card>
  );

  const FolderCard = ({ folder }: { folder: Folder }) => {
    const documentCount = getDocumentCountForFolder(folder.id);
    
    return (
      <Card 
        className="cursor-pointer transition-all hover:shadow-md"
        onClick={() => setCurrentFolder(folder.id)}
      >
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
              style={{ backgroundColor: folder.color + '20' }}
            >
              {folder.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base">{folder.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {documentCount} document{documentCount !== 1 ? 's' : ''}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Indicateur mode démo */}
      {isUsingDemoData && (
        <div className="bg-[#A75E27]/10 border border-[#A75E27]/20 rounded-lg p-3 flex items-center gap-2">
          <span className="text-[#A75E27] text-sm">
            💾 <strong>Mode Local</strong> : Vos modifications sont sauvegardées dans votre navigateur et persistent entre les sessions (API serveur non disponible)
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">📁 Mes documents</h1>
          <p className="text-muted-foreground">
            Gérez vos offres et documents créés
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {isUsingDemoData && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm('Voulez-vous réinitialiser toutes les données de démonstration ?')) {
                  localStorage.removeItem('demo_documents');
                  localStorage.removeItem('demo_folders');
                  window.location.reload();
                }
              }}
              className="text-red-600 hover:text-red-700"
            >
              🔄 Réinitialiser
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadFolders();
              loadDocuments(true); // Force reload
            }}
          >
            🔄 Actualiser
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateFolder(true)}
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            Nouveau dossier
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau document
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      {(currentFolder || getFolderPath().length > 0) && (
        <div className="flex items-center space-x-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentFolder(null)}
            className="p-1 h-auto"
          >
            <Home className="w-4 h-4" />
          </Button>
          
          {getFolderPath().map((folder) => (
            <React.Fragment key={folder.id}>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentFolder(folder.id)}
                className="p-1 h-auto font-medium"
              >
                {folder.name}
              </Button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Breadcrumbs */}
      {currentFolder && (
        <div className="flex items-center space-x-2 mb-4 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentFolder(null)}
            className="h-8 px-2"
          >
            <Home className="w-4 h-4 mr-1" />
            Racine
          </Button>
          {getFolderPath().map((folder) => (
            <div key={folder.id} className="flex items-center space-x-2">
              <ChevronRight className="w-4 h-4" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentFolder(folder.id)}
                className="h-8 px-2"
              >
                {folder.icon} {folder.name}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans les documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Chargement...</span>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => loadDocuments(true)} className="mt-4">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {/* Folders - Utiliser getCurrentLevelFolders() pour afficher les bons dossiers */}
            {getCurrentLevelFolders().map((folder) => (
              <FolderCard key={`folder-${folder.id}`} folder={folder} />
            ))}

            {/* Documents */}
            {filteredDocuments.map((document) => (
              <DocumentCard key={`doc-${document.id}`} document={document} />
            ))}
          </div>
          
        </>
      )}

      {/* Empty state */}
      {!isLoading && getCurrentLevelFolders().length === 0 && filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {currentFolder ? 'Dossier vide' : 'Aucun document'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {currentFolder 
                ? 'Ce dossier ne contient aucun document pour le moment' 
                : 'Créez votre première offre pour commencer'
              }
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Créer un document
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de création de dossier */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Créer un nouveau dossier</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateFolder(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom du dossier</label>
                <Input
                  placeholder="Mon nouveau dossier"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Icône</label>
                <div className="flex space-x-2">
                  {['📁', '📊', '💼', '🎨', '📝', '🔧'].map((icon) => (
                    <Button
                      key={icon}
                      variant={newFolderIcon === icon ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewFolderIcon(icon)}
                      className="text-lg"
                    >
                      {icon}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Couleur</label>
                <div className="flex space-x-2">
                  {[
                    '#3B82F6', // Blue
                    '#10B981', // Green
                    '#F59E0B', // Orange
                    '#EF4444', // Red
                    '#8B5CF6', // Purple
                    '#06B6D4'  // Cyan
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewFolderColor(color)}
                      className={`w-8 h-8 rounded-lg border-2 ${
                        newFolderColor === color ? 'border-foreground' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateFolder(false)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={createFolder}
                  disabled={!newFolderName.trim()}
                >
                  Créer le dossier
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de déplacement de document */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Déplacer le document</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMoveModal(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>
                Choisissez un dossier de destination
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Option racine */}
              <Button
                variant="outline"
                onClick={() => moveDocumentToFolder(showMoveModal as number, undefined)}
                className="w-full justify-start p-4 h-auto"
              >
                <Home className="w-4 h-4 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Racine</p>
                  <p className="text-xs text-muted-foreground">Aucun dossier parent</p>
                </div>
              </Button>

              {/* Liste des dossiers */}
              {folders.map((folder) => {
                const count = getDocumentCountForFolder(folder.id);
                return (
                  <Button
                    key={folder.id}
                    variant="outline"
                    onClick={() => moveDocumentToFolder(showMoveModal as number, folder.id)}
                    className="w-full justify-start p-4 h-auto"
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm"
                      style={{ backgroundColor: folder.color + '20' }}
                    >
                      {folder.icon}
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{folder.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {count} document{count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </Button>
                );
              })}

              {folders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun dossier disponible</p>
                  <p className="text-xs">Créez d'abord un dossier</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ModernDocumentLibrary;
