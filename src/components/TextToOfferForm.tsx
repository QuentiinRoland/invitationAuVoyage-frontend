import React, { useState, useCallback } from 'react';
import { api } from '../api/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Loader2,
  AlertCircle,
  Info,
  Plus,
  Minus,
  Image as ImageIcon,
  ExternalLink,
  MapPin,
  Star,
  Clock,
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
  showHistory?: boolean;
  onCloseHistory?: () => void;
}

type OfferType = 'circuit' | 'sejour' | 'transport';
type CabinClass = 'eco' | 'premium_eco' | 'business';

interface EscaleEntry {
  flightNumber: string;
  date: string;
}

interface FlightRoute {
  depCity: string;
  depCountry: string;
  arrCity: string;
  arrCountry: string;
}

const EMPTY_ROUTE: FlightRoute = {
  depCity: '', depCountry: '', arrCity: '', arrCountry: '',
};

interface UrlPreview {
  title: string;
  images: string[];
  description: string;
  loading: boolean;
}

interface HistoryEntry {
  text: string;
  offerType: OfferType;
  outboundFlightNumber: string;
  outboundDate: string;
  outboundRoute: FlightRoute;
  returnFlightNumber: string;
  returnFlightDate: string;
  returnRoute: FlightRoute;
  websiteUrls: string[];
  timestamp: number; // epoch ms
}

const HISTORY_KEY = 'offer_input_history';
const MAX_HISTORY = 15;

function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
}

function formatHistoryDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;
  if (diff < 60_000) return "à l'instant";
  if (diff < 3_600_000) return `il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `il y a ${Math.floor(diff / 3_600_000)}h`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

interface HotelGoogleResult {
  name: string;
  address: string;
  rating?: number;
  user_ratings_total?: number;
  phone?: string;
  website?: string;
  google_maps_url?: string;
  photos: string[];
  place_id?: string;
  query_used?: string;
  loading: boolean;
  error?: string;
}

const DEFAULT_DATE = '2026-06-23';

const CABIN_OPTIONS: { value: CabinClass; label: string }[] = [
  { value: 'eco', label: 'Éco' },
  { value: 'premium_eco', label: 'Premium Éco' },
  { value: 'business', label: 'Business' },
];

const CabinClassSelector = ({
  value,
  onChange,
}: {
  value: CabinClass;
  onChange: (v: CabinClass) => void;
}) => (
  <div className="flex gap-1 mt-2">
    {CABIN_OPTIONS.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
          value === opt.value
            ? 'bg-purple-600 border-purple-600 text-white'
            : 'bg-white border-gray-300 text-gray-600 hover:border-purple-400'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

// Champs route manuelle : ville départ + arrivée
const RouteFields = ({
  route,
  onChange,
}: {
  route: FlightRoute;
  onChange: (field: keyof FlightRoute, value: string) => void;
}) => (
  <div className="space-y-2 pt-1">
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1">
        <label className="text-xs text-gray-500 font-medium">Ville départ</label>
        <Input
          value={route.depCity}
          onChange={(e) => onChange('depCity', e.target.value)}
          placeholder="Paris"
          className="bg-white border-gray-200 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-gray-500 font-medium">Ville arrivée</label>
        <Input
          value={route.arrCity}
          onChange={(e) => onChange('arrCity', e.target.value)}
          placeholder="Bali"
          className="bg-white border-gray-200 text-sm"
        />
      </div>
    </div>
  </div>
);

const EscalesList = ({
  escales,
  onAdd,
  onRemove,
  onUpdate,
}: {
  escales: EscaleEntry[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onUpdate: (i: number, field: keyof EscaleEntry, value: string) => void;
}) => (
  <div className="space-y-2 pl-4 border-l-2 border-purple-200 ml-2">
    {escales.map((escale, i) => (
      <div key={i} className="flex items-center gap-2">
        <span className="text-xs text-purple-500 font-medium w-16 shrink-0">Escale {i + 1}</span>
        <Input
          type="text"
          value={escale.flightNumber}
          onChange={(e) => onUpdate(i, 'flightNumber', e.target.value.toUpperCase())}
          placeholder="AF234"
          className="bg-white border-gray-200 text-sm w-28"
        />
        <Input
          type="date"
          value={escale.date}
          onChange={(e) => onUpdate(i, 'date', e.target.value)}
          className="bg-white border-gray-200 text-sm"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(i)}
          className="hover:bg-red-50 hover:text-red-500 shrink-0"
        >
          <Minus className="w-3 h-3" />
        </Button>
      </div>
    ))}
    <button
      type="button"
      onClick={onAdd}
      className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
    >
      <Plus className="w-3 h-3" /> Ajouter une escale
    </button>
  </div>
);

function extractKeywords(text: string): string[] {
  if (!text.trim()) return [];
  // Extract meaningful words (4+ chars, skip common stop words)
  const stopWords = new Set([
    'avec', 'pour', 'dans', 'sont', 'nous', 'vous', 'cette', 'leur', 'les', 'des', 'une',
    'est', 'qui', 'que', 'par', 'sur', 'plus', 'tout', 'mais', 'bien', 'très', 'aussi',
    'from', 'with', 'that', 'this', 'have', 'will', 'your', 'from', 'they', 'been',
  ]);
  const words = text
    .toLowerCase()
    .replace(/[^\wàâäéèêëîïôöùûüç\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stopWords.has(w));
  // Return unique words, max 12
  return [...new Set(words)].slice(0, 12);
}

const TextToOfferForm: React.FC<TextToOfferFormProps> = ({ onNavigateToEditor, showHistory = false, onCloseHistory }) => {
  const [text, setText] = useState('');
  const [offerType, setOfferType] = useState<OfferType>('circuit');

  // Vol aller
  const [hasOutbound, setHasOutbound] = useState(true);
  const [outboundFlightNumber, setOutboundFlightNumber] = useState('');
  const [outboundDate, setOutboundDate] = useState(DEFAULT_DATE);
  const [outboundCabin, setOutboundCabin] = useState<CabinClass>('eco');
  const [outboundEscales, setOutboundEscales] = useState<EscaleEntry[]>([]);
  const [outboundRoute, setOutboundRoute] = useState<FlightRoute>({ ...EMPTY_ROUTE });

  // Vol retour
  const [hasReturn, setHasReturn] = useState(false);
  const [returnFlightNumber, setReturnFlightNumber] = useState('');
  const [returnFlightDate, setReturnFlightDate] = useState(DEFAULT_DATE);
  const [returnCabin, setReturnCabin] = useState<CabinClass>('eco');
  const [returnEscales, setReturnEscales] = useState<EscaleEntry[]>([]);
  const [returnRoute, setReturnRoute] = useState<FlightRoute>({ ...EMPTY_ROUTE });

  const [websiteUrls, setWebsiteUrls] = useState<string[]>(['']);
  const [urlPreviews, setUrlPreviews] = useState<Record<number, UrlPreview>>({});
  const [hotelResults, setHotelResults] = useState<Record<number, HotelGoogleResult>>({});
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
  const [inputHistory, setInputHistory] = useState<HistoryEntry[]>(() => loadHistory());

  // Escales helpers
  const addOutboundEscale = () => setOutboundEscales([...outboundEscales, { flightNumber: '', date: outboundDate }]);
  const removeOutboundEscale = (i: number) => setOutboundEscales(outboundEscales.filter((_, idx) => idx !== i));
  const updateOutboundEscale = (i: number, field: keyof EscaleEntry, value: string) => {
    const updated = [...outboundEscales];
    updated[i] = { ...updated[i], [field]: value };
    setOutboundEscales(updated);
  };

  const addReturnEscale = () => setReturnEscales([...returnEscales, { flightNumber: '', date: returnFlightDate }]);
  const removeReturnEscale = (i: number) => setReturnEscales(returnEscales.filter((_, idx) => idx !== i));
  const updateReturnEscale = (i: number, field: keyof EscaleEntry, value: string) => {
    const updated = [...returnEscales];
    updated[i] = { ...updated[i], [field]: value };
    setReturnEscales(updated);
  };

  // Supprimer une image de la prévisualisation
  const removePreviewImage = useCallback((urlIndex: number, imgUrl: string) => {
    setUrlPreviews(prev => ({
      ...prev,
      [urlIndex]: {
        ...prev[urlIndex],
        images: prev[urlIndex].images.filter(u => u !== imgUrl),
      },
    }));
  }, []);

  // URL preview
  const fetchUrlPreview = useCallback(async (index: number, url: string) => {
    if (!url.trim() || url.length < 8) return;
    setUrlPreviews((prev) => ({ ...prev, [index]: { title: '', images: [], description: '', loading: true } }));
    try {
      const response = await api.post('api/preview-url/', { url });
      setUrlPreviews((prev) => ({
        ...prev,
        [index]: {
          title: response.data.title || '',
          images: response.data.images || [],
          description: response.data.description || '',
          loading: false,
        },
      }));
    } catch {
      setUrlPreviews((prev) => ({ ...prev, [index]: { title: '', images: [], description: '', loading: false } }));
    }
  }, []);

  // Recherche Google Places pour un hôtel
  const fetchHotelFromGoogle = useCallback(async (index: number, url: string) => {
    if (!url.trim() || url.length < 8) return;
    setHotelResults((prev) => ({
      ...prev,
      [index]: { name: '', address: '', photos: [], loading: true },
    }));
    try {
      const response = await api.post('api/hotel-google-search/', { url });
      setHotelResults((prev) => ({ ...prev, [index]: { ...response.data, loading: false } }));
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Erreur Google Places';
      setHotelResults((prev) => ({
        ...prev,
        [index]: { name: '', address: '', photos: [], loading: false, error: errMsg },
      }));
    }
  }, []);

  // URL field helpers
  const addUrlField = () => setWebsiteUrls([...websiteUrls, '']);
  const removeUrlField = (index: number) => {
    setWebsiteUrls(websiteUrls.filter((_, i) => i !== index));
    setUrlPreviews((prev) => { const u = { ...prev }; delete u[index]; return u; });
    setHotelResults((prev) => { const u = { ...prev }; delete u[index]; return u; });
  };
  const updateUrlField = (index: number, value: string) => {
    const newUrls = [...websiteUrls];
    newUrls[index] = value;
    setWebsiteUrls(newUrls);
    setUrlPreviews((prev) => { const u = { ...prev }; delete u[index]; return u; });
    setHotelResults((prev) => { const u = { ...prev }; delete u[index]; return u; });
  };

  const addTemplateField = () => setExampleTemplates([...exampleTemplates, '']);
  const removeTemplateField = (index: number) => setExampleTemplates(exampleTemplates.filter((_, i) => i !== index));
  const updateTemplateField = (index: number, value: string) => {
    const newTemplates = [...exampleTemplates];
    newTemplates[index] = value;
    setExampleTemplates(newTemplates);
  };

  const handleGenerateCompleteOffer = async () => {
    const hasFlightInput = hasOutbound && outboundFlightNumber.trim() && outboundDate.trim();
    if (!text.trim() && !hasFlightInput) {
      setError('Veuillez saisir une description de votre demande OU un numéro de vol aller avec sa date.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const validUrls = websiteUrls.filter(url => {
        const u = url.trim();
        return u !== '' && (u.startsWith('http://') || u.startsWith('https://') || u.includes('.'));
      });
      const validTemplates = exampleTemplates.filter(template => template.trim() !== '');
      const keywords = extractKeywords(text);

      const response = await api.post('api/generate-travel-offer/', {
        text: text,
        offer_type: offerType,
        keywords: keywords,
        outbound_flight_number: hasOutbound ? (outboundFlightNumber.trim() || undefined) : undefined,
        outbound_date: hasOutbound ? (outboundDate || undefined) : undefined,
        outbound_cabin_class: hasOutbound ? outboundCabin : undefined,
        outbound_escales: hasOutbound ? outboundEscales.filter(e => e.flightNumber.trim()) : [],
        outbound_route: hasOutbound ? outboundRoute : undefined,
        return_flight_number: hasReturn ? (returnFlightNumber.trim() || undefined) : undefined,
        return_flight_date: hasReturn ? (returnFlightDate || undefined) : undefined,
        return_cabin_class: hasReturn ? returnCabin : undefined,
        return_escales: hasReturn ? returnEscales.filter(e => e.flightNumber.trim()) : [],
        return_route: hasReturn ? returnRoute : undefined,
        website_urls: validUrls,
        example_templates: validTemplates,
        company_info: companyInfo,
        // Photos Google Places récupérées pour chaque URL
        hotel_google_images: Object.values(hotelResults)
          .filter(r => !r.loading && !r.error && r.photos.length > 0)
          .flatMap(r => r.photos)
      });

      const offerData = response.data;

      if (response.data.metadata) {
        console.log('📊 MÉTADONNÉES:', response.data.metadata);
      }

      // Save to history (only if there's something meaningful to save)
      const hasRouteInfo = outboundRoute.depCity || outboundRoute.arrCity;
      if (text.trim() || outboundFlightNumber.trim() || validUrls.length || hasRouteInfo) {
        const entry: HistoryEntry = {
          text: text.trim(),
          offerType,
          outboundFlightNumber: outboundFlightNumber.trim(),
          outboundDate,
          outboundRoute: { ...outboundRoute },
          returnFlightNumber: returnFlightNumber.trim(),
          returnFlightDate,
          returnRoute: { ...returnRoute },
          websiteUrls: validUrls,
          timestamp: Date.now(),
        };
        const prev = loadHistory();
        const deduped = prev.filter(
          (e) => !(e.text === entry.text && e.outboundFlightNumber === entry.outboundFlightNumber && (e.websiteUrls?.[0] ?? '') === (entry.websiteUrls[0] ?? ''))
        );
        const updated = [entry, ...deduped].slice(0, MAX_HISTORY);
        saveHistory(updated);
        setInputHistory(updated);
      }

      if (onNavigateToEditor && offerData) {
        // Injecter les images curated par l'utilisateur (après suppression)
        const curatedImages = Object.values(urlPreviews)
          .filter(p => !p.loading)
          .flatMap(p => p.images);
        const enrichedOffer = curatedImages.length > 0
          ? { ...offerData, scraped_images: curatedImages }
          : offerData;
        onNavigateToEditor(enrichedOffer);
      }

    } catch (err: any) {
      console.error('Erreur lors de la génération:', err);
      setError(err.response?.data?.detail || err.message || 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  const keywords = extractKeywords(text);

  return (
    <div className="min-h-screen bg-white">
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
                {/* Keywords extracted from description */}
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {keywords.map((kw) => (
                      <span key={kw} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Flight Details */}
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
                <div className={`border rounded-lg p-4 space-y-3 transition-colors ${hasOutbound ? 'bg-gray-50 border-gray-200' : 'bg-gray-50/50 border-dashed border-gray-200 opacity-60'}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Vol aller</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs text-gray-500">{hasOutbound ? 'Activé' : 'Désactivé'}</span>
                      <div
                        onClick={() => setHasOutbound(!hasOutbound)}
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${hasOutbound ? 'bg-purple-600' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasOutbound ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </div>
                    </label>
                  </div>
                  {hasOutbound && (
                    <>
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
                      <RouteFields
                        route={outboundRoute}
                        onChange={(f, v) => setOutboundRoute(r => ({ ...r, [f]: v }))}
                      />
                      <CabinClassSelector value={outboundCabin} onChange={setOutboundCabin} />
                      <EscalesList
                        escales={outboundEscales}
                        onAdd={addOutboundEscale}
                        onRemove={removeOutboundEscale}
                        onUpdate={updateOutboundEscale}
                      />
                    </>
                  )}
                </div>

                {/* Vol Retour */}
                <div className={`border rounded-lg p-4 space-y-3 transition-colors ${hasReturn ? 'bg-gray-50 border-gray-200' : 'bg-gray-50/50 border-dashed border-gray-200 opacity-60'}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Vol retour <span className="text-gray-400 font-normal normal-case">(optionnel)</span>
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs text-gray-500">{hasReturn ? 'Activé' : 'Désactivé'}</span>
                      <div
                        onClick={() => setHasReturn(!hasReturn)}
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${hasReturn ? 'bg-purple-600' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasReturn ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </div>
                    </label>
                  </div>
                  {hasReturn && (
                    <>
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
                      <RouteFields
                        route={returnRoute}
                        onChange={(f, v) => setReturnRoute(r => ({ ...r, [f]: v }))}
                      />
                      <CabinClassSelector value={returnCabin} onChange={setReturnCabin} />
                      <EscalesList
                        escales={returnEscales}
                        onAdd={addReturnEscale}
                        onRemove={removeReturnEscale}
                        onUpdate={updateReturnEscale}
                      />
                    </>
                  )}
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
                  <div key={index} className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        value={url}
                        onChange={(e) => updateUrlField(index, e.target.value)}
                        placeholder="https://www.hotel-exemple.com"
                        className={`flex-1 bg-gray-50 focus:bg-white ${
                          url.trim() && !url.trim().startsWith('http') && !url.trim().includes('.')
                            ? 'border-red-300 focus:ring-red-400'
                            : 'border-gray-200'
                        }`}
                      />
                      {url.trim() && !url.trim().startsWith('http') && !url.trim().includes('.') && (
                        <span className="text-xs text-red-500 self-center shrink-0">URL invalide</span>
                      )}
                      {/* Bouton Google Places */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fetchHotelFromGoogle(index, url)}
                        title="Rechercher cet hôtel avec Google"
                        className="hover:bg-blue-50 hover:text-blue-600 shrink-0"
                        disabled={!url.trim()}
                      >
                        {hotelResults[index]?.loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <MapPin className="w-4 h-4" />
                        )}
                      </Button>
                      {/* Bouton prévisualisation images */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fetchUrlPreview(index, url)}
                        title="Prévisualiser les images"
                        className="hover:bg-purple-50 hover:text-purple-600 shrink-0"
                        disabled={!url.trim()}
                      >
                        {urlPreviews[index]?.loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ImageIcon className="w-4 h-4" />
                        )}
                      </Button>
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

                    {/* Google Places Result */}
                    {hotelResults[index] && !hotelResults[index].loading && (
                      <div className={`rounded-lg border p-3 space-y-2 ${hotelResults[index].error ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
                        {hotelResults[index].error ? (
                          <p className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {hotelResults[index].error}
                          </p>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <p className="text-sm font-semibold text-gray-900">{hotelResults[index].name}</p>
                                {hotelResults[index].address && (
                                  <p className="text-xs text-gray-600 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 shrink-0 text-blue-500" />
                                    {hotelResults[index].address}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 pt-0.5">
                                  {hotelResults[index].rating && (
                                    <span className="text-xs text-amber-600 flex items-center gap-0.5">
                                      <Star className="w-3 h-3 fill-amber-400 stroke-amber-500" />
                                      {hotelResults[index].rating}
                                      {hotelResults[index].user_ratings_total && (
                                        <span className="text-gray-400 ml-0.5">({hotelResults[index].user_ratings_total?.toLocaleString()})</span>
                                      )}
                                    </span>
                                  )}
                                  {hotelResults[index].phone && (
                                    <span className="text-xs text-gray-500">{hotelResults[index].phone}</span>
                                  )}
                                  {hotelResults[index].google_maps_url && (
                                    <a
                                      href={hotelResults[index].google_maps_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
                                    >
                                      <ExternalLink className="w-3 h-3" /> Google Maps
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                            {hotelResults[index].photos.length > 0 && (
                              <div className="flex gap-2 overflow-x-auto pb-1">
                                {hotelResults[index].photos.slice(0, 8).map((photo, pIdx) => (
                                  <img
                                    key={pIdx}
                                    src={photo}
                                    alt=""
                                    className="h-20 w-28 object-cover rounded shrink-0 border border-blue-200"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* URL Preview Gallery (images scrapées) */}
                    {urlPreviews[index] && !urlPreviews[index].loading && !hotelResults[index] && (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                        {urlPreviews[index].title && (
                          <div className="flex items-center gap-2">
                            <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="text-xs font-medium text-gray-700 truncate">{urlPreviews[index].title}</span>
                          </div>
                        )}
                        {urlPreviews[index].description && (
                          <p className="text-xs text-gray-500 line-clamp-2">{urlPreviews[index].description}</p>
                        )}
                        {urlPreviews[index].images.length > 0 && (
                          <>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-500">{urlPreviews[index].images.length} image{urlPreviews[index].images.length > 1 ? 's' : ''} — survolez pour supprimer</span>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                              {urlPreviews[index].images.slice(0, 15).map((img, imgIdx) => (
                                <div key={imgIdx} className="relative shrink-0 group">
                                  <img
                                    src={img}
                                    alt=""
                                    className="h-20 w-28 object-cover rounded border border-gray-200"
                                    onError={(e) => { (e.target as HTMLImageElement).closest('.group')!.remove(); }}
                                  />
                                  <button
                                    onClick={() => removePreviewImage(index, img)}
                                    className="absolute top-0.5 right-0.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 text-xs leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                    title="Supprimer cette image"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                        {urlPreviews[index].images.length === 0 && !urlPreviews[index].title && (
                          <p className="text-xs text-gray-400">Aucune prévisualisation disponible</p>
                        )}
                      </div>
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

      {/* History Modal */}
      {showHistory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={onCloseHistory}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                <h3 className="text-base font-semibold text-gray-900">Historique des demandes</h3>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {inputHistory.length}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {inputHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      saveHistory([]);
                      setInputHistory([]);
                    }}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Tout effacer
                  </button>
                )}
                <button
                  type="button"
                  onClick={onCloseHistory}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            {/* List */}
            {inputHistory.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Clock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Aucune demande enregistrée</p>
                <p className="text-xs text-gray-300 mt-1">Vos prochaines générations apparaîtront ici</p>
              </div>
            ) : (
              <ul className="max-h-[480px] overflow-y-auto divide-y divide-gray-50">
                {inputHistory.map((entry, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => {
                        setText(entry.text);
                        setOfferType(entry.offerType);
                        setHasOutbound(true);
                        if (entry.outboundFlightNumber) {
                          setOutboundFlightNumber(entry.outboundFlightNumber);
                          setOutboundDate(entry.outboundDate);
                        }
                        if (entry.outboundRoute) setOutboundRoute(entry.outboundRoute);
                        if (entry.returnFlightNumber || entry.returnRoute?.depCity) {
                          setHasReturn(true);
                          if (entry.returnFlightNumber) setReturnFlightNumber(entry.returnFlightNumber);
                          if (entry.returnFlightDate) setReturnFlightDate(entry.returnFlightDate);
                          if (entry.returnRoute) setReturnRoute(entry.returnRoute);
                        }
                        if (entry.websiteUrls?.length) {
                          setWebsiteUrls([...entry.websiteUrls, '']);
                        }
                        onCloseHistory?.();
                      }}
                      className="w-full text-left px-6 py-4 hover:bg-purple-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          {entry.text ? (
                            <p className="text-sm text-gray-800 line-clamp-2 leading-relaxed">
                              {entry.text}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">Sans description</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {entry.offerType && (
                              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                                {entry.offerType}
                              </span>
                            )}
                            {(entry.outboundRoute?.depCity || entry.outboundRoute?.arrCity) && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                📍 {entry.outboundRoute.depCity || '?'} → {entry.outboundRoute.arrCity || '?'}
                              </span>
                            )}
                            {entry.outboundFlightNumber && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                ✈ {entry.outboundFlightNumber} · {entry.outboundDate}
                              </span>
                            )}
                            {entry.returnFlightNumber && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                ↩ {entry.returnFlightNumber}
                              </span>
                            )}
                            {entry.websiteUrls?.length > 0 && (
                              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                                🔗 {entry.websiteUrls.length} URL{entry.websiteUrls.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          {entry.websiteUrls?.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1 truncate">
                              {entry.websiteUrls[0]}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 shrink-0 mt-0.5 whitespace-nowrap">
                          {formatHistoryDate(entry.timestamp)}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TextToOfferForm;
