import React, { useState, useEffect } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import '@blocknote/shadcn/style.css';
import { api } from '../api/client';
import { useAuth } from '../contexts/SimpleAuthContext';
import footerBg from '../assets/design-footer.png';

// ===== COULEURS PAR TYPE DE SECTION =====
const SECTION_COLORS: Record<string, string> = {
  Flights: 'blue',
  Transfers: 'orange',
  Hotel: 'purple',
  Hébergement: 'purple',
  Activities: 'green',
  Activités: 'green',
  Price: 'pink',
  Prix: 'pink',
  Tarifs: 'pink',
};

const getSectionColor = (type: string, title: string): string => {
  return SECTION_COLORS[type] || SECTION_COLORS[title] || 'default';
};

// ===== CONVERSION OFFRE → BLOCS BLOCKNOTE =====
// Parse le texte inline : **gras**, *italique*
const parseInline = (text: string): any[] => {
  const parts: any[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|([^*]+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) parts.push({ type: 'text', text: match[1], styles: { bold: true } });
    else if (match[2]) parts.push({ type: 'text', text: match[2], styles: { italic: true } });
    else if (match[3]) parts.push({ type: 'text', text: match[3], styles: {} });
  }
  return parts.length > 0 ? parts : [{ type: 'text', text, styles: {} }];
};

// Détermine si une ligne bold est un titre de jour/étape (→ H3)
// et non du contenu gras ordinaire ("Prix inclus :", "Important :", etc.)
const DAY_HEADING_PATTERNS = [
  /^jour\s+\d+/i,           // Jour 1, Jour 2…
  /^day\s+\d+/i,            // Day 1, Day 2…
  /^étape\s+\d+/i,          // Étape 1…
  /^nuit\s+\d+/i,           // Nuit 1…
  /^semaine\s+\d+/i,        // Semaine 1…
  /^matin|^après-midi|^soir|^soirée/i, // Matin, Soir…
  /^\d+\s*(er|ème|e)?\s+jour/i, // 1er jour, 2ème jour…
  /^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/i,
];

const isDayHeading = (text: string): boolean => {
  const t = text.trim();
  // Trop long = probablement du contenu, pas un titre
  if (t.length > 80) return false;
  // Finit par ":" = label de champ, pas un titre
  if (t.endsWith(':')) return false;
  return DAY_HEADING_PATTERNS.some(p => p.test(t));
};

