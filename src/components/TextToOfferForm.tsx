import React, { useState } from 'react';
import { api } from '../api/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Loader2,
  AlertCircle,
  Info
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

type OfferType = 'circuit' | 'sejour' | 'transport';

const TextToOfferForm: React.FC<TextToOfferFormProps> = ({ onNavigateToEditor }) => {
  const [text, setText] = useState('');
  const [offerType, setOfferType] = useState<OfferType>('circuit');
  const [flightInput, setFlightInput] = useState<string>('');
  const [websiteUrls, setWebsiteUrls] = useState<string[]>(['']);
  const [exampleTemplates, setExampleTemplates] = useState<string[]>(['']);
  const [companyInfo] = useState<CompanyInfo>({
    name: 'Invitation au Voyage',
    address: '123 Rue de l\'Innovation, 75001 Paris',
    phone: '+33 1 23 45 67 89',
    email: 'contact@invitationauvoyage.fr',
    website: 'www.invitationauvoyage.fr'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateCompleteOffer = async () => {
    if (!text.trim() && !flightInput.trim()) {
      setError('Veuillez saisir une description de votre demande OU des infos de vol.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const validUrls = websiteUrls.filter(url => url.trim() !== '');
      const validTemplates = exampleTemplates.filter(template => template.trim() !== '');
      
      const response = await api.post('api/generate-travel-offer/', {
        text: text,
        offer_type: offerType,
        flight_input: flightInput || undefined,
        website_urls: validUrls,
        example_templates: validTemplates,
        company_info: companyInfo
      });

      const offerData = response.data;
      
      if (response.data.metadata) {
        console.log('📊 MÉTADONNÉES:', response.data.metadata);
      }

      if (onNavigateToEditor && offerData) {
        onNavigateToEditor(offerData);
      }
      
    } catch (err: any) {
      console.error('Erreur lors de la génération:', err);
      setError(err.response?.data?.detail || err.message || 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  const addUrlField = () => setWebsiteUrls([...websiteUrls, '']);
  const removeUrlField = (index: number) => setWebsiteUrls(websiteUrls.filter((_, i) => i !== index));
  const updateUrlField = (index: number, value: string) => {
    const newUrls = [...websiteUrls];
    newUrls[index] = value;
    setWebsiteUrls(newUrls);
  };

  const addTemplateField = () => setExampleTemplates([...exampleTemplates, '']);
  const removeTemplateField = (index: number) => setExampleTemplates(exampleTemplates.filter((_, i) => i !== index));
  const updateTemplateField = (index: number, value: string) => {
    const newTemplates = [...exampleTemplates];
    newTemplates[index] = value;
    setExampleTemplates(newTemplates);
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
                Informations de l'offre
              </div>
              <div className="px-3 py-2 text-sm font-medium text-gray-500">
                Informations de vol
              </div>
              <div className="px-3 py-2 text-sm font-medium text-gray-500">
                Sources de contenu
              </div>
            </nav>
          </div>

          {/* Right Content Area */}
          <div className="col-span-10 space-y-8">
            {/* Offer & Flight Information Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Informations de l'offre</h2>

              {/* Offer Type */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  Type d'offre
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                      Choisissez le type d'offre de voyage
                    </div>
                  </div>
                </label>
                <select
                  value={offerType}
                  onChange={(e) => setOfferType(e.target.value as OfferType)}
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition-colors"
                >
                  <option value="">Sélectionner...</option>
                  <option value="circuit">Circuit - Multi-destinations</option>
                  <option value="sejour">Séjour - Destination unique</option>
                  <option value="transport">Transport - Vol uniquement</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  Description
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                      Optionnel si vous fournissez les infos de vol
                    </div>
                  </div>
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Saisissez une description..."
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition-colors resize-none"
                  rows={4}
                />
              </div>

              {/* Flight Details */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  Détails du vol - Format libre
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                      Collez les infos de vol directement. Formats acceptés : GDS, numéro de vol + date, ou texte libre
                    </div>
                  </div>
                </label>
                <textarea
                  value={flightInput}
                  onChange={(e) => setFlightInput(e.target.value)}
                  placeholder="Saisissez les infos de vol..."
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition-colors resize-none"
                  rows={3}
                />
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-2 font-medium">💡 Formats acceptés :</p>
                  <ul className="text-xs text-gray-500 space-y-1 ml-4">
                    <li>• <strong>Numéro de vol :</strong> AF001 18/11/2025</li>
                    <li>• <strong>Format GDS :</strong> 18NOV-25NOV BRU JFK 10:00 14:00</li>
                    <li>• <strong>Texte libre :</strong> Vol de Paris à New York le 18 novembre</li>
                  </ul>
                  <p className="text-xs text-purple-600 mt-2">
                    🚀 Notre système détecte automatiquement le format et recherche les informations via Amadeus (500+ compagnies)
                  </p>
                </div>
              </div>
            </div>

            {/* Content Sources Section */}
            <div className="space-y-6 pt-6 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Sources de contenu</h2>

              {/* Website URLs */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  URLs de sites web
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                      Ajoutez des URLs pour extraire le contenu automatiquement
                    </div>
                  </div>
                </label>
                {websiteUrls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="url"
                      value={url}
                      onChange={(e) => updateUrlField(index, e.target.value)}
                      placeholder="Saisissez une URL..."
                      className="flex-1 bg-gray-50 border-gray-200 focus:bg-white"
                    />
                    {websiteUrls.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeUrlField(index)}
                        className="hover:bg-gray-100"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addUrlField}
                  className="w-full border-dashed border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  + Ajouter une URL
                </Button>
              </div>

              {/* Templates */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  Exemples de modèles
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                      Ajoutez des exemples de contenu ou modèles JSON
                    </div>
                  </div>
                </label>
                {exampleTemplates.map((template, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={template}
                      onChange={(e) => updateTemplateField(index, e.target.value)}
                      placeholder="Saisissez un modèle..."
                      className="flex-1 px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition-colors resize-none"
                      rows={2}
                    />
                    {exampleTemplates.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTemplateField(index)}
                        className="hover:bg-gray-100"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addTemplateField}
                  className="w-full border-dashed border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  + Ajouter un modèle
                </Button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

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
                onClick={handleGenerateCompleteOffer}
                disabled={loading}
                className="bg-black hover:bg-gray-800 text-white px-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
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

export default TextToOfferForm;
