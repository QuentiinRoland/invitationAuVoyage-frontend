import React, { useState, useCallback } from 'react';
import { api } from '../api/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Loader2,
  AlertCircle,
  Info,
  Plus,
  X,
  Image as ImageIcon,
  ExternalLink,
  MapPin,
  Star,
  Clock,
  Plane,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

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

type OfferType = 'sejour' | 'transport';
type CabinClass = 'eco' | 'premium_eco' | 'business';

interface FlightInfo {
  flightNumber: string;
  date: string;
  depCity: string;
  arrCity: string;
  depTime: string;
  arrTime: string;
  duration: string;
  cabin: CabinClass;
}

interface UrlPreview {
  title: string;
  images: string[];
  description: string;
  loading: boolean;
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
  loading: boolean;
  error?: string;
}

interface HistoryEntry {
  text: string;
  offerType: OfferType;
  destinations: string[];
  logements: string[];
  dates: string;
  outboundFlight?: FlightInfo;
  returnFlight?: FlightInfo;
  websiteUrls: string[];
  timestamp: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HISTORY_KEY = 'offer_input_history_v2';
const MAX_HISTORY = 15;

const EMPTY_FLIGHT: FlightInfo = {
  flightNumber: '', date: '', depCity: '', arrCity: '',
  depTime: '', arrTime: '', duration: '', cabin: 'eco',
};

const CABIN_OPTIONS: { value: CabinClass; label: string }[] = [
  { value: 'eco', label: 'Éco' },
  { value: 'premium_eco', label: 'Premium Éco' },
  { value: 'business', label: 'Business' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}
function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
}
function formatHistoryDate(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "à l'instant";
  if (diff < 3_600_000) return `il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `il y a ${Math.floor(diff / 3_600_000)}h`;
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const CabinSelector = ({ value, onChange }: { value: CabinClass; onChange: (v: CabinClass) => void }) => (
  <div className="flex gap-1">
    {CABIN_OPTIONS.map(opt => (
      <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
          value === opt.value
            ? 'bg-purple-600 border-purple-600 text-white'
            : 'bg-white border-gray-300 text-gray-600 hover:border-purple-400'
        }`}>
        {opt.label}
      </button>
    ))}
  </div>
);