const convertOfferToBlocks = (offer: any): any[] => {
  const blocks: any[] = [];

  const makeText = (text: string, styles: any = {}) => ({ type: 'text', text, styles });

  // Titre principal (H1)
  if (offer.title) {
    blocks.push({
      type: 'heading',
      props: { level: 1, textAlignment: 'left' },
      content: [makeText(offer.title)],
    });
  }

  // Introduction
  if (offer.introduction) {
    const lines = offer.introduction.split('\n').filter((l: string) => l.trim());
    lines.forEach((line: string) => {
      blocks.push({ type: 'paragraph', content: parseInline(line.trim()) });
    });
    blocks.push({ type: 'paragraph', content: [] });
  }

  // Parse le corps d'une section avec hiérarchie visuelle claire :
  // ## (H2 dans body)  → H3 avec fond coloré  (sous-section importante, ex: "Vols inclus")
  // ### (H3 dans body) → H3 sans fond         (titre de jour, ex: "Jour 1 : Paris → Rome")
  // **bold seul**      → paragraphe gras       (jamais un bloc heading, évite les faux positifs)
  const parseBody = (raw: string, sectionColor: string) => {
    raw.split('\n')
      .forEach((line: string) => {
        const t = line.trim();
        if (!t) {
          blocks.push({ type: 'paragraph', content: [] });
          return;
        }

        const hMatch = t.match(/^(#{1,4})\s+(.+)$/);
        if (hMatch) {
          const depth = hMatch[1].length;
          const text = hMatch[2];
          if (depth <= 2) {
            // ## → sous-section, backgroundColor inline (surlignage, modifiable)
            blocks.push({
              type: 'heading',
              props: { level: 3, textAlignment: 'left' },
              content: [{ type: 'text', text, styles: { backgroundColor: sectionColor } }],
            });
          } else {
            // ### et + → titre de jour/étape, texte normal sans couleur
            blocks.push({
              type: 'heading',
              props: { level: 3, textAlignment: 'left' },
              content: [makeText(text)],
            });
          }
        } else if (/^\d+[\.\)]\s/.test(t)) {
          blocks.push({ type: 'numberedListItem', content: parseInline(t.replace(/^\d+[\.\)]\s*/, '')) });
        } else if (/^[•]\s/.test(t) || /^[-\*]\s(?=\S{3})/.test(t)) {
          // Bullet : • toujours, - ou * seulement si suivi d'au moins 3 chars (évite les séparateurs)
          blocks.push({ type: 'bulletListItem', content: parseInline(t.replace(/^[•\-\*]\s*/, '')) });
        } else {
          const boldMatch = t.match(/^\*\*(.+?)\*\*\s*$/);
          if (boldMatch && isDayHeading(boldMatch[1])) {
            // Bold + jour/étape → H3
            blocks.push({
              type: 'heading',
              props: { level: 3, textAlignment: 'left' },
              content: [makeText(boldMatch[1])],
            });
          } else if (isDayHeading(t)) {
            // Texte plat "Jour X / Day X / Étape X" non-bold → H3
            blocks.push({
              type: 'heading',
              props: { level: 3, textAlignment: 'left' },
              content: [makeText(t)],
            });
          } else if (
            t.length < 100 &&
            /^(hôtel|hotel|hébergement|chambre|date(\s+de\s+(départ|retour|voyage))?|départ|arrivée|retour|vol\s+[A-Z0-9]|transfert|excursion|repas)\s*:/i.test(t)
          ) {
            // Sous-titre inline "Hôtel : ...", "Date : ...", "Vol AF006 :" → H3 coloré
            blocks.push({
              type: 'heading',
              props: { level: 3, textAlignment: 'left' },
              content: [{ type: 'text', text: t, styles: { backgroundColor: sectionColor } }],
            });
          } else {
            blocks.push({ type: 'paragraph', content: parseInline(t) });
          }
        }
      });
  };

  // Sections
  if (offer.sections && Array.isArray(offer.sections)) {
    offer.sections.forEach((section: any) => {
      const color = getSectionColor(section.type || '', section.title || '');

      // Titre de section (H2) — backgroundColor inline (surlignage sur le texte, modifiable)
      blocks.push({
        type: 'heading',
        props: { level: 2, textAlignment: 'left' },
        content: [{ type: 'text', text: section.title || section.type || 'Section', styles: { backgroundColor: color } }],
      });

      // Sections de vol avec données structurées : génération directe depuis flight_data
      // (évite que "Départ :" soit détecté comme H3 par parseBody)
      if (section.flight_data) {
        const fd = section.flight_data;

        // Logo compagnie juste sous le titre de section
        if (fd.airline_logo_url) {
          blocks.push({
            type: 'image',
            props: { url: fd.airline_logo_url, caption: fd.airline || fd.carrier_code || '', width: 80, textAlignment: 'left' },
          });
        }

        const legLabel = fd.leg === 'retour' ? '✈️ Vol retour' : '✈️ Vol aller';
        const cabinLabels: Record<string, string> = {
          eco: 'Économique', premium_eco: 'Premium Économique', business: 'Business'
        };
        const cabinLabel = cabinLabels[fd.cabin_class] || fd.cabin_class || '';
        const headerParts: string[] = [legLabel];
        if (fd.flight_number) headerParts.push(fd.flight_number);
        if (cabinLabel) headerParts.push(cabinLabel);

        // Ligne en-tête bold : "✈️ Vol aller | AF0002 | Économique"
        blocks.push({ type: 'paragraph', content: parseInline(`**${headerParts.join(' | ')}**`) });

        // Route aéroports : "CDG → JFK" en gras
        const depAirport = fd.departure_airport || '';
        const arrAirport = fd.arrival_airport || '';
        const depCity = fd.departure_city || '';
        const arrCity = fd.arrival_city || '';
        if (depAirport || arrAirport) {
          blocks.push({ type: 'paragraph', content: parseInline(`**${depAirport} → ${arrAirport}**`) });
        }
        if (depCity || arrCity) {
          blocks.push({ type: 'paragraph', content: [makeText(`${depCity} → ${arrCity}`)] });
        }

        // Horaires avec fuseau horaire (nom de ville) et indicateur +1j si arrivée décalée
        const depTime = fd.departure_time || '';
        const arrTime = fd.arrival_time || '';
        const depTerm = fd.departure_terminal ? ` — Terminal ${fd.departure_terminal}` : '';
        const arrTerm = fd.arrival_terminal ? ` — Terminal ${fd.arrival_terminal}` : '';
        const dayOffset: number = fd.arrival_day_offset || 0;
        const nextDayLabel = dayOffset > 0 ? ` +${dayOffset}j` : '';
        // Fuseau horaire affiché via la ville (déjà en heure locale Amadeus)
        const depTz = depCity ? ` (heure de ${depCity})` : '';
        const arrTz = arrCity ? ` (heure de ${arrCity})` : '';
        if (depTime) {
          blocks.push({ type: 'paragraph', content: [makeText(`Départ : ${depTime}${depTerm}${depTz}`)] });
        }
        if (arrTime) {
          blocks.push({ type: 'paragraph', content: [makeText(`Arrivée : ${arrTime}${nextDayLabel}${arrTerm}${arrTz}`)] });
        }

        if (fd.total_duration) {
          blocks.push({ type: 'paragraph', content: [makeText(`Durée totale : ${fd.total_duration}`)] });
        }

        // Escales
        if (Array.isArray(fd.stopovers) && fd.stopovers.length > 0) {
          fd.stopovers.forEach((stop: any) => {
            const stopCity = stop.city ? ` (${stop.city})` : '';
            const layover = stop.layover_duration ? ` — ${stop.layover_duration}` : '';
            blocks.push({ type: 'paragraph', content: [makeText(`Escale : ${stop.airport}${stopCity}${layover}`)] });
          });
        }
      } else {
        // Sections non-vol : parser le body text normalement
        const raw = section.body || section.content || section.description || section.details || '';
        if (raw) {
          parseBody(raw, color);
        }

        // Items (format liste explicite)
        if (section.items && Array.isArray(section.items)) {
          section.items.forEach((item: any) => {
            const text = typeof item === 'string' ? item
              : item.title && item.description ? `${item.title} — ${item.description}`
              : item.title || item.label || JSON.stringify(item);
            blocks.push({ type: 'bulletListItem', content: parseInline(text) });
          });
        }
      }

      // Séparateur de fin de section
      blocks.push({ type: 'paragraph', content: [] });

      // Images en fin de section — uniquement pour les sections non-vol (Hébergement, etc.)
      if (!section.flight_data) {
        const sectionImagesSet = new Set<string>();
        if (section.image) {
          const url = typeof section.image === 'string' ? section.image : section.image?.url;
          if (url) sectionImagesSet.add(url);
        }
        if (section.images && Array.isArray(section.images)) {
          section.images.forEach((img: any) => {
            const url = typeof img === 'string' ? img : img?.url;
            if (url) sectionImagesSet.add(url);
          });
        }
        if (sectionImagesSet.size > 0) {
          sectionImagesSet.forEach((url) => {
            blocks.push({
              type: 'image',
              props: { url, caption: '', width: 512, textAlignment: 'left' },
            });
          });
          blocks.push({ type: 'paragraph', content: [] });
        }
      }
    });
  }

  return blocks.length > 0 ? blocks : [{ type: 'paragraph', content: [] }];
};

