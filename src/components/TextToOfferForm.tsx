import React, { useState } from 'react';
import { api } from '../api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  FileText, 
  Building2, 
  Sparkles, 
  Loader2,
  AlertCircle,
  Wand2
} from 'lucide-react';

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

interface TextToOfferFormProps {
  onNavigateToEditor?: (offerData: any) => void;
}

const TextToOfferForm: React.FC<TextToOfferFormProps> = ({ onNavigateToEditor }) => {
  const [text, setText] = useState('');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: 'Invitation au Voyage',
    address: '123 Rue de l\'Innovation, 75001 Paris',
    phone: '+33 1 23 45 67 89',
    email: 'contact@invitationauvoyage.fr',
    website: 'www.invitationauvoyage.fr'
  });
  const [generatedOffer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const handleGenerateCompleteOffer = async () => {
    if (!text.trim()) {
      setError('Veuillez saisir une description de votre demande.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('api/generate-travel-offer/', {
        text: text,
        company_info: companyInfo
      });

      const offerData = response.data;
      
      if (onNavigateToEditor) {
        // Naviguer vers l'éditeur avec les données
        onNavigateToEditor(offerData);
      } else {
        console.log('Offre complète générée:', offerData);
      }

    } catch (err: any) {
      setError(err.detail || 'Erreur lors de la génération de l\'offre complète');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Générateur d'Offres IA</h1>
            <p className="text-muted-foreground">
              Transformez votre texte en offre commerciale professionnelle
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Formulaire de saisie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Votre Demande</span>
            </CardTitle>
            <CardDescription>
              Décrivez votre projet et vos informations d'entreprise
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Décrivez votre projet ou service
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ex: Je souhaite créer un site web e-commerce pour vendre des produits artisanaux. Le site doit inclure un catalogue, un panier d'achat, et un système de paiement sécurisé..."
                className="flex min-h-[120px] w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary/60 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200 resize-vertical"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-foreground">Informations de l'entreprise</h4>
              </div>
              
              <div className="grid gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Nom de l'entreprise</label>
                  <Input
                    type="text"
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                    placeholder="Nom de l'entreprise"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Adresse</label>
                  <Input
                    type="text"
                    value={companyInfo.address}
                    onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})}
                    placeholder="Adresse"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Téléphone</label>
                  <Input
                    type="text"
                    value={companyInfo.phone}
                    onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})}
                    placeholder="Téléphone"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <Input
                    type="email"
                    value={companyInfo.email}
                    onChange={(e) => setCompanyInfo({...companyInfo, email: e.target.value})}
                    placeholder="Email"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Site web</label>
                  <Input
                    type="text"
                    value={companyInfo.website}
                    onChange={(e) => setCompanyInfo({...companyInfo, website: e.target.value})}
                    placeholder="Site web"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleGenerateCompleteOffer}
              disabled={loading}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Créer avec l'éditeur visuel
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Résultat */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Aperçu de l'offre</span>
            </CardTitle>
            <CardDescription>
              Votre offre générée apparaîtra ici
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="min-h-[400px]">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-4 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              
              {loading && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p className="text-sm">Génération de votre offre en cours...</p>
                </div>
              )}
              
              {generatedOffer && (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono bg-muted/30 p-4 rounded-lg">
                    {generatedOffer}
                  </pre>
                </div>
              )}
              
              {!generatedOffer && !loading && !error && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="w-16 h-16 bg-muted/30 rounded-2xl flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-medium mb-1">Votre offre générée apparaîtra ici</p>
                  <p className="text-xs opacity-80">
                    Remplissez le formulaire et cliquez sur "Créer avec l'éditeur visuel"
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <span>Comment ça marche ?</span>
          </CardTitle>
          <CardDescription>
            Un processus simple en 4 étapes pour créer votre offre
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto">
                <span className="text-lg">1️⃣</span>
              </div>
              <h4 className="font-semibold text-sm">Décrivez votre projet</h4>
              <p className="text-xs text-muted-foreground">
                Expliquez en détail ce que vous proposez à votre client
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto">
                <span className="text-lg">2️⃣</span>
              </div>
              <h4 className="font-semibold text-sm">Remplissez vos infos</h4>
              <p className="text-xs text-muted-foreground">
                Ajoutez les coordonnées de votre entreprise
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto">
                <span className="text-lg">3️⃣</span>
              </div>
              <h4 className="font-semibold text-sm">Générez l'offre</h4>
              <p className="text-xs text-muted-foreground">
                L'IA crée une offre professionnelle automatiquement
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto">
                <span className="text-lg">4️⃣</span>
              </div>
              <h4 className="font-semibold text-sm">Éditez et personnalisez</h4>
              <p className="text-xs text-muted-foreground">
                Utilisez l'éditeur visuel pour finaliser votre offre
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TextToOfferForm;
