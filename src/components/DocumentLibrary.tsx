import React, { useState, useEffect } from 'react';

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

const DocumentLibrary: React.FC<DocumentLibraryProps> = ({
  apiBaseUrl = 'http://127.0.0.1:8003/api',
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

  // Charger la liste des documents
  const loadDocuments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiBaseUrl}/documents/`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setDocuments(data);
    } catch (err: any) {
      setError(`Erreur chargement: ${err.message}`);
      console.error('Erreur chargement documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger un document spécifique
  const loadDocument = async (documentId: number) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${apiBaseUrl}/documents/${documentId}/`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const documentData = await response.json();
      
      // Passer les données au composant parent
      if (onLoadDocument) {
        onLoadDocument(documentData);
      }
      
      // Naviguer vers l'éditeur
      if (onNavigateToEditor) {
        onNavigateToEditor();
      }
      
    } catch (err: any) {
      setError(`Erreur chargement document: ${err.message}`);
      console.error('Erreur chargement document:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Supprimer un document
  const deleteDocument = async (documentId: number, title: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${title}" ?`)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${apiBaseUrl}/documents/${documentId}/`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      // Recharger la liste
      await loadDocuments();
      alert(`Document "${title}" supprimé avec succès`);
      
    } catch (err: any) {
      setError(`Erreur suppression: ${err.message}`);
      console.error('Erreur suppression document:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Générer un PDF à partir d'un document
  const generatePDF = async (documentId: number, title: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${apiBaseUrl}/documents/${documentId}/generate-pdf/`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }
      
      const blob = await response.blob();
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
      console.error('Erreur génération PDF:', err);
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

  // Charger les documents au montage du composant
  useEffect(() => {
    loadDocuments();
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#F8F9FA',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* En-tête */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ 
                color: '#2C3E50', 
                margin: '0 0 10px 0',
                fontSize: '28px',
                fontWeight: '700'
              }}>
                📚 Bibliothèque de Documents
              </h1>
              <p style={{ 
                color: '#7F8C8D', 
                margin: 0,
                fontSize: '16px'
              }}>
                Gérez vos offres sauvegardées et vos projets
              </p>
            </div>
            
            <button
              onClick={loadDocuments}
              disabled={isLoading}
              style={{
                backgroundColor: '#3498DB',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                opacity: isLoading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🔄 Actualiser
            </button>
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

        {/* Liste des documents */}
        {documents.length === 0 && !isLoading ? (
          <div style={{
            backgroundColor: 'white',
            padding: '60px 30px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📄</div>
            <h3 style={{ color: '#2C3E50', marginBottom: '10px' }}>
              Aucun document sauvegardé
            </h3>
            <p style={{ color: '#7F8C8D' }}>
              Créez ou importez un document pour commencer
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px'
          }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
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
                {/* En-tête de la carte */}
                <div style={{
                  padding: '20px',
                  borderBottom: '1px solid #ECF0F1'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <h3 style={{
                      color: '#2C3E50',
                      margin: 0,
                      fontSize: '18px',
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
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {doc.document_type_display}
                    </span>
                  </div>
                  
                  {doc.description && (
                    <p style={{
                      color: '#7F8C8D',
                      margin: '0 0 15px 0',
                      fontSize: '14px',
                      lineHeight: '1.4'
                    }}>
                      {doc.description.length > 100 
                        ? doc.description.substring(0, 100) + '...' 
                        : doc.description}
                    </p>
                  )}
                  
                  {/* Métadonnées */}
                  <div style={{
                    display: 'flex',
                    gap: '15px',
                    fontSize: '13px',
                    color: '#95A5A6'
                  }}>
                    <span>📅 {formatDate(doc.updated_at)}</span>
                    {doc.has_pdf && <span>📄 PDF</span>}
                    {doc.assets_count > 0 && <span>🖼️ {doc.assets_count} images</span>}
                    {doc.file_size_mb > 0 && <span>💾 {doc.file_size_mb} MB</span>}
                  </div>
                </div>

                {/* Actions (visibles quand sélectionné) */}
                {selectedDocument === doc.id && (
                  <div style={{
                    padding: '20px',
                    backgroundColor: '#F8F9FA',
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        loadDocument(doc.id);
                      }}
                      disabled={isLoading}
                      style={{
                        backgroundColor: '#3498DB',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        flex: 1,
                        minWidth: '100px'
                      }}
                    >
                      ✏️ Éditer
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        generatePDF(doc.id, doc.title);
                      }}
                      disabled={isLoading}
                      style={{
                        backgroundColor: '#E74C3C',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        flex: 1,
                        minWidth: '100px'
                      }}
                    >
                      📄 PDF
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDocument(doc.id, doc.title);
                      }}
                      disabled={isLoading}
                      style={{
                        backgroundColor: '#95A5A6',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
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
        )}
      </div>

      {/* Animation CSS */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DocumentLibrary;