// Convertir données sauvegardées (blocknote_data) ou offre
const getInitialBlocks = (prefilledData: any): any[] | null => {
  if (!prefilledData) return null;

  // Cas 1 : données BlockNote déjà sauvegardées
  if (prefilledData.blocknote_data) return prefilledData.blocknote_data;

  // Cas 2 : offre IA avec offer_structure
  if (prefilledData.offer_structure) {
    const offer = prefilledData.offer_structure;
    // Injecter les scraped_images dans les sections si le backend les a fournies
    if (prefilledData.scraped_images && Array.isArray(prefilledData.scraped_images) && offer.sections) {
      const imgs: string[] = prefilledData.scraped_images;
      let imgIndex = 0;
      offer.sections.forEach((section: any) => {
        if (!section.images || section.images.length === 0) {
          if (imgIndex < imgs.length) {
            section.images = [imgs[imgIndex++]];
          }
        }
      });
    }
    return convertOfferToBlocks(offer);
  }

  // Cas 3 : offre directe
  if (prefilledData.title || prefilledData.sections) return convertOfferToBlocks(prefilledData);

  return null;
};

// ===== CARTE VOL (éditeur + PDF) =====
const renderFlightCardHTML = (fd: any): string => {
  const dep = fd.departure_airport || '';
  const arr = fd.arrival_airport || '';
  const depCity = fd.departure_city || '';
  const arrCity = fd.arrival_city || '';
  const depTime = fd.departure_time || '';
  const arrTime = fd.arrival_time || '';
  const duration = fd.total_duration || '';
  const fn = fd.flight_number || '';
  const logoUrl = fd.airline_logo_url || '';
  const airline = fd.airline || fd.carrier_code || '';
  const stops = fd.stops || 0;
  const stopovers: any[] = fd.stopovers || [];
  const cabin = fd.cabin_class || '';
  const cabinLabel: Record<string, string> = { eco: 'Éco', premium_eco: 'Premium Éco', business: 'Business' };
  const depTerminal = fd.departure_terminal ? ` T${fd.departure_terminal}` : '';
  const arrTerminal = fd.arrival_terminal ? ` T${fd.arrival_terminal}` : '';

  const stopoversHTML = stopovers.map((s: any) => {
    const via = s.airport || '';
    const city = s.city ? ` (${s.city})` : '';
    const layover = s.layover_duration ? ` — ${s.layover_duration} de correspondance` : '';
    return `<div style="font-size:12px;color:#6B7280;margin-top:4px;">↳ Escale ${via}${city}${layover}</div>`;
  }).join('');

  const directOrStop = stops === 0
    ? '<span style="color:#10B981;font-size:12px;">Direct</span>'
    : `<span style="color:#F59E0B;font-size:12px;">${stops} escale${stops > 1 ? 's' : ''}</span>`;

  return `
<div style="background:#EFF6FF;border:1.5px solid #3B82F6;border-radius:10px;padding:16px 20px;margin:12px 0;font-family:Corbel,Arial,sans-serif;">
  <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;flex-wrap:wrap;">
    ${logoUrl ? `<img src="${logoUrl}" height="36" style="object-fit:contain;flex-shrink:0;" />` : ''}
    <div style="flex:1;">
      <span style="font-weight:bold;font-size:15px;color:#1E3A5F;">${airline}</span>
      ${fn ? `<span style="margin-left:10px;color:#6B7280;font-size:13px;">✈ ${fn}</span>` : ''}
      ${cabin && cabinLabel[cabin] ? `<span style="margin-left:10px;background:#DBEAFE;color:#1D4ED8;font-size:11px;padding:2px 8px;border-radius:20px;">${cabinLabel[cabin]}</span>` : ''}
    </div>
    ${directOrStop}
  </div>
  <div style="display:flex;align-items:center;gap:8px;">
    <div style="text-align:center;">
      <div style="font-size:22px;font-weight:bold;color:#1E3A5F;">${depTime}</div>
      <div style="font-size:13px;font-weight:bold;color:#374151;">${dep}${depTerminal}</div>
      ${depCity ? `<div style="font-size:11px;color:#6B7280;">${depCity}</div>` : ''}
    </div>
    <div style="flex:1;text-align:center;padding:0 8px;">
      <div style="border-top:2px dashed #93C5FD;margin:0 4px;"></div>
      ${duration ? `<div style="font-size:11px;color:#6B7280;margin-top:4px;">${duration}</div>` : ''}
      ${stopoversHTML}
    </div>
    <div style="text-align:center;">
      <div style="font-size:22px;font-weight:bold;color:#1E3A5F;">${arrTime}</div>
      <div style="font-size:13px;font-weight:bold;color:#374151;">${arr}${arrTerminal}</div>
      ${arrCity ? `<div style="font-size:11px;color:#6B7280;">${arrCity}</div>` : ''}
    </div>
  </div>
</div>`;
};

