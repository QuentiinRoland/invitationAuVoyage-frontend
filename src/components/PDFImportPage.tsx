import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Upload, 
  FileText, 
  Building2, 
  Phone, 
  Mail, 
  Loader2,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';

interface PDFImportPageProps {
  apiBaseUrl?: string;
  onNavigateToEditor?: () => void;
}

const PDFImportPage: React.FC<PDFImportPageProps> = ({ 
  apiBaseUrl = 'http://127.0.0.1:8003/api',
  onNavigateToEditor
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Invitation au Voyage',
    phone: '+33 1 23 45 67 89',
    email: 'contact@invitationauvoyage.fr',
    address: '',
    website: ''
  });

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

      // Stocker les données dans sessionStorage pour les passer à GrapesJSEditor
      const dataToStore = {
        offer_structure: data.offer_structure,
        assets: data.assets,
        company_info: data.company_info,
        background_url: data.background_url,
        logo_data_url: data.logo_data_url
      };
      console.log('💾 Stockage dans sessionStorage:', {
        ...dataToStore,
        assets: dataToStore.assets?.length || 0
      });
      sessionStorage.setItem('importedPdfData', JSON.stringify(dataToStore));

      // Rediriger vers GrapesJSEditor
      if (onNavigateToEditor) {
        onNavigateToEditor();
      }
      
    } catch (e: any) {
      console.error(e);
      alert(`❌ Erreur import: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Importer un PDF d'offre</h1>
            <p className="text-muted-foreground">
              Uploadez votre PDF d'offre de voyage et nous le convertirons automatiquement 
              en sections éditables dans l'éditeur GrapesJS.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Zone de drop */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Importation PDF</span>
            </CardTitle>
            <CardDescription>
              Glissez-déposez votre fichier PDF ou cliquez pour le sélectionner
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                ${dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }
              `}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              {isLoading ? (
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-primary font-medium">
                    Traitement du PDF en cours...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-muted/30 rounded-2xl flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Glissez-déposez votre PDF ici
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      ou cliquez pour sélectionner un fichier
                    </p>
                    <Button variant="outline" className="pointer-events-none">
                      <Upload className="w-4 h-4 mr-2" />
                      Choisir un fichier PDF
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <input
              id="fileInput"
              type="file"
              accept="application/pdf"
              onChange={handleFileInput}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Informations entreprise */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="w-5 h-5" />
              <span>Informations entreprise</span>
            </CardTitle>
            <CardDescription>
              Ces informations seront utilisées pour personnaliser votre offre (optionnel)
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Nom de l'entreprise
              </label>
              <Input
                type="text"
                value={companyInfo.name}
                onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                placeholder="Nom de l'entreprise"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center space-x-1">
                  <Phone className="w-3 h-3" />
                  <span>Téléphone</span>
                </label>
                <Input
                  type="text"
                  value={companyInfo.phone}
                  onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})}
                  placeholder="+33 1 23 45 67 89"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center space-x-1">
                  <Mail className="w-3 h-3" />
                  <span>Email</span>
                </label>
                <Input
                  type="email"
                  value={companyInfo.email}
                  onChange={(e) => setCompanyInfo({...companyInfo, email: e.target.value})}
                  placeholder="contact@entreprise.fr"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>Comment ça fonctionne ?</span>
          </CardTitle>
          <CardDescription>
            Un processus simple pour convertir votre PDF en offre éditable
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto">
                <span className="text-lg">1️⃣</span>
              </div>
              <h4 className="font-semibold text-sm">Uploadez votre PDF</h4>
              <p className="text-xs text-muted-foreground">
                Glissez-déposez ou sélectionnez votre fichier PDF d'offre
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto">
                <span className="text-lg">2️⃣</span>
              </div>
              <h4 className="font-semibold text-sm">Traitement automatique</h4>
              <p className="text-xs text-muted-foreground">
                Notre IA extrait le contenu et structure votre offre
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto">
                <span className="text-lg">3️⃣</span>
              </div>
              <h4 className="font-semibold text-sm">Édition libre</h4>
              <p className="text-xs text-muted-foreground">
                Modifiez et personnalisez votre offre dans l'éditeur visuel
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bouton retour */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'accueil</span>
        </Button>
      </div>
    </div>
  );
};

export default PDFImportPage;