const MultiStringField = ({
  label, values, placeholder, onChange,
}: {
  label: string;
  values: string[];
  placeholder: string;
  onChange: (vals: string[]) => void;
}) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    {values.map((v, i) => (
      <div key={i} className="flex gap-2">
        <Input
          value={v}
          onChange={e => { const n = [...values]; n[i] = e.target.value; onChange(n); }}
          placeholder={placeholder}
          className="flex-1 bg-gray-50 border-gray-200 text-sm focus:bg-white"
        />
        {values.length > 1 && (
          <button type="button"
            onClick={() => onChange(values.filter((_, idx) => idx !== i))}
            className="text-gray-400 hover:text-red-500 transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    ))}
    <button type="button"
      onClick={() => onChange([...values, ''])}
      className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium mt-1">
      <Plus className="w-3 h-3" /> Ajouter
    </button>
  </div>
);

const FlightBlock = ({
  label, flight, onChange,
}: {
  label: string;
  flight: FlightInfo;
  onChange: (f: FlightInfo) => void;
}) => {
  const set = (field: keyof FlightInfo, val: string) => onChange({ ...flight, [field]: val });
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Numéro de vol</label>
          <Input value={flight.flightNumber} onChange={e => set('flightNumber', e.target.value.toUpperCase())}
            placeholder="AF001" className="bg-white border-gray-200 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Date</label>
          <Input type="date" value={flight.date} onChange={e => set('date', e.target.value)}
            className="bg-white border-gray-200 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Ville départ</label>
          <Input value={flight.depCity} onChange={e => set('depCity', e.target.value)}
            placeholder="Paris" className="bg-white border-gray-200 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Ville arrivée</label>
          <Input value={flight.arrCity} onChange={e => set('arrCity', e.target.value)}
            placeholder="Île Maurice" className="bg-white border-gray-200 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Heure départ</label>
          <Input type="time" value={flight.depTime} onChange={e => set('depTime', e.target.value)}
            className="bg-white border-gray-200 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Heure arrivée</label>
          <Input type="time" value={flight.arrTime} onChange={e => set('arrTime', e.target.value)}
            className="bg-white border-gray-200 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Durée</label>
          <Input value={flight.duration} onChange={e => set('duration', e.target.value)}
            placeholder="10h30" className="bg-white border-gray-200 text-sm" />
        </div>
      </div>
      <CabinSelector value={flight.cabin} onChange={v => set('cabin', v)} />
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────

const TextToOfferForm: React.FC<TextToOfferFormProps> = ({ onNavigateToEditor, showHistory = false, onCloseHistory }) => {

  // Séjour
  const [offerType, setOfferType] = useState<OfferType>('sejour');
  const [destinations, setDestinations] = useState<string[]>(['']);
  const [dates, setDates] = useState('');
  const [text, setText] = useState('');

  // Hébergement & services
  const [logements, setLogements] = useState<string[]>(['']);
  const [typeChambre, setTypeChambre] = useState('');
  const [repas, setRepas] = useState('');
  const [transfert, setTransfert] = useState('');
  const [croisiere, setCroisiere] = useState('');
  const [formalites, setFormalites] = useState('');

  // Vols (manuel uniquement — pas de recherche Amadeus)
  const [hasOutbound, setHasOutbound] = useState(false);
  const [hasReturn, setHasReturn] = useState(false);
  const [outboundFlight, setOutboundFlight] = useState<FlightInfo>({ ...EMPTY_FLIGHT });
  const [returnFlight, setReturnFlight] = useState<FlightInfo>({ ...EMPTY_FLIGHT });
  const [showFlights, setShowFlights] = useState(false);

  // Sources
  const [websiteUrls, setWebsiteUrls] = useState<string[]>(['']);
  const [urlPreviews, setUrlPreviews] = useState<Record<number, UrlPreview>>({});
  const [hotelResults, setHotelResults] = useState<Record<number, HotelGoogleResult>>({});

  const [companyInfo] = useState<CompanyInfo>({
    name: 'Invitation au Voyage',
    address: "123 Rue de l'Innovation, 75001 Paris",
    phone: '+33 1 23 45 67 89',
    email: 'contact@invitationauvoyage.fr',
    website: 'www.invitationauvoyage.fr',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputHistory, setInputHistory] = useState<HistoryEntry[]>(() => loadHistory());

  // ── URL preview ──────────────────────────────────────────────────────────────

  const fetchUrlPreview = useCallback(async (index: number, url: string) => {
    if (!url.trim() || url.length < 8) return;
    setUrlPreviews(prev => ({ ...prev, [index]: { title: '', images: [], description: '', loading: true } }));
    try {
      const response = await api.post('api/preview-url/', { url });
      setUrlPreviews(prev => ({
        ...prev,
        [index]: { title: response.data.title || '', images: response.data.images || [], description: response.data.description || '', loading: false },
      }));
    } catch {
      setUrlPreviews(prev => ({ ...prev, [index]: { title: '', images: [], description: '', loading: false } }));
    }
  }, []);

  const fetchHotelFromGoogle = useCallback(async (index: number, url: string) => {
    if (!url.trim() || url.length < 8) return;
    setHotelResults(prev => ({ ...prev, [index]: { name: '', address: '', photos: [], loading: true } }));
    try {
      const response = await api.post('api/hotel-google-search/', { url });
      setHotelResults(prev => ({ ...prev, [index]: { ...response.data, loading: false } }));
    } catch (err: any) {
      setHotelResults(prev => ({ ...prev, [index]: { name: '', address: '', photos: [], loading: false, error: err.response?.data?.error || 'Erreur Google Places' } }));
    }
  }, []);

  const removePreviewImage = useCallback((urlIndex: number, imgUrl: string) => {
    setUrlPreviews(prev => ({
      ...prev,
      [urlIndex]: { ...prev[urlIndex], images: prev[urlIndex].images.filter(u => u !== imgUrl) },
    }));
  }, []);

  const addUrlField = () => setWebsiteUrls([...websiteUrls, '']);
  const removeUrlField = (index: number) => {
    setWebsiteUrls(websiteUrls.filter((_, i) => i !== index));
    setUrlPreviews(prev => { const u = { ...prev }; delete u[index]; return u; });
    setHotelResults(prev => { const u = { ...prev }; delete u[index]; return u; });
  };
  const updateUrlField = (index: number, value: string) => {
    const n = [...websiteUrls]; n[index] = value; setWebsiteUrls(n);
    setUrlPreviews(prev => { const u = { ...prev }; delete u[index]; return u; });
    setHotelResults(prev => { const u = { ...prev }; delete u[index]; return u; });
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    const hasContent = text.trim() || destinations.some(d => d.trim());
    if (!hasContent) {
      setError('Veuillez saisir au moins une destination ou une description.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const validUrls = websiteUrls.filter(u => {
        const t = u.trim();
        return t !== '' && (t.startsWith('http://') || t.startsWith('https://') || t.includes('.'));
      });

      const payload: Record<string, any> = {
        text: text.trim(),
        offer_type: offerType,
        destinations: destinations.filter(d => d.trim()),
        dates: dates.trim() || undefined,
        logements: logements.filter(l => l.trim()),
        type_chambre: typeChambre.trim() || undefined,
        repas: repas || undefined,
        transfert: transfert || undefined,
        croisiere: croisiere.trim() || undefined,
        formalites: formalites.trim() || undefined,
        website_urls: validUrls,
        company_info: companyInfo,
        manual_flights_only: true,
        hotel_google_images: Object.values(hotelResults)
          .filter(r => !r.loading && !r.error && r.photos.length > 0)
          .flatMap(r => r.photos),
      };

      if (hasOutbound && (outboundFlight.flightNumber || outboundFlight.depCity || outboundFlight.arrCity)) {
        payload.outbound_flight = {
          flight_number: outboundFlight.flightNumber,
          date: outboundFlight.date,
          dep_city: outboundFlight.depCity,
          arr_city: outboundFlight.arrCity,
          dep_time: outboundFlight.depTime,
          arr_time: outboundFlight.arrTime,
          duration: outboundFlight.duration,
          cabin_class: outboundFlight.cabin,
          leg: 'aller',
        };
      }
      if (hasReturn && (returnFlight.flightNumber || returnFlight.depCity || returnFlight.arrCity)) {
        payload.return_flight = {
          flight_number: returnFlight.flightNumber,
          date: returnFlight.date,
          dep_city: returnFlight.depCity,
          arr_city: returnFlight.arrCity,
          dep_time: returnFlight.depTime,
          arr_time: returnFlight.arrTime,
          duration: returnFlight.duration,
          cabin_class: returnFlight.cabin,
          leg: 'retour',
        };
      }

      const response = await api.post('api/generate-travel-offer/', payload);
      const offerData = response.data;

      // History
      const entry: HistoryEntry = {
        text: text.trim(), offerType,
        destinations: destinations.filter(d => d.trim()),
        logements: logements.filter(l => l.trim()),
        dates,
        outboundFlight: hasOutbound ? outboundFlight : undefined,
        returnFlight: hasReturn ? returnFlight : undefined,
        websiteUrls: validUrls,
        timestamp: Date.now(),
      };
      const prev = loadHistory();
      const updated = [entry, ...prev.filter(e => e.text !== entry.text || e.dates !== entry.dates)].slice(0, MAX_HISTORY);
      saveHistory(updated);
      setInputHistory(updated);

      if (onNavigateToEditor && offerData) {
        const curatedImages = Object.values(urlPreviews).filter(p => !p.loading).flatMap(p => p.images);
        onNavigateToEditor(curatedImages.length > 0 ? { ...offerData, scraped_images: curatedImages } : offerData);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white">
      <div className="px-8 py-8 max-w-3xl mx-auto space-y-8">

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Créer une offre de voyage</h1>
          <p className="text-sm text-gray-500 mt-1">Renseignez les informations du séjour pour générer votre offre personnalisée.</p>
        </div>

        {/* ── Section 1 : Séjour ─────────────────────────────────────────────── */}
        <section className="space-y-5">
          <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-2">Informations du séjour</h2>

          {/* Type d'offre */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Type d'offre</label>
            <div className="flex gap-3">
              {(['sejour', 'transport'] as OfferType[]).map(type => (
                <button key={type} type="button" onClick={() => setOfferType(type)}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                    offerType === type
                      ? 'bg-purple-600 border-purple-600 text-white font-medium'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-purple-300'
                  }`}>
                  {type === 'sejour' ? 'Séjour' : 'Transport uniquement'}
                </button>
              ))}
            </div>
          </div>

          {/* Destinations */}
          <MultiStringField
            label="Destination(s)"
            values={destinations}
            placeholder="ex : Île Maurice"
            onChange={setDestinations}
          />

          {/* Dates */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Dates</label>
            <Input
              value={dates}
              onChange={e => setDates(e.target.value)}
              placeholder="ex : du 2 au 14 novembre 2026"
              className="bg-gray-50 border-gray-200 text-sm focus:bg-white"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              Description complémentaire
              <span className="text-xs font-normal text-gray-400">(optionnel)</span>
            </label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Informations supplémentaires, demandes spécifiques..."
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition-colors resize-none"
              rows={3}
            />
          </div>
        </section>

        {/* ── Section 2 : Hébergement & Services ────────────────────────────── */}
        <section className="space-y-5">
          <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-2">Hébergement & Services</h2>

          {/* Logements */}
          <MultiStringField
            label="Logement(s)"
            values={logements}
            placeholder="ex : Beachcomber Le Victoria ★★★★★"
            onChange={setLogements}
          />

          {/* Type de chambre */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Type de chambre</label>
            <Input
              value={typeChambre}
              onChange={e => setTypeChambre(e.target.value)}
              placeholder="ex : Suite vue mer, Chambre double standard"
              className="bg-gray-50 border-gray-200 text-sm focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Repas */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Repas</label>
              <select
                value={repas}
                onChange={e => setRepas(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition-colors"
              >
                <option value="">Non spécifié</option>
                <option value="demi-pension">Demi-pension</option>
                <option value="pension-complete">Pension complète</option>
                <option value="petit-dejeuner">Petit-déjeuner inclus</option>
                <option value="tout-inclus">Tout inclus</option>
              </select>
            </div>

            {/* Transfert */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Transfert</label>
              <select
                value={transfert}
                onChange={e => setTransfert(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition-colors"
              >
                <option value="">Non inclus</option>
                <option value="prive">Privé</option>
                <option value="regroupe">Regroupé</option>
              </select>
            </div>
          </div>

          {/* Croisière */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              Croisière
              <span className="text-xs font-normal text-gray-400">(optionnel)</span>
            </label>
            <Input
              value={croisiere}
              onChange={e => setCroisiere(e.target.value)}
              placeholder="ex : Costa Croisières — Méditerranée 7 nuits"
              className="bg-gray-50 border-gray-200 text-sm focus:bg-white"
            />
          </div>
        </section>

        {/* ── Section 3 : Vols ───────────────────────────────────────────────── */}
        <section className="space-y-4">
          <button
            type="button"
            onClick={() => setShowFlights(!showFlights)}
            className="flex items-center justify-between w-full text-base font-semibold text-gray-800 border-b border-gray-100 pb-2"
          >
            <span className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-gray-500" />
              Vols
              <span className="text-xs font-normal text-gray-400">(optionnel)</span>
            </span>
            {showFlights ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {showFlights && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">Les informations de vol sont saisies manuellement pour affichage dans le PDF.</p>

              {/* Vol aller */}
              <div className={`border rounded-xl p-4 space-y-4 transition-colors ${hasOutbound ? 'bg-gray-50 border-gray-200' : 'border-dashed border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Vol aller</p>
                  <div
                    onClick={() => setHasOutbound(!hasOutbound)}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${hasOutbound ? 'bg-purple-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasOutbound ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                </div>
                {hasOutbound && (
                  <FlightBlock label="" flight={outboundFlight} onChange={setOutboundFlight} />
                )}
              </div>

              {/* Vol retour */}
              <div className={`border rounded-xl p-4 space-y-4 transition-colors ${hasReturn ? 'bg-gray-50 border-gray-200' : 'border-dashed border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Vol retour</p>
                  <div
                    onClick={() => setHasReturn(!hasReturn)}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${hasReturn ? 'bg-purple-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasReturn ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                </div>
                {hasReturn && (
                  <FlightBlock label="" flight={returnFlight} onChange={setReturnFlight} />
                )}
              </div>
            </div>
          )}
        </section>

        {/* ── Section 4 : Sources de contenu ────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-2">Sources de contenu</h2>

          {websiteUrls.map((url, index) => (
            <div key={index} className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={url}
                  onChange={e => updateUrlField(index, e.target.value)}
                  placeholder="https://www.hotel-exemple.com"
                  className={`flex-1 bg-gray-50 focus:bg-white text-sm ${
                    url.trim() && !url.trim().startsWith('http') && !url.trim().includes('.')
                      ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                <Button variant="ghost" size="icon"
                  onClick={() => fetchHotelFromGoogle(index, url)}
                  title="Rechercher avec Google Places"
                  disabled={!url.trim()}
                  className="hover:bg-blue-50 hover:text-blue-600 shrink-0">
                  {hotelResults[index]?.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon"
                  onClick={() => fetchUrlPreview(index, url)}
                  title="Prévisualiser les images"
                  disabled={!url.trim()}
                  className="hover:bg-purple-50 hover:text-purple-600 shrink-0">
                  {urlPreviews[index]?.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                </Button>
                {websiteUrls.length > 1 && (
                  <button type="button" onClick={() => removeUrlField(index)} className="text-gray-400 hover:text-red-500 p-1">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Google Places result */}
              {hotelResults[index] && !hotelResults[index].loading && (
                <div className={`rounded-xl border p-3 space-y-2 ${hotelResults[index].error ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
                  {hotelResults[index].error ? (
                    <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{hotelResults[index].error}</p>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-gray-900">{hotelResults[index].name}</p>
                          {hotelResults[index].address && (
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3 shrink-0 text-blue-500" />{hotelResults[index].address}
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
                            {hotelResults[index].google_maps_url && (
                              <a href={hotelResults[index].google_maps_url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                                <ExternalLink className="w-3 h-3" /> Google Maps
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      {hotelResults[index].photos.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {hotelResults[index].photos.slice(0, 8).map((photo, pIdx) => (
                            <img key={pIdx} src={photo} alt="" className="h-20 w-28 object-cover rounded shrink-0 border border-blue-200"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* URL image preview */}
              {urlPreviews[index] && !urlPreviews[index].loading && !hotelResults[index] && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
                  {urlPreviews[index].title && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="text-xs font-medium text-gray-700 truncate">{urlPreviews[index].title}</span>
                    </div>
                  )}
                  {urlPreviews[index].images.length > 0 && (
                    <>
                      <p className="text-xs text-gray-500">{urlPreviews[index].images.length} image{urlPreviews[index].images.length > 1 ? 's' : ''} — survolez pour supprimer</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {urlPreviews[index].images.slice(0, 15).map((img, imgIdx) => (
                          <div key={imgIdx} className="relative shrink-0 group">
                            <img src={img} alt="" className="h-20 w-28 object-cover rounded border border-gray-200"
                              onError={e => { (e.target as HTMLImageElement).closest('.group')!.remove(); }} />
                            <button onClick={() => removePreviewImage(index, img)}
                              className="absolute top-0.5 right-0.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}

          <Button variant="outline" onClick={addUrlField}
            className="w-full border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 text-sm">
            + Ajouter une URL
          </Button>
        </section>

        {/* ── Section 5 : Formalités ─────────────────────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-2">
            Formalités
            <span className="text-xs font-normal text-gray-400 ml-2">(optionnel)</span>
          </h2>
          <textarea
            value={formalites}
            onChange={e => setFormalites(e.target.value)}
            placeholder="Visa, vaccins obligatoires, documents requis, assurance voyage..."
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition-colors resize-none"
            rows={3}
          />
        </section>

        {/* ── Error ─────────────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {/* ── Actions ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" onClick={() => window.history.back()} className="text-gray-600">
            Annuler
          </Button>
          <Button onClick={handleGenerate} disabled={loading}
            className="bg-black hover:bg-gray-800 text-white px-8 py-2.5 text-sm font-medium">
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Génération en cours...</>
            ) : (
              'Générer l\'offre →'
            )}
          </Button>
        </div>
      </div>

      {/* ── History Modal ─────────────────────────────────────────────────────── */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onCloseHistory}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                <h3 className="text-base font-semibold text-gray-900">Historique des demandes</h3>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{inputHistory.length}</span>
              </div>
              <div className="flex items-center gap-3">
                {inputHistory.length > 0 && (
                  <button type="button" onClick={() => { saveHistory([]); setInputHistory([]); }}
                    className="text-xs text-red-400 hover:text-red-600">Tout effacer</button>
                )}
                <button type="button" onClick={onCloseHistory} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
              </div>
            </div>
            {inputHistory.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Clock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Aucune demande enregistrée</p>
              </div>
            ) : (
              <ul className="max-h-[480px] overflow-y-auto divide-y divide-gray-50">
                {inputHistory.map((entry, i) => (
                  <li key={i}>
                    <button type="button"
                      onClick={() => {
                        setText(entry.text || '');
                        setOfferType(entry.offerType || 'sejour');
                        if (entry.destinations?.length) setDestinations(entry.destinations);
                        if (entry.logements?.length) setLogements(entry.logements);
                        if (entry.dates) setDates(entry.dates);
                        if (entry.outboundFlight) { setHasOutbound(true); setOutboundFlight(entry.outboundFlight); setShowFlights(true); }
                        if (entry.returnFlight) { setHasReturn(true); setReturnFlight(entry.returnFlight); setShowFlights(true); }
                        if (entry.websiteUrls?.length) setWebsiteUrls([...entry.websiteUrls, '']);
                        onCloseHistory?.();
                      }}
                      className="w-full text-left px-6 py-4 hover:bg-purple-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          {entry.destinations?.length ? (
                            <p className="text-sm font-medium text-gray-800">{entry.destinations.join(', ')}</p>
                          ) : entry.text ? (
                            <p className="text-sm text-gray-800 line-clamp-2">{entry.text}</p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">Sans titre</p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {entry.dates && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{entry.dates}</span>}
                            {entry.outboundFlight?.flightNumber && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">✈ {entry.outboundFlight.flightNumber}</span>
                            )}
                            {entry.websiteUrls?.length > 0 && (
                              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">🔗 {entry.websiteUrls.length} URL</span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">{formatHistoryDate(entry.timestamp)}</span>
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