// ===== CONVERSION BLOCS → HTML POUR PDF =====
const BG_COLORS: Record<string, string> = {
  blue: '#2196F3',
  orange: '#FF9800',
  purple: '#9C27B0',
  green: '#4CAF50',
  pink: '#E91E63',
  red: '#f44336',
  gray: '#607D8B',
  yellow: '#F59E0B',
  brown: '#795548',
};

const convertBlocksToHTML = (blocks: any[]): string => {
  let html = '';
  let inList = false;

  const closeList = () => {
    if (inList) { html += '</ul>'; inList = false; }
  };

  const renderInline = (content: any[]): string => {
    if (!content || content.length === 0) return '&nbsp;';
    return content.map((c: any) => {
      if (c.type === 'link') {
        return `<a href="${c.href}">${renderInline(c.content)}</a>`;
      }
      let t = (c.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      if (c.styles?.bold) t = `<strong>${t}</strong>`;
      if (c.styles?.italic) t = `<em>${t}</em>`;
      if (c.styles?.underline) t = `<u>${t}</u>`;
      if (c.styles?.strike) t = `<s>${t}</s>`;
      if (c.styles?.textColor && c.styles.textColor !== 'default') {
        const hex = BG_COLORS[c.styles.textColor] || c.styles.textColor;
        t = `<span style="color:${hex};">${t}</span>`;
      }
      if (c.styles?.backgroundColor && c.styles.backgroundColor !== 'default') {
        const hex = BG_COLORS[c.styles.backgroundColor] || c.styles.backgroundColor;
        t = `<span style="background-color:${hex};color:white;padding:2px 6px;border-radius:3px;">${t}</span>`;
      }
      return t;
    }).join('');
  };

  blocks.forEach((block: any) => {
    const text = renderInline(block.content || []);

    if (block.type === 'bulletListItem') {
      if (!inList) { html += '<ul style="padding-left:20px;margin:8px 0;">'; inList = true; }
      html += `<li style="margin:4px 0;">${text}</li>`;
      return;
    }

    closeList();

    switch (block.type) {
      case 'heading': {
        const level = block.props?.level || 1;
        const style = level === 1
          ? 'font-size:24px;color:#2c3e50;border-bottom:2px solid #e0e0e0;padding-bottom:6px;margin:20px 0 10px 0;'
          : level === 2
            ? 'font-size:18px;margin:18px 0 8px 0;'
            : 'font-size:15px;margin:12px 0 6px 0;';
        html += `<h${level} style="${style}">${text}</h${level}>`;
        break;
      }
      case 'paragraph':
        html += `<p style="margin:6px 0;line-height:1.7;">${text}</p>`;
        break;
      case 'numberedListItem':
        html += `<ol style="padding-left:20px;margin:8px 0;"><li style="margin:4px 0;">${text}</li></ol>`;
        break;
      case 'image':
        if (block.props?.url) {
          html += `<img src="${block.props.url}" alt="${block.props.caption || ''}" style="max-width:100%;border-radius:8px;margin:12px 0;" />`;
        }
        break;
      default:
        if (text && text !== '&nbsp;') html += `<p style="margin:6px 0;">${text}</p>`;
    }

    // Sous-blocs (nested)
    if (block.children && block.children.length > 0) {
      html += `<div style="margin-left:20px;">${convertBlocksToHTML(block.children)}</div>`;
    }
  });

  closeList();
  return html;
};

// ===== FOOTER COMPONENT =====
const FOOTER_BEIGE = '#c8a882';

const IconBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    width: '34px', height: '34px', background: FOOTER_BEIGE,
    borderRadius: '5px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0,
  }}>
    {children}
  </div>
);

