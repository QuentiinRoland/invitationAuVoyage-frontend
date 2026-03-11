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
  const [outboundFlightNumber, setOutboundFlightNumber] = useState('');
  const [outboundDate, setOutboundDate] = useState('');
  const [returnFlightNumber, setReturnFlightNumber] = useState('');
  const [returnFlightDate, setReturnFlightDate] = useState('');
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
    const hasFlightInput = outboundFlightNumber.trim() && outboundDate.trim();
    if (!text.trim() && !hasFlightInput) {
      setError('Veuillez saisir une description de votre demande OU un numéro de vol aller avec sa date.');
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
        outbound_flight_number: outboundFlightNumber.trim() || undefined,
        outbound_date: outboundDate || undefined,
        return_flight_number: returnFlightNumber.trim() || undefined,
        return_flight_date: returnFlightDate || undefined,
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

              {/* Flight Details - Structured */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  Informations de vol
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                      Saisissez le numéro de vol et la date. L'API Amadeus Flight Status retrouvera le vol exact avec ses horaires, terminaux et escales.
                    </div>
                  </div>
                </label>

                {/* Vol Aller */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Vol aller</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-600">Numéro de vol</label>
                      <Input
                        type="text"
                        value={outboundFlightNumber}
                        onChange={(e) => setOutboundFlightNumber(e.target.value.toUpperCase())}
                        placeholder="AF001"
                        className="bg-white border-gray-200 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-600">Date</label>
                      <Input
                        type="date"
                        value={outboundDate}
                        onChange={(e) => setOutboundDate(e.target.value)}
                        className="bg-white border-gray-200 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Vol Retour */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Vol retour <span className="text-gray-400 font-normal normal-case">(optionnel)</span></p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-600">Numéro de vol</label>
                      <Input
                        type="text"
                        value={returnFlightNumber}
                        onChange={(e) => setReturnFlightNumber(e.target.value.toUpperCase())}
                        placeholder="AF002"
                        className="bg-white border-gray-200 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-600">Date</label>
                      <Input
                        type="date"
                        value={returnFlightDate}
                        onChange={(e) => setReturnFlightDate(e.target.value)}
                        className="bg-white border-gray-200 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-xs text-purple-600">
                  Recherche via Amadeus Flight Status API — horaires exacts, terminaux, escales et segments
                </p>
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
