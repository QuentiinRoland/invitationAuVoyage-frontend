import React, { useState, Component, ErrorInfo, ReactNode, useMemo } from 'react';
import { Puck } from '@measured/puck';
import '@measured/puck/puck.css';

// Error Boundary pour capturer les erreurs de Puck
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class PuckErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Puck Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          backgroundColor: '#FFF3CD',
          border: '1px solid #FFEAA7',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h3 style={{ color: '#856404', marginBottom: '15px' }}>
            ⚠️ Problème avec Puck Editor
          </h3>
          <p style={{ color: '#856404', marginBottom: '20px' }}>
            Une erreur s'est produite dans l'éditeur visuel.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              backgroundColor: '#856404',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Mapping tolérant (casse/variantes)
const sectionTypeMapping: Record<string, string> = {
  flights: 'FlightDetailsBlock',
  flight: 'FlightDetailsBlock',
  vols: 'FlightDetailsBlock',

  transfers: 'TransferBlock',
  transfer: 'TransferBlock',
  transferts: 'TransferBlock',

  hotel: 'HotelBlock',
  hotels: 'HotelBlock',
  hebergement: 'HotelBlock',
  hébergement: 'HotelBlock',

  price: 'PriceBlock',
  prices: 'PriceBlock',
  tarifs: 'PriceBlock',
  prix: 'PriceBlock',
};

function normalizeType(t: any) {
  return String(t || '').trim().toLowerCase();
}

