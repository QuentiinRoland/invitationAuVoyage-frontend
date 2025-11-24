import React, { useState, useEffect, useRef } from 'react';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';
import { Layers } from '@craftjs/layers';
import { API_BASE_URL } from '../config/api';
import { api } from '../api/client';

// Import des composants Craft.js
import { EditableText } from './craft/EditableText';
import { Container } from './craft/Container';
import { TravelSection } from './craft/TravelSection';
import { EditableImage } from './craft/EditableImage';
import { textToHtml, getSectionIcon, getSectionTitle } from './craft/utils';

interface CraftJSEditorProps {
  onSave?: (data: any) => void;
  prefilledData?: any;
  apiBaseUrl?: string;
  documentId?: number;
}

const DEFAULT_BG_URL = 'https://i.imgur.com/ZgV341i.jpeg';

// Panneau d'outils
const Toolbox = () => {
  const { connectors } = useEditor();

  return (
    <div style={{
      width: '280px',
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRight: '1px solid #dee2e6',
      overflowY: 'auto',
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px', fontWeight: 'bold' }}>
        📦 Composants
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          ref={(ref) => {
            if (ref) {
              connectors.create(ref, <EditableText text="Nouveau texte" fontSize={16} />);
            }
          }}
          style={{
            padding: '12px',
            backgroundColor: '#ffffff',
            border: '2px solid #dee2e6',
            borderRadius: '8px',
            cursor: 'move',
            fontWeight: 'bold',
            fontSize: '14px',
            textAlign: 'left',
          }}
        >
          📝 Texte
        </button>

        <button
          ref={(ref) => {
            if (ref) {
              connectors.create(
                ref,
                <Element is={Container} canvas padding="20px" background="transparent">
                  <EditableText text="Contenu du container" />
                </Element>
              );
            }
          }}
          style={{
            padding: '12px',
            backgroundColor: '#ffffff',
            border: '2px solid #dee2e6',
            borderRadius: '8px',
            cursor: 'move',
            fontWeight: 'bold',
            fontSize: '14px',
            textAlign: 'left',
          }}
        >
          📦 Container
        </button>

        <button
          ref={(ref) => {
            if (ref) {
              connectors.create(
                ref,
                <Element is={TravelSection} canvas title="Vols & Transport" icon="✈️">
                  <EditableText text="Détails des vols et transport..." fontSize={14} />
                </Element>
              );
            }
          }}
          style={{
            padding: '12px',
            backgroundColor: '#ffffff',
            border: '2px solid #dee2e6',
            borderRadius: '8px',
            cursor: 'move',
            fontWeight: 'bold',
            fontSize: '14px',
            textAlign: 'left',
          }}
        >
          ✈️ Section Vols
        </button>

        <button
          ref={(ref) => {
            if (ref) {
              connectors.create(
                ref,
                <Element is={TravelSection} canvas title="Hébergement" icon="🏨">
                  <EditableText text="Détails de l'hébergement..." fontSize={14} />
                </Element>
              );
            }
          }}
          style={{
            padding: '12px',
            backgroundColor: '#ffffff',
            border: '2px solid #dee2e6',
            borderRadius: '8px',
            cursor: 'move',
            fontWeight: 'bold',
            fontSize: '14px',
            textAlign: 'left',
          }}
        >
          🏨 Section Hôtel
        </button>

        <button
          ref={(ref) => {
            if (ref) {
              connectors.create(
                ref,
                <Element is={TravelSection} canvas title="Tarifs & Conditions" icon="💰">
                  <EditableText text="Prix et conditions..." fontSize={14} />
                </Element>
              );
            }
          }}
          style={{
            padding: '12px',
            backgroundColor: '#ffffff',
            border: '2px solid #dee2e6',
            borderRadius: '8px',
            cursor: 'move',
            fontWeight: 'bold',
            fontSize: '14px',
            textAlign: 'left',
          }}
        >
          💰 Section Prix
        </button>

        <button
          ref={(ref) => {
            if (ref) {
              connectors.create(
                ref,
                <EditableImage 
                  src="https://via.placeholder.com/600x400" 
                  alt="Image de voyage" 
                />
              );
            }
          }}
          style={{
            padding: '12px',
            backgroundColor: '#ffffff',
            border: '2px solid #dee2e6',
            borderRadius: '8px',
            cursor: 'move',
            fontWeight: 'bold',
            fontSize: '14px',
            textAlign: 'left',
          }}
        >
          🖼️ Image
        </button>
      </div>

      <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #dee2e6' }}>
        <h4 style={{ marginTop: 0, marginBottom: '10px', fontSize: '14px' }}>💡 Instructions</h4>
        <p style={{ fontSize: '12px', lineHeight: '1.5', color: '#6c757d', margin: 0 }}>
          • Glissez-déposez les composants dans la zone d'édition<br/>
          • Cliquez sur un élément pour le modifier<br/>
          • Double-cliquez sur un texte pour l'éditer directement
        </p>
      </div>
    </div>
  );
};

// Panneau de paramètres
const SettingsPanel = () => {
  const { selected, actions } = useEditor((state, query) => {
    const currentNodeId = state.events.selected.values().next().value;
    
    return {
      selected: currentNodeId ? {
        id: currentNodeId,
        name: state.nodes[currentNodeId]?.data.displayName || state.nodes[currentNodeId]?.data.name,
        settings: state.nodes[currentNodeId]?.related?.toolbar,
      } : null,
    };
  });

  return (
    <div style={{
      width: '280px',
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderLeft: '1px solid #dee2e6',
      overflowY: 'auto',
    }}>
      {selected ? (
        <>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px', fontWeight: 'bold' }}>
            ⚙️ Paramètres
          </h3>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '15px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
              {selected.name}
            </div>
            {selected.settings && React.createElement(selected.settings)}
          </div>
          <button
            onClick={() => {
              if (window.confirm('Supprimer cet élément ?')) {
                actions.delete(selected.id);
              }
            }}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            🗑️ Supprimer
          </button>
        </>
      ) : (
        <div style={{ textAlign: 'center', color: '#6c757d', marginTop: '40px' }}>
          <p style={{ fontSize: '14px' }}>
            Sélectionnez un élément pour voir ses paramètres
          </p>
        </div>
      )}
    </div>
  );
};

const CraftJSEditor: React.FC<CraftJSEditorProps> = ({ 
  onSave, 
  prefilledData, 
  apiBaseUrl = API_BASE_URL,
  documentId
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDesignPanel, setShowDesignPanel] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState(DEFAULT_BG_URL);
  const [currentOfferStructure, setCurrentOfferStructure] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Invitation au Voyage',
    phone: '+33 1 23 45 67 89',
    email: 'contact@invitationauvoyage.fr'
  });
  const editorActionsRef = useRef<any>(null);

  // Charger un document existant
  const loadDocument = async (docId: number) => {
    setIsLoading(true);
    try {
      const response = await api.get(`api/documents/${docId}/`);
      const documentData = response.data;
      console.log('📄 Document chargé:', documentData);
      
      setCurrentOfferStructure(documentData.offer_structure);
      setCompanyInfo(documentData.company_info || companyInfo);
      
      // TODO: Charger le state Craft.js depuis documentData.craft_state
      
    } catch (error: any) {
      console.error('Erreur chargement document:', error);
      alert(`❌ Erreur chargement: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialiser avec les données pré-remplies
  useEffect(() => {
    if (prefilledData?.offer_structure) {
      setCurrentOfferStructure(prefilledData.offer_structure);
      
      // Charger les données dans l'éditeur après un délai pour s'assurer que l'éditeur est initialisé
      setTimeout(() => {
        if (editorActionsRef.current) {
          loadOfferIntoEditor(prefilledData);
        }
      }, 500);
    }
  }, [prefilledData]);

  // Charger un document si documentId est fourni
  useEffect(() => {
    if (documentId) {
      loadDocument(documentId);
    }
  }, [documentId]);

  // Fonction pour charger une offre dans l'éditeur
  const loadOfferIntoEditor = (offerData: any) => {
    if (!editorActionsRef.current) {
      console.warn('⚠️ Editor actions not ready yet');
      return;
    }

    const offer = offerData.offer_structure || offerData;
    const assets = offerData.assets || [];

    console.log('📥 Chargement de l\'offre dans Craft.js:', {
      title: offer?.title,
      sections: offer?.sections?.length,
      assets: assets.length
    });

    // Note: Le chargement programmatique nécessiterait de générer
    // dynamiquement l'état JSON de Craft.js
    // Pour l'instant, l'utilisateur peut utiliser le drag-and-drop
    console.log('✅ Données de l\'offre disponibles pour l\'édition');
  };

  // Sauvegarder le document
  const handleSave = async (editorQuery: any) => {
    console.log('🔥 handleSave appelé !');
    
    setIsLoading(true);
    
    try {
      const json = editorQuery.serialize();
      
      const title = currentOfferStructure?.title || `Document ${new Date().toLocaleTimeString('fr-FR')}`;
      
      const saveData = {
        title: title,
        description: `Document créé le ${new Date().toLocaleDateString('fr-FR')}`,
        document_type: 'craftjs_project',
        craft_state: json,
        offer_structure: currentOfferStructure,
        company_info: companyInfo,
        assets: prefilledData?.assets || [],
      };

      console.log('💾 Données à sauvegarder:', {
        title: saveData.title,
        craft_state_length: JSON.stringify(json).length,
      });
      
      const response = await api.post('api/documents/', saveData);
      const result = response.data;
      
      console.log('✅ Réponse API:', result);
      
      alert(`✅ Document "${title}" sauvegardé avec succès ! (ID: ${result.id})`);
      
      if (onSave) {
        onSave({ craft_state: json, companyInfo, documentId: result.id });
      }

    } catch (error: any) {
      console.error('❌ Erreur sauvegarde:', error);
      alert(`❌ Erreur sauvegarde: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Générer PDF
  const generatePDF = async (editorQuery: any) => {
    setIsLoading(true);
    
    try {
      // Récupérer le HTML rendu depuis Craft.js
      const nodes = editorQuery.getSerializedNodes();
      
      // Construire le HTML depuis les nodes
      let html = '<div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Georgia, serif;">';
      
      // TODO: Convertir les nodes Craft.js en HTML propre pour le PDF
      html += JSON.stringify(nodes, null, 2); // Temporaire
      html += '</div>';

      const css = `
        body {
          margin: 0;
          padding: 20px;
          font-family: 'Georgia', 'serif';
          line-height: 1.6;
          color: #2c3e50;
          background: white;
          background-image: url("${backgroundUrl}");
          background-size: 800px 26.7cm;
          background-repeat: space;
          background-position: start top;
        }
        
        @page {
          margin: 2cm;
          size: A4;
        }
      `;

      const response = await api.post('api/grapesjs-pdf-generator/', {
        html,
        css,
        company_info: companyInfo
      }, {
        responseType: 'blob'
      });

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `offre-voyage-${Date.now()}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);

      alert('✅ PDF généré avec succès !');

    } catch (error: any) {
      console.error('Erreur génération PDF:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Améliorer avec IA
  const improveWithAI = async (mode: 'premium'|'concis'|'vendeur'|'familial'|'luxe'='premium') => {
    setIsLoading(true);
    try {
      const current = currentOfferStructure;
      if (!current) throw new Error("Structure inexistante. (Importe un PDF ou génère une offre d'abord)");

      const res = await api.post('api/improve-offer/', { 
        offer_structure: current, 
        mode 
      });
      const data = res.data;

      if (data.offer_structure) {
        setCurrentOfferStructure(data.offer_structure);
        // TODO: Mettre à jour le contenu dans l'éditeur Craft.js
      }
      alert('✨ Texte amélioré !');
    } catch (e:any) {
      alert(`❌ Erreur amélioration: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Barre d'outils supérieure */}
      <div style={{ 
        backgroundColor: '#2c3e50', 
        color: 'white', 
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 1000,
      }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>
          ⚡ Craft.js - Générateur d'Offres
        </h3>
        
        <Editor
          resolver={{
            EditableText,
            Container,
            TravelSection,
            EditableImage,
          }}
        >
          <EditorControls
            isLoading={isLoading}
            showDesignPanel={showDesignPanel}
            setShowDesignPanel={setShowDesignPanel}
            handleSave={handleSave}
            generatePDF={generatePDF}
            improveWithAI={improveWithAI}
            editorActionsRef={editorActionsRef}
          />
        </Editor>
      </div>

      {/* Panneau de configuration */}
      {showDesignPanel && (
        <div style={{
          backgroundColor: '#ecf0f1',
          padding: '20px',
          borderBottom: '1px solid #bdc3c7',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
              Entreprise:
            </label>
            <input
              type="text"
              value={companyInfo.name}
              onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #bdc3c7',
                borderRadius: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
              Background (URL):
            </label>
            <input
              type="text"
              value={backgroundUrl}
              onChange={(e) => setBackgroundUrl(e.target.value)}
              placeholder="URL de l'image de fond"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #bdc3c7',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>
      )}

      {/* Zone d'édition */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Editor
          resolver={{
            EditableText,
            Container,
            TravelSection,
            EditableImage,
          }}
        >
          <Toolbox />
          
          <div style={{ 
            flex: 1, 
            overflow: 'auto', 
            backgroundColor: '#ffffff',
            backgroundImage: `url("${backgroundUrl}")`,
            backgroundSize: '800px 297mm',
            backgroundPosition: 'center top',
            backgroundRepeat: 'repeat-y',
          }}>
            <Frame>
              <Element 
                is={Container} 
                canvas 
                padding="40px"
                background="transparent"
              >
                <EditableText 
                  text="Titre de votre offre de voyage" 
                  fontSize={28}
                  fontWeight="normal"
                  textAlign="center"
                  margin="30px 0 40px 0"
                />
                <EditableText 
                  text="Introduction de votre offre... Double-cliquez pour éditer !" 
                  fontSize={16}
                  fontWeight="normal"
                  textAlign="justify"
                  margin="20px 0"
                />
              </Element>
            </Frame>
          </div>
          
          <SettingsPanel />
        </Editor>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Composant pour les contrôles d'édition
const EditorControls: React.FC<any> = ({ 
  isLoading, 
  showDesignPanel, 
  setShowDesignPanel,
  handleSave,
  generatePDF,
  improveWithAI,
  editorActionsRef
}) => {
  const { query, actions } = useEditor();
  
  // Stocker les actions dans la ref pour y accéder depuis le parent
  useEffect(() => {
    if (editorActionsRef) {
      editorActionsRef.current = actions;
    }
  }, [actions, editorActionsRef]);

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      {isLoading && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          background: '#f39c12',
          padding: '6px 12px',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            border: '2px solid white',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Chargement...
        </div>
      )}
      
      <button
        onClick={() => setShowDesignPanel(!showDesignPanel)}
        disabled={isLoading}
        style={{
          backgroundColor: '#9b59b6',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          opacity: isLoading ? 0.6 : 1
        }}
      >
        🎨 Configuration
      </button>

      <button
        onClick={() => improveWithAI('premium')}
        disabled={isLoading}
        style={{
          backgroundColor: '#16a085',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          opacity: isLoading ? 0.6 : 1
        }}
      >
        🤖 Améliorer (IA)
      </button>
      
      <button
        onClick={() => handleSave(query)}
        disabled={isLoading}
        style={{
          backgroundColor: '#27ae60',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          opacity: isLoading ? 0.6 : 1
        }}
      >
        💾 Sauvegarder
      </button>
      
      <button
        onClick={() => generatePDF(query)}
        disabled={isLoading}
        style={{
          backgroundColor: '#e74c3c',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          opacity: isLoading ? 0.6 : 1
        }}
      >
        📄 Générer PDF
      </button>
    </div>
  );
};

export default CraftJSEditor;

