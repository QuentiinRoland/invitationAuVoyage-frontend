// Utilitaires pour convertir les données d'offre en composants Craft.js

export const textToHtml = (txt?: string) => {
  if (!txt) return '';
  
  // Mini-parser : paragraphes + listes
  const lines = txt.split('\n').map(l => l.trim());
  const items: string[] = [];
  let inList = false;

  for (const line of lines) {
    if (!line) { 
      items.push('<br/>'); 
      continue; 
    }
    
    // puces style markdown
    if (/^[-*•]\s+/.test(line)) {
      if (!inList) { 
        items.push('<ul>'); 
        inList = true; 
      }
      items.push(`<li>${line.replace(/^[-*•]\s+/, '')}</li>`);
    } else {
      if (inList) { 
        items.push('</ul>'); 
        inList = false; 
      }
      items.push(`<p>${line}</p>`);
    }
  }
  
  if (inList) items.push('</ul>');
  
  return items.join('');
};

export const getSectionIcon = (type: string) => {
  switch (type) {
    case 'Flights':
      return '✈️';
    case 'Hotel':
      return '🏨';
    case 'Price':
      return '💰';
    case 'Transfers':
      return '🚗';
    case 'Activities':
      return '🎯';
    default:
      return '📌';
  }
};

export const getSectionTitle = (section: any) => {
  return section?.title || section?.type || 'Section';
};

export const cleanText = (text: string) => {
  // Nettoyer le HTML pour avoir juste du texte
  return text
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/?ul>/g, '')
    .replace(/<li>/g, '• ')
    .replace(/<\/li>/g, '\n')
    .replace(/<\/?p>/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};





