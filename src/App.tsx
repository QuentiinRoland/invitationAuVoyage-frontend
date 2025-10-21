import { useState } from "react";
import "./App.css";
import AskOnceForm from "./components/PdfReaderForm";
import TextToOfferForm from "./components/TextToOfferForm";
import OfferEditor from "./components/GrapesJSEditor";
import PDFReformatter from "./components/PDFReformatter";
import PDFImportPage from "./components/PDFImportPage";
import DocumentLibrary from "./components/ModernDocumentLibrary";
import Dashboard from "./components/Dashboard";
import { AuthProvider } from "./contexts/SimpleAuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import UserMenu from "./components/auth/UserMenu";
import { Sidebar } from "./components/ui/sidebar";
import { API_BASE_URL } from "./config/api";

type TabType = 'dashboard' | 'pdf-reader' | 'text-to-offer' | 'offer-editor' | 'pdf-reformatter' | 'pdf-import' | 'document-library';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [editorData, setEditorData] = useState<any>(null);
  const [documentId, setDocumentId] = useState<number | undefined>(undefined);

  const handleSaveOffer = (data: any) => {
    console.log('Offre sauvegardée:', data);
    // TODO: Implémenter la sauvegarde
  };


  const handleNavigateToEditor = (offerData: any) => {
    console.log('Navigation vers éditeur avec données:', offerData);
    setEditorData(offerData);
    setDocumentId(undefined); // Reset document ID pour les nouvelles données
    setActiveTab('offer-editor');
  };

  const handleLoadDocument = (documentData: any) => {
    console.log('Chargement document:', documentData);
    setEditorData(documentData);
    setDocumentId(documentData.id);
    setActiveTab('offer-editor');
  };

  // Vérifier s'il y a des données importées depuis PDFImportPage
  const checkForImportedData = () => {
    const importedData = sessionStorage.getItem('importedPdfData');
    if (importedData) {
      const data = JSON.parse(importedData);
      console.log('📥 Récupération depuis sessionStorage:', {
        ...data,
        assets: data.assets?.length || 0
      });
      setEditorData(data);
      sessionStorage.removeItem('importedPdfData'); // Nettoyer après utilisation
      return data;
    }
    return null;
  };

  return (
    <AuthProvider>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <Sidebar 
            activeTab={activeTab} 
            onTabChange={(tab) => setActiveTab(tab as TabType)} 
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold capitalize text-foreground">
                {activeTab === 'dashboard' ? 'Dashboard' : 
                 activeTab === 'text-to-offer' ? 'Créer une offre' :
                 activeTab === 'pdf-import' ? 'Importer PDF' :
                 activeTab === 'document-library' ? 'Mes documents' :
                 activeTab === 'offer-editor' ? 'Éditeur visuel' : activeTab}

              </h2>
            </div>
            <UserMenu />
          </header>

          {/* Page Content */}
          <main className={`flex-1 overflow-auto ${activeTab === 'offer-editor' ? '' : 'p-6'}`}>
            {activeTab === 'dashboard' && (
              <ProtectedRoute>
                <Dashboard 
                  onNavigate={(tab) => setActiveTab(tab as TabType)} 
                  isActive={activeTab === 'dashboard'}
                />
              </ProtectedRoute>
            )}
            {activeTab === 'text-to-offer' && (
              <ProtectedRoute>
                <div className="max-w-4xl mx-auto">
                  <TextToOfferForm onNavigateToEditor={handleNavigateToEditor} />
                </div>
              </ProtectedRoute>
            )}
            {activeTab === 'offer-editor' && (
              <ProtectedRoute>
                <OfferEditor 
                  onSave={handleSaveOffer}
                  prefilledData={editorData || checkForImportedData()}
                  documentId={documentId}
                />
              </ProtectedRoute>
            )}
            {activeTab === 'document-library' && (
              <ProtectedRoute>
                <DocumentLibrary 
                  onLoadDocument={handleLoadDocument}
                  onNavigateToEditor={() => setActiveTab('offer-editor')}
                  isActive={activeTab === 'document-library'}
                />
              </ProtectedRoute>
            )}
            {activeTab === 'pdf-import' && (
              <ProtectedRoute>
                <div className="max-w-4xl mx-auto">
                  <PDFImportPage 
                    apiBaseUrl={API_BASE_URL}
                    onNavigateToEditor={() => setActiveTab('offer-editor')}
                  />
                </div>
              </ProtectedRoute>
            )}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