const FooterComponent: React.FC<{ userEmail?: string }> = ({ userEmail }) => {
  const displayEmail = userEmail || 'info@invit.be';
  return (
    <div style={{
      width: '100%',
      borderTop: '1px solid #e5e7eb',
      padding: '16px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'white',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <IconBox><svg width="15" height="15" fill="white" viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg></IconBox>
        <span style={{ fontSize: '13px', color: '#4a4a4a', fontFamily: 'Corbel, Arial, sans-serif' }}>+32 2 774 04 04</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <IconBox><svg width="15" height="15" fill="white" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg></IconBox>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '13px', color: '#4a4a4a', fontFamily: 'Corbel, Arial, sans-serif' }}>{displayEmail}</span>
          <span style={{ fontSize: '12px', color: '#777', fontFamily: 'Corbel, Arial, sans-serif' }}>https://www.invit.be/</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <IconBox><svg width="15" height="15" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></IconBox>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '13px', color: '#4a4a4a', fontFamily: 'Corbel, Arial, sans-serif' }}>Av. Baron d'Huart 7,</span>
          <span style={{ fontSize: '13px', color: '#4a4a4a', fontFamily: 'Corbel, Arial, sans-serif' }}>1150 Woluwe St-Pierre</span>
        </div>
      </div>
    </div>
  );
};

// ===== PROPS =====
interface BlockNoteEditorProps {
  prefilledData?: any;
  documentId?: number;
  onSave?: (data: any) => void;
}

