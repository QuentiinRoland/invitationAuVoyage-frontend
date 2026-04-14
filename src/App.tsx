import { useState } from "react";
import { Clock } from "lucide-react";
import "./App.css";
import AskOnceForm from "./components/PdfReaderForm";
import TextToOfferForm from "./components/TextToOfferForm";
// import OfferEditor from "./components/CraftJSEditor";
import OfferEditor from "./components/BlockNoteEditor";
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
  const [showOfferHistory, setShowOfferHistory] = useState(false);

  const handleSaveOffer = (data: any) => {
    console.log('Offre sauvegardée:', data);
    // TODO: Implémenter la sauvegarde
  };


  const handleNavigateToEditor = (offerData?: any) => {
    console.log('🎯 handleNavigateToEditor appelé avec:', offerData);
    console.log('📊 Structure:', {
      hasOfferStructure: !!offerData?.offer_structure,
      hasAssets: !!offerData?.assets,
      assetsCount: offerData?.assets?.length,
      title: offerData?.offer_structure?.title
    });
    
    if (offerData) {
      // Pass data directly via state instead of sessionStorage
      setEditorData(offerData);
      console.log('✅ editorData mis à jour');
    } else {
      console.warn('⚠️ Aucune donnée fournie à handleNavigateToEditor');
    }
    setDocumentId(undefined); // Reset document ID pour les nouvelles données
    setActiveTab('offer-editor');
    console.log('✅ Changement vers offer-editor');
  };

  const handleLoadDocument = (documentData: any) => {
    console.log('Chargement document:', documentData);
    setEditorData(documentData);
    setDocumentId(documentData.id);
    setActiveTab('offer-editor');
  };

  // Check for imported data (no longer using sessionStorage)
  const checkForImportedData = () => {
    // Data is now passed directly via props
    return editorData || null;
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
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold capitalize text-foreground">
                {activeTab === 'dashboard' ? 'Dashboard' :
                 activeTab === 'text-to-offer' ? 'Créer une offre' :
                 activeTab === 'pdf-import' ? 'Importer PDF' :
                 activeTab === 'document-library' ? 'Mes documents' :
                 activeTab === 'offer-editor' ? 'Éditeur visuel' : activeTab}
              </h2>
              {activeTab === 'text-to-offer' && (
                <button
                  onClick={() => setShowOfferHistory(true)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors border border-gray-200 hover:border-purple-200"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Historique
                </button>
              )}
            </div>
            <UserMenu />
          </header>

          {/* Page Content */}
          <main className={`flex-1 overflow-auto ${['offer-editor', 'text-to-offer', 'pdf-import'].includes(activeTab) ? '' : 'p-6'}`}>
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
                <TextToOfferForm
                  onNavigateToEditor={handleNavigateToEditor}
                  showHistory={showOfferHistory}
                  onCloseHistory={() => setShowOfferHistory(false)}
                />
              </ProtectedRoute>
            )}
            {activeTab === 'offer-editor' && (
              <ProtectedRoute>
                <OfferEditor
                  key={documentId ? `doc-${documentId}` : (editorData ? `import-${editorData.document_id || editorData.offer_structure?.title || Date.now()}` : 'default')}
                  onSave={handleSaveOffer}
                  prefilledData={editorData}
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
                <PDFImportPage 
                  apiBaseUrl={API_BASE_URL}
                  onNavigateToEditor={handleNavigateToEditor}
                />
              </ProtectedRoute>
            )}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
