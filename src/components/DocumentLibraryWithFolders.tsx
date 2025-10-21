import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { api } from '../api/client';

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
  subfolders: Folder[];
}

interface DocumentLibraryProps {
  apiBaseUrl?: string;
  onLoadDocument?: (documentData: any) => void;
  onNavigateToEditor?: () => void;
}

const DocumentLibraryWithFolders: React.FC<DocumentLibraryProps> = ({
  onLoadDocument,
  onNavigateToEditor
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [currentFolder, setCurrentFolder] = useState<number | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showMoveDocument, setShowMoveDocument] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [folderPath, setFolderPath] = useState<Folder[]>([]);

  // Charger tous les dossiers
  const loadFolders = async () => {
    try {
      const response = await api.get('api/folders/');
      const data = response.data;
      setFolders(data);
    } catch (err: any) {
      console.error('Erreur chargement dossiers:', err);
    }
  };

  // Charger les documents (filtrés par dossier si nécessaire)
  const loadDocuments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (currentFolder) {
        // Charger les documents d'un dossier spécifique
        const response = await api.get(`api/folders/${currentFolder}/documents/`);
        const folderData = response.data;
        setDocuments(folderData.documents);
        
        // Mettre à jour le chemin de navigation
        updateFolderPath(currentFolder);
      } else {
        // Charger tous les documents (racine)
        const response = await api.get('api/documents/');
        const data = response.data;
        // Filtrer les documents sans dossier pour la vue racine
        setDocuments(data.filter((doc: Document) => !doc.folder_id));
        setFolderPath([]);
      }
    } catch (err: any) {
      setError(`Erreur chargement: ${err.message}`);
      console.error('Erreur chargement documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour le chemin de navigation
  const updateFolderPath = (folderId: number) => {
    const findFolderPath = (folders: Folder[], targetId: number, path: Folder[] = []): Folder[] | null => {
      for (const folder of folders) {
        if (folder.id === targetId) {
          return [...path, folder];
        }
        if (folder.subfolders.length > 0) {
          const result = findFolderPath(folder.subfolders, targetId, [...path, folder]);
          if (result) return result;
        }
      }
      return null;
    };

    const path = findFolderPath(folders, folderId);
    setFolderPath(path || []);
  };

  // Créer un nouveau dossier
  const createFolder = async (name: string, icon: string, color: string) => {
    try {
      await api.post('api/folders/', {
        name,
        icon,
        color,
        parent_id: currentFolder
      });
      
      await loadFolders();
      setShowCreateFolder(false);
      alert(`✅ Dossier "${name}" créé avec succès !`);
    } catch (err: any) {
      setError(`Erreur création dossier: ${err.message}`);
    }
  };

  // Déplacer un document vers un dossier
  const moveDocument = async (documentId: number, folderId: number | null) => {
    try {
      await api.post(`api/documents/${documentId}/move-to-folder/`, {
        folder_id: folderId
      });
      
      await loadDocuments();
      setShowMoveDocument(null);
      alert('✅ Document déplacé avec succès !');
    } catch (err: any) {
      setError(`Erreur déplacement: ${err.message}`);
    }
  };

  // Supprimer un dossier
  const deleteFolder = async (folderId: number, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le dossier "${name}" ?`)) return;
    
    try {
      await api.delete(`api/folders/${folderId}/`);
      
      await loadFolders();
      if (currentFolder === folderId) {
        setCurrentFolder(null);
        await loadDocuments();
      }
      alert(`Dossier "${name}" supprimé avec succès`);
    } catch (err: any) {
      setError(`Erreur suppression: ${err.message}`);
    }
  };

  // Charger un document spécifique
  const loadDocument = async (documentId: number) => {
    setIsLoading(true);
    
    try {
      const response = await api.get(`api/documents/${documentId}/`);
      const documentData = response.data;
      
      if (onLoadDocument) {
        onLoadDocument(documentData);
      }
      
      if (onNavigateToEditor) {
        onNavigateToEditor();
      }
      
    } catch (err: any) {
      setError(`Erreur chargement document: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Supprimer un document
  const deleteDocument = async (documentId: number, title: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${title}" ?`)) return;
    
    try {
      await api.delete(`api/documents/${documentId}/`);
      
      await loadDocuments();
      alert(`Document "${title}" supprimé avec succès`);
      
    } catch (err: any) {
      setError(`Erreur suppression: ${err.message}`);
    }
  };

  // Générer un PDF à partir d'un document
  const generatePDF = async (documentId: number, title: string) => {
    setIsLoading(true);
    
    try {
      const response = await api.post(`api/documents/${documentId}/generate-pdf/`, {}, {
        responseType: 'blob'
      });
      
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      
    } catch (err: any) {
      setError(`Erreur génération PDF: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtenir les dossiers du niveau actuel
  const getCurrentLevelFolders = () => {
    if (currentFolder) {
      const currentFolderData = findFolderById(folders, currentFolder);
      return currentFolderData?.subfolders || [];
    }
    return folders; // Dossiers racines
  };

  const findFolderById = (folders: Folder[], id: number): Folder | null => {
    for (const folder of folders) {
      if (folder.id === id) return folder;
      const found = findFolderById(folder.subfolders, id);
      if (found) return found;
    }
    return null;
  };

  // Charger les données au montage
  useEffect(() => {
    loadFolders();
    loadDocuments();
  }, [currentFolder]);

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#F8F9FA',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* En-tête */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ 
                color: '#2C3E50', 
                margin: '0 0 10px 0',
                fontSize: '28px',
                fontWeight: '700'
              }}>
                🗂️ Bibliothèque de Documents
              </h1>
              <p style={{ 
                color: '#7F8C8D', 
                margin: 0,
                fontSize: '16px'
              }}>
                Organisez vos offres en dossiers et gérez vos projets
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                style={{
                  backgroundColor: '#9B59B6',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {viewMode === 'grid' ? '📋 Liste' : '🔲 Grille'}
              </button>
              
              <button
                onClick={() => setShowCreateFolder(true)}
                style={{
                  backgroundColor: '#27AE60',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                📁 Nouveau dossier
              </button>
              
              <button
                onClick={() => { loadFolders(); loadDocuments(); }}
                disabled={isLoading}
                style={{
                  backgroundColor: '#3498DB',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: isLoading ? 0.6 : 1
                }}
              >
                🔄 Actualiser
              </button>
            </div>
          </div>

          {/* Fil d'Ariane */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setCurrentFolder(null)}
              style={{
                background: currentFolder === null ? '#3498DB' : '#ECF0F1',
                color: currentFolder === null ? 'white' : '#2C3E50',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              🏠 Accueil
            </button>
            
            {folderPath.map((folder, index) => (
              <React.Fragment key={folder.id}>
                <span style={{ color: '#95A5A6' }}></span>
                <button
                  onClick={() => setCurrentFolder(folder.id)}
                  style={{
                    background: index === folderPath.length - 1 ? '#3498DB' : '#ECF0F1',
                    color: index === folderPath.length - 1 ? 'white' : '#2C3E50',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  {folder.icon} {folder.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div style={{
            backgroundColor: '#E74C3C',
            color: 'white',
            padding: '15px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>❌</span>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                marginLeft: 'auto',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Indicateur de chargement */}
        {isLoading && (
          <div style={{
            backgroundColor: '#F39C12',
            color: 'white',
            padding: '15px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid white',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span>Chargement...</span>
          </div>
        )}

        {/* Contenu principal */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr',
          gap: '20px'
        }}>
          {/* Dossiers du niveau actuel */}
          {getCurrentLevelFolders().map((folder) => (
            <div
              key={`folder-${folder.id}`}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: selectedFolder === folder.id 
                  ? `0 8px 32px ${folder.color}40` 
                  : '0 4px 20px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                border: selectedFolder === folder.id ? `2px solid ${folder.color}` : '2px solid transparent',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedFolder(selectedFolder === folder.id ? null : folder.id)}
            >
              <div style={{
                padding: '20px',
                background: `linear-gradient(135deg, ${folder.color}15 0%, ${folder.color}05 100%)`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '32px' }}>{folder.icon}</span>
                    <div>
                      <h3 style={{
                        color: '#2C3E50',
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: '600'
                      }}>
                        {folder.name}
                      </h3>
                      <p style={{
                        color: '#7F8C8D',
                        margin: '5px 0 0 0',
                        fontSize: '13px'
                      }}>
                        {folder.total_documents_count} document{folder.total_documents_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
                
                {folder.description && (
                  <p style={{
                    color: '#7F8C8D',
                    margin: '0 0 15px 0',
                    fontSize: '14px',
                    lineHeight: '1.4'
                  }}>
                    {folder.description}
                  </p>
                )}

                {/* Actions du dossier */}
                {selectedFolder === folder.id && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '15px',
                    paddingTop: '15px',
                    borderTop: '1px solid #ECF0F1'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentFolder(folder.id);
                      }}
                      style={{
                        backgroundColor: folder.color,
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        flex: 1
                      }}
                    >
                      📂 Ouvrir
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFolder(folder.id, folder.name);
                      }}
                      style={{
                        backgroundColor: '#E74C3C',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Documents */}
          {documents.map((doc) => (
            <div
              key={`doc-${doc.id}`}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: selectedDocument === doc.id 
                  ? '0 8px 32px rgba(52, 152, 219, 0.3)' 
                  : '0 4px 20px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                border: selectedDocument === doc.id ? '2px solid #3498DB' : '2px solid transparent',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedDocument(selectedDocument === doc.id ? null : doc.id)}
            >
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #ECF0F1'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{
                    color: '#2C3E50',
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '600',
                    flex: 1,
                    marginRight: '10px'
                  }}>
                    {doc.title}
                  </h3>
                  
                  <span style={{
                    backgroundColor: doc.document_type === 'pdf_import' ? '#E74C3C' :
                                   doc.document_type === 'grapesjs_project' ? '#9B59B6' : '#27AE60',
                    color: 'white',
                    padding: '3px 6px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {doc.document_type_display}
                  </span>
                </div>
                
                {doc.description && (
                  <p style={{
                    color: '#7F8C8D',
                    margin: '0 0 10px 0',
                    fontSize: '13px',
                    lineHeight: '1.4'
                  }}>
                    {doc.description.length > 80 
                      ? doc.description.substring(0, 80) + '...' 
                      : doc.description}
                  </p>
                )}
                
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  fontSize: '12px',
                  color: '#95A5A6',
                  flexWrap: 'wrap'
                }}>
                  <span>📅 {formatDate(doc.updated_at)}</span>
                  {doc.has_pdf && <span>📄 PDF</span>}
                  {doc.assets_count > 0 && <span>🖼️ {doc.assets_count}</span>}
                  {doc.file_size_mb > 0 && <span>💾 {doc.file_size_mb} MB</span>}
                </div>
              </div>

              {/* Actions du document */}
              {selectedDocument === doc.id && (
                <div style={{
                  padding: '15px 20px',
                  backgroundColor: '#F8F9FA',
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      loadDocument(doc.id);
                    }}
                    style={{
                      backgroundColor: '#3498DB',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      flex: 1,
                      minWidth: '80px'
                    }}
                  >
                    ✏️ Éditer
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      generatePDF(doc.id, doc.title);
                    }}
                    style={{
                      backgroundColor: '#E74C3C',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      flex: 1,
                      minWidth: '80px'
                    }}
                  >
                    📄 PDF
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMoveDocument(doc.id);
                    }}
                    style={{
                      backgroundColor: '#F39C12',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    📁
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDocument(doc.id, doc.title);
                    }}
                    style={{
                      backgroundColor: '#95A5A6',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Message si vide */}
        {getCurrentLevelFolders().length === 0 && documents.length === 0 && !isLoading && (
          <div style={{
            backgroundColor: 'white',
            padding: '60px 30px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📂</div>
            <h3 style={{ color: '#2C3E50', marginBottom: '10px' }}>
              {currentFolder ? 'Dossier vide' : 'Aucun document'}
            </h3>
            <p style={{ color: '#7F8C8D' }}>
              {currentFolder ? 'Ce dossier ne contient aucun document pour le moment' : 'Créez ou importez un document pour commencer'}
            </p>
          </div>
        )}
      </div>

      {/* Modal de création de dossier */}
      {showCreateFolder && <CreateFolderModal onClose={() => setShowCreateFolder(false)} onCreate={createFolder} />}
      
      {/* Modal de déplacement de document */}
      {showMoveDocument && <MoveDocumentModal 
        documentId={showMoveDocument} 
        folders={folders} 
        onClose={() => setShowMoveDocument(null)} 
        onMove={moveDocument} 
      />}

      {/* Styles CSS */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Modal de création de dossier
const CreateFolderModal: React.FC<{
  onClose: () => void;
  onCreate: (name: string, icon: string, color: string) => void;
}> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [color, setColor] = useState('#3498DB');

  const icons = ['📁', '📂', '🗂️', '📋', '📊', '💼', '🎯', '⭐', '🏠', '🔥'];
  const colors = ['#3498DB', '#E74C3C', '#27AE60', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#34495E'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), icon, color);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '400px',
        width: '90%'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#2C3E50' }}>
          📁 Créer un nouveau dossier
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2C3E50' }}>
              Nom du dossier:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mon nouveau dossier"
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #ECF0F1',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2C3E50' }}>
              Icône:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {icons.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  style={{
                    padding: '8px',
                    border: icon === ic ? '2px solid #3498DB' : '2px solid #ECF0F1',
                    borderRadius: '6px',
                    backgroundColor: icon === ic ? '#3498DB20' : 'white',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2C3E50' }}>
              Couleur:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {colors.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setColor(col)}
                  style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: col,
                    border: color === col ? '3px solid #2C3E50' : '2px solid #ECF0F1',
                    borderRadius: '50%',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: '2px solid #ECF0F1',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#2C3E50',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: name.trim() ? color : '#BDC3C7',
                color: 'white',
                cursor: name.trim() ? 'pointer' : 'not-allowed',
                fontWeight: '600'
              }}
            >
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal de déplacement de document
const MoveDocumentModal: React.FC<{
  documentId: number;
  folders: Folder[];
  onClose: () => void;
  onMove: (documentId: number, folderId: number | null) => void;
}> = ({ documentId, folders, onClose, onMove }) => {
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);

  const renderFolders = (folders: Folder[], level = 0) => {
    return folders.map((folder) => (
      <div key={folder.id}>
        <div
          onClick={() => setSelectedFolder(folder.id)}
          style={{
            padding: '10px',
            marginLeft: `${level * 20}px`,
            backgroundColor: selectedFolder === folder.id ? '#3498DB20' : 'transparent',
            border: selectedFolder === folder.id ? '2px solid #3498DB' : '2px solid transparent',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '5px'
          }}
        >
          <span>{folder.icon}</span>
          <span>{folder.name}</span>
          <span style={{ color: '#7F8C8D', fontSize: '12px' }}>
            ({folder.documents_count} docs)
          </span>
        </div>
        {folder.subfolders.length > 0 && renderFolders(folder.subfolders, level + 1)}
      </div>
    ));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '70vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#2C3E50' }}>
          📁 Déplacer le document
        </h3>
        
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
          <div
            onClick={() => setSelectedFolder(null)}
            style={{
              padding: '10px',
              backgroundColor: selectedFolder === null ? '#3498DB20' : 'transparent',
              border: selectedFolder === null ? '2px solid #3498DB' : '2px solid transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
              fontWeight: '600'
            }}
          >
            <span>🏠</span>
            <span>Racine (aucun dossier)</span>
          </div>
          
          {renderFolders(folders)}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '2px solid #ECF0F1',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#2C3E50',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Annuler
          </button>
          <button
            onClick={() => onMove(documentId, selectedFolder)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: '#27AE60',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Déplacer
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentLibraryWithFolders;