// ===== COMPOSANT PRINCIPAL =====
const BlockNoteEditorComponent: React.FC<BlockNoteEditorProps> = ({
  prefilledData,
  documentId,
  onSave,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [savedDocId, setSavedDocId] = useState<number | undefined>(documentId);
  const [selectedImageBlockId, setSelectedImageBlockId] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [replacingImageBlockId, setReplacingImageBlockId] = useState<string | null>(null);
  const [imageQuery, setImageQuery] = useState('');
  const [imageResults, setImageResults] = useState<{url:string;thumb:string;alt:string;author:string;source:string}[]>([]);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [imageLoadMoreLoading, setImageLoadMoreLoading] = useState(false);
  const [imageSearchError, setImageSearchError] = useState('');
  const [imageProvider, setImageProvider] = useState('');
  const [imagePage, setImagePage] = useState(1);
  const IMAGE_PAGE_SIZE = 20;
  const [headerFooter] = useState({
    enabled: true,
    headerLogo: 'https://i.imgur.com/ENSFl11.png',
  });

  const initialBlocks = getInitialBlocks(prefilledData);

  const editor = useCreateBlockNote({
    initialContent: initialBlocks || undefined,
    uploadFile: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('api/upload-image/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.url;
    },
  });

  // Mettre à jour le contenu si prefilledData change
  useEffect(() => {
    if (!prefilledData) return;
    const blocks = getInitialBlocks(prefilledData);
    if (blocks && blocks.length > 0) {
      editor.replaceBlocks(editor.document, blocks);
    }
  }, [prefilledData]);

  // Détecter quand un bloc image est sélectionné (pour afficher "Remplacer l'image")
  useEffect(() => {
    const tiptap = (editor as any)._tiptapEditor;
    if (!tiptap) return;
    const handler = () => {
      try {
        const selected = (editor as any).getSelectedBlocks?.();
        if (selected) {
          const imgBlock = selected.find((b: any) => b.type === 'image');
          setSelectedImageBlockId(imgBlock?.id ?? null);
          return;
        }
      } catch {}
      try {
        const pos = (editor as any).getTextCursorPosition?.();
        setSelectedImageBlockId(pos?.block?.type === 'image' ? pos.block.id : null);
      } catch {
        setSelectedImageBlockId(null);
      }
    };
    tiptap.on('selectionUpdate', handler);
    return () => tiptap.off('selectionUpdate', handler);
  }, [editor]);

  // Trouver le dossier de l'utilisateur parmi une liste de dossiers
  const findFolderIdForUser = (folders: any[]): number | undefined => {
    if (!user || !folders?.length) return undefined;
    const candidates: string[] = [];
    if (user.first_name) candidates.push(user.first_name.toLowerCase());
    if (user.last_name) candidates.push(user.last_name.toLowerCase());
    // Extraire le préfixe de l'email (ex: denis@invit.be → "denis")
    const usernamePrefix = user.username?.split('@')[0]?.toLowerCase();
    if (usernamePrefix) candidates.push(usernamePrefix);
    const emailPrefix = user.email?.split('@')[0]?.toLowerCase();
    if (emailPrefix && !candidates.includes(emailPrefix)) candidates.push(emailPrefix);

    const folder = folders.find((f: any) =>
      candidates.some(name => name && f.name.toLowerCase().includes(name))
    );
    console.log('📁 Candidats:', candidates, '| Dossier trouvé:', folder?.name, `(id:${folder?.id})`);
    return folder?.id;
  };

  // Titre du document (premier bloc H1)
  const getDocTitle = (): string => {
    const firstH1 = editor.document.find((b: any) => b.type === 'heading' && b.props?.level === 1);
    const titleText = (firstH1?.content as any[])?.map((c: any) => c.text).join('') || '';
    return titleText || 'Document';
  };

  // ===== RECHERCHE D'IMAGES =====
  const handleImageSearch = async (q: string) => {
    if (!q.trim()) return;
    setImageSearchLoading(true);
    setImageSearchError('');
    setImagePage(1);
    try {
      const res = await api.get(`api/search-images/?q=${encodeURIComponent(q)}&count=${IMAGE_PAGE_SIZE}`);
      setImageResults(res.data.images || []);
      setImageProvider(res.data.provider || '');
      if (res.data.error) setImageSearchError(res.data.error);
    } catch {
      setImageResults([]);
      setImageSearchError('Erreur lors de la recherche.');
    } finally {
      setImageSearchLoading(false);
    }
  };

  const handleImageLoadMore = async () => {
    if (!imageQuery.trim()) return;
    setImageLoadMoreLoading(true);
    try {
      const nextPage = imagePage + 1;
      const res = await api.get(`api/search-images/?q=${encodeURIComponent(imageQuery)}&count=${IMAGE_PAGE_SIZE}&page=${nextPage}`);
      setImageResults(prev => [...prev, ...(res.data.images || [])]);
      setImagePage(nextPage);
    } catch { /* silencieux */ } finally {
      setImageLoadMoreLoading(false);
    }
  };

  const handleInsertImage = (url: string) => {
    if (replacingImageBlockId) {
      try {
        const block = (editor as any).getBlock?.(replacingImageBlockId);
        if (block) {
          editor.updateBlock(replacingImageBlockId as any, { props: { ...block.props, url } } as any);
          setReplacingImageBlockId(null);
          setShowImagePicker(false);
          return;
        }
      } catch {}
      setReplacingImageBlockId(null);
    }
    const selected = (editor as any).getSelectedBlocks?.();
    const imageBlock = selected?.find((b: any) => b.type === 'image');
    if (imageBlock) {
      editor.updateBlock(imageBlock, { type: 'image', props: { url } } as any);
    } else {
      const lastBlock = editor.document[editor.document.length - 1];
      editor.insertBlocks(
        [{ type: 'image', props: { url, caption: '', previewWidth: 700 } } as any],
        lastBlock,
        'after'
      );
    }
    setShowImagePicker(false);
  };

  // ===== SAUVEGARDE =====
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const title = getDocTitle();
      const blocks = editor.document;

      // Récupérer les dossiers depuis l'API (plus fiable que localStorage)
      let folderId: number | undefined;
      try {
        const foldersResp = await api.get('api/folders/');
        const allFolders: any[] = [];
        const flattenList = (list: any[]) => {
          list.forEach((f: any) => {
            allFolders.push(f);
            if (f.subfolders?.length) flattenList(f.subfolders);
          });
        };
        flattenList(foldersResp.data || []);
        folderId = findFolderIdForUser(allFolders);
      } catch {
        // Fallback localStorage
        try {
          const saved = localStorage.getItem('demo_folders');
          if (saved) folderId = findFolderIdForUser(JSON.parse(saved));
        } catch {}
      }

      const saveData: any = {
        title,
        description: `Document créé le ${new Date().toLocaleDateString('fr-FR')}`,
        document_type: 'blocknote',
        blocknote_data: blocks,
        offer_structure: prefilledData?.offer_structure || null,
      };
      if (folderId !== undefined) saveData.folder_id = folderId;

      let response;
      if (savedDocId) {
        response = await api.patch(`api/documents/${savedDocId}/`, saveData);
      } else {
        response = await api.post('api/documents/', saveData);
        setSavedDocId(response.data.id);
      }

      // Invalider le cache localStorage
      localStorage.removeItem('demo_documents');
      localStorage.removeItem('demo_data_timestamp');

      const folderMsg = folderId ? ` dans votre dossier personnel` : ' (aucun dossier trouvé — vérifiez la console)';
      alert(`✅ "${title}" sauvegardé${folderMsg} !`);
      if (onSave) onSave({ blocknote_data: blocks, documentId: response.data.id });
    } catch (error: any) {
      const msg = error?.detail || error?.response?.data?.detail || error?.message || 'Erreur inconnue';
      alert(`❌ Erreur: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== GÉNÉRATION PDF =====
  const handleGeneratePDF = async () => {
    setIsLoading(true);
    try {
      const blocks = editor.document;
      let bodyHTML = convertBlocksToHTML(blocks);

      // Injecter les cartes vol visuelles juste après les titres de section correspondants
      const offerSections: any[] = prefilledData?.offer_structure?.sections || [];
      offerSections.forEach((section: any) => {
        if (!section.flight_data || !section.title) return;
        const cardHTML = renderFlightCardHTML(section.flight_data);
        // Cherche le titre de section dans le HTML généré et injecte la carte après
        const escapedTitle = section.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        bodyHTML = bodyHTML.replace(
          new RegExp(`(<h2[^>]*>[^<]*${escapedTitle}[^<]*</h2>)`, 'i'),
          `$1${cardHTML}`
        );
      });

      const title = getDocTitle();

      // Date du jour au format JJ/MM/AAAA
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

      // Mosaïque finale 2×4 avec toutes les images du document
      const allImageUrls: string[] = [];
      blocks.forEach((b: any) => {
        if (b.type === 'image' && b.props?.url) allImageUrls.push(b.props.url);
      });
      // Dédoublonner et limiter à 8
      const mosaicUrls = [...new Set(allImageUrls)].slice(0, 8);
      let mosaicHTML = '';
      if (mosaicUrls.length > 0) {
        const cells = mosaicUrls.map(url =>
          `<td style="padding:3px;"><img src="${url}" alt="" style="width:100%;height:100px;object-fit:cover;border-radius:4px;display:block;" /></td>`
        );
        // 2 colonnes × N lignes
        const rows: string[] = [];
        for (let i = 0; i < cells.length; i += 4) {
          rows.push(`<tr>${cells.slice(i, i + 4).join('')}</tr>`);
        }
        mosaicHTML = `<div style="margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px;">
          <table style="width:100%;border-collapse:collapse;">${rows.join('')}</table>
        </div>`;
      }

      // Injecter la date en haut + disclaimer et mosaïque en bas
      bodyHTML = `<p style="text-align:right;font-size:12px;color:#888;font-family:Corbel,Arial,sans-serif;margin:0 0 16px 0;">Date : ${dateStr}</p>${bodyHTML}
<div style="margin-top:40px;padding-top:10px;border-top:1px solid #e5e7eb;">
  <p style="font-size:11px;color:#999;font-style:italic;font-family:Corbel,Arial,sans-serif;line-height:1.5;margin:0;">
    <strong style="color:#666;">Tarifs et conditions</strong> — Offre sous réserve de disponibilités au moment de la réservation.
  </p>
</div>${mosaicHTML}`;

      const headerHTML = headerFooter.enabled ? `
        <div class="page-header">
          <img src="${headerFooter.headerLogo}" style="width:100%;height:auto;display:block;" />
        </div>` : '';

      const userEmail = user?.email || 'info@invit.be';
      const iconDiv = (svg: string) => `<div style="width:28px;height:28px;background:#c8a882;border-radius:4px;display:inline-block;vertical-align:middle;margin-right:8px;text-align:center;line-height:28px;">${svg}</div>`;
      const phone = iconDiv(`<svg width="13" height="13" fill="white" viewBox="0 0 24 24" style="vertical-align:middle;"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>`);
      const mail  = iconDiv(`<svg width="13" height="13" fill="white" viewBox="0 0 24 24" style="vertical-align:middle;"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`);
      const pin   = iconDiv(`<svg width="13" height="13" fill="white" viewBox="0 0 24 24" style="vertical-align:middle;"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`);
      const txt   = 'font-size:13px;color:#4a4a4a;font-family:Corbel,Arial,sans-serif;vertical-align:middle;';

      const footerHTML2 = headerFooter.enabled ? `
        <table class="page-footer" style="width:210mm;border-collapse:collapse;border-top:1px solid #e5e7eb;">
          <tr>
            <td style="padding:14px 0 14px 15mm;vertical-align:middle;white-space:nowrap;">
              ${phone}<span style="${txt}">+32 2 774 04 04</span>
            </td>
            <td style="padding:14px 0;vertical-align:middle;text-align:center;white-space:nowrap;">
              ${mail}<span style="vertical-align:middle;display:inline-block;">
                <span style="display:block;${txt}">${userEmail}</span>
                <span style="display:block;font-size:12px;color:#888;font-family:Corbel,Arial,sans-serif;">https://www.invit.be/</span>
              </span>
            </td>
            <td style="padding:14px 15mm 14px 0;vertical-align:middle;text-align:right;white-space:nowrap;">
              ${pin}<span style="vertical-align:middle;display:inline-block;">
                <span style="display:block;${txt}">Av. Baron d'Huart 7,</span>
                <span style="display:block;${txt}">1150 Woluwe St-Pierre</span>
              </span>
            </td>
          </tr>
        </table>` : '';

      const html = `${headerHTML}${footerHTML2}<div class="content">${bodyHTML}</div>`;

      const css = `
        @page {
          size: A4;
          margin: ${headerFooter.enabled ? '6cm 0 2.5cm 0' : '3cm 2cm'};
          @top-left { content: element(header); width: 210mm; }
          @bottom-left { content: element(footer); width: 210mm; }
        }
        body { font-family: Corbel, Arial, sans-serif; color: #2c3e50; background: white; }
        .page-header { position: running(header); width: 210mm; }
        .page-footer { position: running(footer); width: 210mm; }
        .content { padding: 0 1.5cm; }
        h1 { font-size: 24px; color: #2c3e50; border-bottom: 3px solid #667eea; padding-bottom: 8px; }
        h2 { font-size: 18px; }
        ul { list-style: disc; }
        p { line-height: 1.7; }
      `;

      const response = await api.post('api/grapesjs-pdf-generator/', { html, css,
        company_info: { name: 'Invitation au Voyage' }
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      alert('✅ PDF généré !');
    } catch (error: any) {
      alert(`❌ Erreur PDF: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8f9fa' }}>

      {/* Barre d'outils */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 24px', background: 'white',
        borderBottom: '1px solid #e5e7eb', flexShrink: 0,
      }}>
        <span style={{ fontSize: '14px', color: '#6b7280', marginRight: '8px' }}>
          ✏️ Cliquez directement sur le texte pour l'éditer
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleSave}
          disabled={isLoading}
          style={{
            padding: '8px 18px', background: '#667eea', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            fontWeight: '600', fontSize: '14px', opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? '...' : '💾 Sauvegarder'}
        </button>
        {selectedImageBlockId && (
          <button
            onClick={() => { setReplacingImageBlockId(selectedImageBlockId); setShowImagePicker(true); }}
            style={{
              padding: '8px 18px', background: '#059669', color: 'white',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontWeight: '600', fontSize: '14px',
            }}
          >
            🔍 Remplacer l'image
          </button>
        )}
        <button
          onClick={() => { setReplacingImageBlockId(null); setShowImagePicker(true); }}
          style={{
            padding: '8px 18px', background: '#7c3aed', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            fontWeight: '600', fontSize: '14px',
          }}
        >
          🖼️ Images
        </button>
        <button
          onClick={handleGeneratePDF}
          disabled={isLoading}
          style={{
            padding: '8px 18px', background: '#e53e3e', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            fontWeight: '600', fontSize: '14px', opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? '...' : '📄 Exporter PDF'}
        </button>
      </div>

      {/* Éditeur BlockNote */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', boxShadow: '0 2px 16px rgba(0,0,0,0.12)', borderRadius: '12px', overflow: 'hidden' }}>

          {/* Header */}
          {headerFooter.enabled && (
            <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0' }}>
              <img
                src={headerFooter.headerLogo}
                alt="Header"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          )}

          {/* Contenu éditable */}
          <div
            className="bn-shadcn"
            style={{ background: 'white', padding: '40px 48px', minHeight: '500px' }}
          >
            <BlockNoteView editor={editor} theme="light" />
          </div>

          {/* Footer */}
          {headerFooter.enabled && (
            <FooterComponent userEmail={user?.email} />
          )}

        </div>
      </div>

      {/* ===== IMAGE PICKER MODAL ===== */}
      {showImagePicker && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => { setShowImagePicker(false); setReplacingImageBlockId(null); }}
        >
          <div
            style={{
              background: 'white', borderRadius: '16px',
              width: '760px', maxWidth: '95vw',
              maxHeight: '85vh', display: 'flex', flexDirection: 'column',
              overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a' }}>
                {replacingImageBlockId ? '🔍 Remplacer l\'image' : '🖼️ Insérer une image'}
              </span>
              <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={imageQuery}
                  onChange={e => setImageQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleImageSearch(imageQuery)}
                  placeholder="Bali, hôtel piscine, plage tropicale…"
                  autoFocus
                  style={{
                    flex: 1, padding: '8px 14px', borderRadius: '8px',
                    border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none',
                  }}
                />
                <button
                  onClick={() => handleImageSearch(imageQuery)}
                  disabled={imageSearchLoading}
                  style={{
                    padding: '8px 18px', background: '#7c3aed', color: 'white',
                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                    fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap',
                    opacity: imageSearchLoading ? 0.6 : 1,
                  }}
                >
                  {imageSearchLoading ? '…' : 'Rechercher'}
                </button>
              </div>
              <button
                onClick={() => { setShowImagePicker(false); setReplacingImageBlockId(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af', lineHeight: 1 }}
              >×</button>
            </div>

            {/* Grid */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 20px' }}>
              {imageResults.length === 0 && !imageSearchLoading && !imageSearchError && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
                  <p style={{ fontSize: '14px' }}>Tapez un mot-clé et lancez la recherche</p>
                  <p style={{ fontSize: '12px', marginTop: '4px', color: '#d1d5db' }}>Cliquez sur une image pour l'insérer dans l'éditeur</p>
                </div>
              )}
              {imageSearchError && !imageSearchLoading && (
                <div style={{ textAlign: 'center', padding: '32px 24px', color: '#ef4444' }}>
                  <p style={{ fontSize: '13px' }}>{imageSearchError}</p>
                </div>
              )}
              {imageSearchLoading && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: '14px' }}>
                  Recherche en cours…
                </div>
              )}
              {!imageSearchLoading && imageResults.length > 0 && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {imageResults.map((img, i) => (
                      <div
                        key={`${i}-${img.url}`}
                        onClick={() => handleInsertImage(img.url)}
                        style={{
                          cursor: 'pointer', borderRadius: '8px', overflow: 'hidden',
                          border: '2px solid transparent', transition: 'border-color 0.15s, transform 0.1s',
                          position: 'relative',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#7c3aed'; (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.03)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
                        title={img.alt || img.author}
                      >
                        <img
                          src={img.thumb || img.url}
                          alt={img.alt}
                          style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        {img.author && (
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.45)', color: 'white', fontSize: '10px', padding: '3px 5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {img.author}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <button
                      onClick={handleImageLoadMore}
                      disabled={imageLoadMoreLoading}
                      style={{
                        padding: '8px 28px', background: imageLoadMoreLoading ? '#e5e7eb' : '#f3f4f6',
                        border: '1.5px solid #e5e7eb', borderRadius: '8px',
                        cursor: imageLoadMoreLoading ? 'default' : 'pointer',
                        fontSize: '13px', color: '#374151', fontWeight: 500,
                      }}
                    >
                      {imageLoadMoreLoading ? 'Chargement…' : `Charger plus (${imageResults.length} affichées)`}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 24px', borderTop: '1px solid #f0f0f0', fontSize: '11px', color: '#9ca3af' }}>
              {replacingImageBlockId ? 'Cliquez sur une image pour remplacer l\'image sélectionnée' : 'Cliquez sur une image pour l\'insérer dans l\'éditeur'}
              {imageProvider && <> · Source : <strong>{imageProvider}</strong></>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockNoteEditorComponent;
