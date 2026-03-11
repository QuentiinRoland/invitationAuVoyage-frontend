import React, { useState } from 'react';
import { Button } from './ui/button';
import { 
  Upload, 
  Loader2,
  CheckCircle,
  Info,
  Sparkles,
  X,
  FileText
} from 'lucide-react';

interface PDFImportPageProps {
  apiBaseUrl?: string;
  onNavigateToEditor?: (data?: any) => void;
}

const PDFImportPage: React.FC<PDFImportPageProps> = ({ 
  apiBaseUrl = 'http://127.0.0.1:8003/api',
  onNavigateToEditor
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const companyInfo = {
    name: 'Invitation au Voyage',
    phone: '+33 1 23 45 67 89',
    email: 'contact@invitationauvoyage.fr',
    address: '',
    website: ''
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    console.log('🚀 Début upload PDF:', file.name, file.size, 'bytes');
    setIsLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('company_info', JSON.stringify(companyInfo));

      console.log('📤 Envoi vers:', `${apiBaseUrl}/pdf-to-gjs/`);
      const res = await fetch(`${apiBaseUrl}/pdf-to-gjs/`, {
        method: 'POST',
        mode: 'cors',
        body: form
      });
      
      console.log('📨 Réponse reçue:', res.status, res.statusText);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Erreur serveur:', errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      const data = await res.json();
      console.log('📊 Données reçues:', {
        titre: data.offer_structure?.title,
        sections: data.offer_structure?.sections?.length,
        images: data.assets?.length
      });

      const dataToStore = {
        offer_structure: data.offer_structure,
        company_info: data.company_info,
        document_id: data.document_id
      };
      console.log('💾 Données préparées pour l\'éditeur');

      if (onNavigateToEditor) {
        onNavigateToEditor(dataToStore);
      }
      
    } catch (e: any) {
      console.error(e);
      alert(`❌ Erreur import: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Please select a PDF file');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-12 gap-12">
          {/* Left Sidebar - Menu */}
          <div className="col-span-2">
            <nav className="space-y-1 sticky top-8">
              <div className="px-3 py-2 text-sm font-medium text-gray-900">
                Téléchargement PDF
              </div>
            </nav>
          </div>

          {/* Right Content Area */}
          <div className="col-span-10 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Import de document</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Info className="w-4 h-4" />
                <span>Téléchargez votre fichier PDF pour le convertir en format éditable</span>
              </div>
            </div>

            {/* Upload Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                dragActive
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-purple-400'
              }`}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-purple-600" />
                </div>
                
                <div>
                  <button className="text-sm font-medium text-purple-600 hover:text-purple-700 underline">
                    Cliquez pour télécharger
                  </button>
                  <span className="text-sm text-gray-500"> ou glissez-déposez</span>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF, JPG, PNG, GIF (Taille max 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Selected File Preview */}
            {selectedFile && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex gap-3">
                <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-purple-900 mb-1">Conversion par IA</h4>
                  <p className="text-xs text-purple-700">
                    Notre système extrait automatiquement le texte, les images et la structure de votre PDF. 
                    Le contenu sera converti en format éditable que vous pourrez personnaliser dans l'éditeur.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-6">
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                className="text-gray-600"
              >
                Annuler
              </Button>
              <Button
                onClick={() => selectedFile && handleFileUpload(selectedFile)}
                disabled={isLoading || !selectedFile}
                className="bg-black hover:bg-gray-800 text-white px-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Conversion...
                  </>
                ) : (
                  'Suivant'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFImportPage;