// Configuration avec composants spécialisés
const config = {
  components: {
    Text: {
      fields: {
        text: { type: "text" }
      },
      defaultProps: {
        text: "Votre texte ici"
      },
      render: ({ text }: any) => {
        return <div style={{ padding: '10px', lineHeight: '1.6' }}>{text}</div>
      }
    },
    
    Title: {
      fields: {
        text: { type: "text" },
        size: {
          type: "select",
          options: [
            { label: "Grand", value: "large" },
            { label: "Moyen", value: "medium" },
            { label: "Petit", value: "small" }
          ]
        },
        align: {
          type: "select",
          options: [
            { label: "Gauche", value: "left" },
            { label: "Centre", value: "center" },
            { label: "Droite", value: "right" }
          ]
        }
      },
      defaultProps: {
        text: "OFFRE COMMERCIALE",
        size: "large",
        align: "center"
      },
      render: ({ text, size, align }: any) => {
        const fontSize = size === 'large' ? '28px' : size === 'medium' ? '24px' : '20px';
        return (
          <h1 style={{ 
            fontSize, 
            textAlign: align, 
            color: '#2C3E50', 
            margin: '20px 0',
            fontWeight: 'bold'
          }}>
            {text}
          </h1>
        )
      }
    },

    Contact: {
      fields: {
        companyName: { type: "text" },
        phone: { type: "text" },
        email: { type: "text" }
      },
      defaultProps: {
        companyName: "Invitation au Voyage",
        phone: "+33 1 23 45 67 89",
        email: "contact@invitationauvoyage.fr"
      },
      render: ({ companyName, phone, email }: any) => {
        return (
          <div style={{ 
            backgroundColor: '#F8F9FA', 
            border: '1px solid #E0E0E0',
            borderRadius: '8px',
            padding: '20px',
            margin: '20px 0',
            textAlign: 'right'
          }}>
            <h4 style={{ color: '#2C3E50', margin: '0 0 10px 0' }}>{companyName}</h4>
            <div style={{ fontSize: '14px', color: '#666' }}>
              <div style={{ marginBottom: '5px' }}>📞 {phone}</div>
              <div>✉️ {email}</div>
            </div>
          </div>
        )
      }
    },

    Image: {
      fields: {
        src: { type: "text" },
        alt: { type: "text" },
        caption: { type: "text" },
        size: {
          type: "select",
          options: [
            { label: "Petite", value: "small" },
            { label: "Moyenne", value: "medium" },
            { label: "Grande", value: "large" },
            { label: "Pleine largeur", value: "full" }
          ]
        }
      },
      defaultProps: {
        src: "https://via.placeholder.com/400x200/3498DB/ffffff?text=IMAGE",
        alt: "Image",
        caption: "",
        size: "medium"
      },
      render: ({ src, alt, caption, size }: any) => {
        const getImageStyle = () => {
          switch(size) {
            case 'small': return { width: '200px', height: '120px' };
            case 'medium': return { width: '400px', height: '200px' };
            case 'large': return { width: '600px', height: '300px' };
            case 'full': return { width: '100%', height: '300px' };
            default: return { width: '400px', height: '200px' };
          }
        };

        return (
          <div style={{ margin: '20px 0', textAlign: 'center' }}>
            <img 
              src={src} 
              alt={alt}
              style={{ 
                ...getImageStyle(),
                objectFit: 'cover',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
            {caption && (
              <p style={{ 
                fontSize: '14px', 
                color: '#666', 
                fontStyle: 'italic',
                marginTop: '8px'
              }}>
                {caption}
              </p>
            )}
          </div>
        )
      }
    },

    FlightDetailsBlock: {
      fields: {
        title: { type: "text" },
        body: { type: "textarea" },
        items: {
          type: "array",
          arrayFields: {
            label: { type: "text" },
            value: { type: "text" }
          }
        }
      },
      defaultProps: {
        title: "Vols & Transport Aérien",
        body: "Détails de vos vols",
        items: [
          { label: "Compagnie", value: "TUI" },
          { label: "Trajet aller", value: "BRU → ACE" }
        ]
      },
      render: ({ title, body, items }: any) => {
        console.log('🛩️ FlightDetailsBlock rendered with:', { title, body, items });
        return (
          <div style={{ margin: '30px 0', backgroundColor: '#F0F8FF', padding: '25px', borderRadius: '12px', border: '2px solid #3498DB' }}>
            <h3 style={{ color: '#2980B9', margin: '0 0 15px 0', fontSize: '22px', display: 'flex', alignItems: 'center' }}>
              ✈️ {title}
            </h3>
            <p style={{ color: '#34495E', lineHeight: '1.6', marginBottom: '20px' }}>{body}</p>
            {items && items.length > 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                {items.map((item: any, index: number) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    padding: '12px 20px',
                    borderBottom: index < items.length - 1 ? '1px solid #ECF0F1' : 'none'
                  }}>
                    <strong style={{ minWidth: '120px', color: '#2C3E50' }}>{item.label}:</strong>
                    <span style={{ color: '#5D6D7E' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      }
    },

    TransferBlock: {
      fields: {
        title: { type: "text" },
        body: { type: "textarea" }
      },
      defaultProps: {
        title: "Transferts & Transport Local",
        body: "Transferts privés inclus"
      },
      render: ({ title, body }: any) => {
        console.log('🚐 TransferBlock rendered with:', { title, body });
        return (
          <div style={{ margin: '30px 0', backgroundColor: '#F0FFF0', padding: '25px', borderRadius: '12px', border: '2px solid #27AE60' }}>
            <h3 style={{ color: '#27AE60', margin: '0 0 15px 0', fontSize: '22px', display: 'flex', alignItems: 'center' }}>
              🚐 {title}
            </h3>
            <p style={{ color: '#34495E', lineHeight: '1.6' }}>{body}</p>
          </div>
        )
      }
    },

    HotelBlock: {
      fields: {
        title: { type: "text" },
        body: { type: "textarea" },
        items: {
          type: "array",
          arrayFields: {
            label: { type: "text" },
            value: { type: "text" }
          }
        }
      },
      defaultProps: {
        title: "Hébergement",
        body: "Votre hôtel de rêve",
        items: [
          { label: "Hôtel", value: "Princesa Yaiza" },
          { label: "Chambre", value: "Suite Real" }
        ]
      },
      render: ({ title, body, items }: any) => {
        console.log('🏨 HotelBlock rendered with:', { title, body, items });
        return (
          <div style={{ margin: '30px 0', backgroundColor: '#FFF8DC', padding: '25px', borderRadius: '12px', border: '2px solid #F39C12' }}>
            <h3 style={{ color: '#E67E22', margin: '0 0 15px 0', fontSize: '22px', display: 'flex', alignItems: 'center' }}>
              🏨 {title}
            </h3>
            <p style={{ color: '#34495E', lineHeight: '1.6', marginBottom: '20px' }}>{body}</p>
            {items && items.length > 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                {items.map((item: any, index: number) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    padding: '12px 20px',
                    borderBottom: index < items.length - 1 ? '1px solid #ECF0F1' : 'none'
                  }}>
                    <strong style={{ minWidth: '120px', color: '#2C3E50' }}>{item.label}:</strong>
                    <span style={{ color: '#5D6D7E' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      }
    },

    PriceBlock: {
      fields: {
        title: { type: "text" },
        body: { type: "textarea" },
        items: {
          type: "array",
          arrayFields: {
            label: { type: "text" },
            value: { type: "text" }
          }
        }
      },
      defaultProps: {
        title: "Tarifs & Conditions",
        body: "Prix et conditions de votre voyage",
        items: [
          { label: "Prix total", value: "€ 28.865,00" },
          { label: "Validité", value: "Jusqu'à demain 13h00" }
        ]
      },
      render: ({ title, body, items }: any) => {
        console.log('💰 PriceBlock rendered with:', { title, body, items });
        return (
          <div style={{ margin: '30px 0', backgroundColor: '#F5F5F5', padding: '25px', borderRadius: '12px', border: '2px solid #95A5A6' }}>
            <h3 style={{ color: '#2C3E50', margin: '0 0 15px 0', fontSize: '22px', display: 'flex', alignItems: 'center' }}>
              💰 {title}
            </h3>
            <p style={{ color: '#34495E', lineHeight: '1.6', marginBottom: '20px' }}>{body}</p>
            {items && items.length > 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                {items.map((item: any, index: number) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    padding: '12px 20px',
                    borderBottom: index < items.length - 1 ? '1px solid #ECF0F1' : 'none',
                    backgroundColor: item.label.toLowerCase().includes('prix') ? '#E8F6F3' : 'white'
                  }}>
                    <strong style={{ minWidth: '120px', color: '#2C3E50' }}>{item.label}:</strong>
                    <span style={{ 
                      color: item.label.toLowerCase().includes('prix') ? '#27AE60' : '#5D6D7E',
                      fontWeight: item.label.toLowerCase().includes('prix') ? 'bold' : 'normal',
                      fontSize: item.label.toLowerCase().includes('prix') ? '18px' : '16px'
                    }}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      }
    },

    CallToAction: {
      fields: {
        title: { type: "text" },
        description: { type: "text" },
        buttonText: { type: "text" },
        backgroundColor: {
          type: "select",
          options: [
            { label: "Bleu", value: "#3498DB" },
            { label: "Vert", value: "#27AE60" },
            { label: "Rouge", value: "#E74C3C" },
            { label: "Orange", value: "#F39C12" },
            { label: "Violet", value: "#9B59B6" }
          ]
        }
      },
      defaultProps: {
        title: "Prêt à réserver ?",
        description: "Contactez-nous pour finaliser votre voyage",
        buttonText: "Réserver maintenant",
        backgroundColor: "#27AE60"
      },
      render: ({ title, description, buttonText, backgroundColor }: any) => {
        console.log('🎯 CallToAction rendered with:', { title, description, buttonText });
        return (
          <div style={{
            backgroundColor: backgroundColor,
            color: 'white',
            padding: '40px 30px',
            borderRadius: '12px',
            textAlign: 'center',
            margin: '30px 0',
            boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '28px' }}>{title}</h3>
            <p style={{ margin: '0 0 25px 0', fontSize: '16px', opacity: 0.9 }}>{description}</p>
            <button style={{
              backgroundColor: 'white',
              color: backgroundColor,
              border: 'none',
              padding: '18px 40px',
              borderRadius: '30px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s'
            }}>
              {buttonText}
            </button>
          </div>
        )
      }
    }
  }
};

// Données initiales avec un exemple de base
const initialData = {
  content: [
    {
      type: 'Title',
      props: {
        text: 'OFFRE COMMERCIALE',
        size: 'large',
        align: 'center'
      }
    },
    {
      type: 'Contact',
      props: {
        companyName: 'Invitation au Voyage',
        phone: '+33 1 23 45 67 89',
        email: 'contact@invitationauvoyage.fr'
      }
    },
    {
      type: 'Text',
      props: {
        text: 'Cher client, nous avons le plaisir de vous présenter notre offre personnalisée pour répondre à vos besoins spécifiques.'
      }
    }
  ],
  root: {}
};

interface OfferEditorProps {
  onSave?: (data: any) => void;
  onGeneratePDF?: (data: any) => void;
  prefilledData?: any;
}

// Algorithme d'injection strict pour éviter les doublons
const convertToPuckData = (offerStructure: any, companyInfo: any) => {
  const content = [];
  
  console.log('🔄 DEBUT CONVERSION - Structure reçue:', offerStructure);
  console.log('🔍 Sections disponibles:', offerStructure.sections);
  console.log('🎯 CTA disponible:', offerStructure.cta);
  
  if (offerStructure.sections) {
    console.table(offerStructure.sections.map((s: any) => ({id: s.id, type: s.type, title: s.title})));
  }
  
  // Validation des sections requises
  const requiredSections = ['flights', 'transfers', 'hotel', 'price'];
  const sectionIds = offerStructure.sections?.map((s: any) => s.id) || [];
  
  for (const requiredId of requiredSections) {
    if (!sectionIds.includes(requiredId)) {
      console.warn(`⚠️ Missing required section: ${requiredId}`);
    }
  }
  
  // Vérifier les IDs uniques
  const uniqueIds = new Set(sectionIds);
  if (uniqueIds.size !== sectionIds.length) {
    console.error('❌ Duplicate section IDs found, refusing injection');
    return { content: [], root: {} };
  }
  
  // === ALGORITHME D'INJECTION ===
  
  // 1. Hero (title, subtitle)
  if (offerStructure.title) {
    content.push({
      type: 'Title',
      props: {
        text: offerStructure.title,
        size: 'large',
        align: 'center'
      }
    });
  }
  
  if (companyInfo) {
    content.push({
      type: 'Contact',
      props: {
        companyName: companyInfo.name || 'Votre Entreprise',
        phone: companyInfo.phone || '+33 1 23 45 67 89',
        email: companyInfo.email || 'contact@entreprise.fr'
      }
    });
  }
  
  if (offerStructure.subtitle) {
    content.push({
      type: 'Title',
      props: {
        text: offerStructure.subtitle,
        size: 'medium',
        align: 'center'
      }
    });
  }
  
  // 2. Introduction
  if (offerStructure.introduction) {
    content.push({
      type: 'Text',
      props: {
        text: offerStructure.introduction
      }
    });
  }
  
  // 3. Sections.map(...) avec mapping tolérant
  console.log('🔍 Processing sections...', offerStructure.sections?.length || 0, 'sections found');
  
  if (offerStructure.sections && Array.isArray(offerStructure.sections)) {
    offerStructure.sections.forEach((section: any, index: number) => {
      console.log(`📋 Processing section ${index}:`, section);
      
      const key = normalizeType(section.type);
      const componentType = sectionTypeMapping[key];
      
      console.log(`🔑 Section type "${section.type}" → normalized: "${key}" → component: "${componentType}"`);

      if (!componentType) {
        console.warn(`⚠️ Skipped section because unknown type: ${section.type} (normalized: ${key})`);
        return;
      }
      if (!section.title) {
        console.error(`❌ Missing required field in section ${section.id || key}: title`);
        return;
      }

      const props: any = {
        title: section.title,
        body: section.body || ''
      };
      if (Array.isArray(section.items)) {
        props.items = section.items;
        console.log(`📊 Added ${section.items.length} items to section ${section.id}`);
      }

      console.log(`✅ Adding section component: ${componentType}`, props);
      
      // SOLUTION TEMPORAIRE : Utiliser seulement les composants de base
      // Au lieu des composants spécialisés, utilisons Title + Text
      content.push({ 
        type: 'Title', 
        props: {
          text: `${section.title}`,
          size: 'medium',
          align: 'left'
        }
      });
      
      content.push({ 
        type: 'Text', 
        props: {
          text: section.body || 'Contenu de la section'
        }
      });
      
      // Si il y a des items, les afficher comme texte
      if (Array.isArray(section.items) && section.items.length > 0) {
        const itemsText = section.items.map((item: any) => `${item.label}: ${item.value}`).join('\n');
        content.push({ 
          type: 'Text', 
          props: {
            text: itemsText
          }
        });
      }

      // image associée
      const sid = section.id || key;
      const sectionImage = (offerStructure.images || []).find((img: any) => {
        return (img.sectionId || '').toLowerCase() === String(sid).toLowerCase();
      });
      if (sectionImage) {
        console.log(`🖼️ Adding image for section ${sid}:`, sectionImage.url);
        content.push({
          type: 'Image',
          props: {
            src: sectionImage.url,
            alt: sectionImage.alt,
            caption: '',
            size: 'medium'
          }
        });
      }
    });
  } else {
    console.warn('❌ No sections array found in offerStructure');
  }
  
  // 4. Advantages
  if (offerStructure.advantages && offerStructure.advantages.length > 0) {
    content.push({
      type: 'Title',
      props: {
        text: 'Pourquoi nous choisir ?',
        size: 'medium',
        align: 'left'
      }
    });
    
    content.push({
      type: 'Text',
      props: {
        text: '• ' + offerStructure.advantages.join('\n• ')
      }
    });
  }
  
  // Images restantes (non associées à des sections)
  if (offerStructure.images) {
    const unassignedImages = offerStructure.images.filter((img: any) => !img.sectionId);
    unassignedImages.forEach((img: any) => {
      content.push({
        type: 'Image',
        props: {
          src: img.url,
          alt: img.alt,
          caption: '',
          size: 'medium'
        }
      });
    });
  }
  
  // Garde-fou anti-doublons CTA (imparable)
  // APRÈS avoir push tous les blocs (y compris CTA) :
  const firstCTAIndex = content.findIndex(c => c.type === 'CallToAction');
  if (firstCTAIndex !== -1) {
    // supprime tous les autres CTA
    for (let i = content.length - 1; i > firstCTAIndex; i--) {
      if (content[i].type === 'CallToAction') {
        console.warn('🗑️ Removing duplicate CTA at index', i);
        content.splice(i, 1);
      }
    }
    console.log('✅ CTA guard: kept only first CTA at index', firstCTAIndex);
  } else if (offerStructure.cta) {
    // s'il n'y en a aucun, on en ajoute un
    content.push({
      type: 'CallToAction',
      props: {
        title: offerStructure.cta.title,
        description: offerStructure.cta.description,
        buttonText: offerStructure.cta.buttonText,
        backgroundColor: '#27AE60'
      }
    });
    console.log('✅ CTA injected (was missing)');
  }
  
  console.log('✅ Injection terminée - Composants créés:', content.length);
  console.log('📋 Types de composants:', content.map(c => c.type));
  
  return {
    content,
    root: {}
  };
};

const OfferEditor: React.FC<OfferEditorProps> = ({ onSave, onGeneratePDF, prefilledData }) => {
  console.log('🎨 OfferEditor rendered with prefilledData:', !!prefilledData);
  
  const [data, setData] = useState(initialData);
  
  // Mettre à jour les données quand prefilledData change
  React.useEffect(() => {
    console.log('🔄 useEffect triggered - prefilledData:', prefilledData);
    
    if (prefilledData?.offer_structure) {
      console.log('✅ Converting offer structure to Puck data...');
      const newData = convertToPuckData(prefilledData.offer_structure, prefilledData.company_info);
      console.log('📦 Setting new data in Puck:');
      console.log('   📊 Content length:', newData.content?.length);
      console.log('   📋 Content types:', newData.content?.map((c: any) => c.type));
      console.log('   🔍 Full data:', newData);
      setData(newData);
    } else {
      console.log('⚠️ No offer structure in prefilledData');
    }
  }, [prefilledData]);

  const handleSave = () => {
    console.log('Données sauvegardées:', data);
    if (onSave) {
      onSave(data);
    }
  };

  const handleGeneratePDF = () => {
    console.log('Génération PDF:', data);
    if (onGeneratePDF) {
      onGeneratePDF(data);
    }
  };

  return (
    <PuckErrorBoundary>
      <div style={{ width: '100%', height: '100vh' }}>
        <Puck
          config={config}
          data={data}
          onPublish={(newData) => {
            console.log('📤 Puck data updated:', newData);
            setData(newData);
          }}
        />
        
        {/* Boutons flottants */}
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          display: 'flex',
          gap: '10px',
          zIndex: 1000
        }}>
          <button
            onClick={handleSave}
            style={{
              backgroundColor: '#3498DB',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            💾 Sauvegarder
          </button>
          <button
            onClick={handleGeneratePDF}
            style={{
              backgroundColor: '#E74C3C',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            📄 Générer PDF
          </button>
        </div>
      </div>
    </PuckErrorBoundary>
  );
};

export default OfferEditor;
