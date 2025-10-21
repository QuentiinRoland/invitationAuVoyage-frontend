import React, { useEffect, useRef, useState } from 'react';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import { API_BASE_URL } from '../config/api';
import { api } from '../api/client';

interface GrapesJSEditorProps {
  onSave?: (data: any) => void;
  prefilledData?: any;
  apiBaseUrl?: string;
  documentId?: number; // ID du document à charger
}

// VOTRE IMAGE IMGUR EN BACKGROUND ⬇️⬇️⬇️
// Note: Pour Imgur, il faut utiliser le lien direct .png/.jpg, pas le lien de galerie
const DEFAULT_BG_URL = 'https://i.imgur.com/ZgV341i.jpeg';

// OU si vous voulez l'uploader dans l'interface, laissez vide et utilisez le champ "Background"
// const DEFAULT_BG_URL = '';

const GrapesJSEditor: React.FC<GrapesJSEditorProps> = ({ 
  onSave, 
  prefilledData, 
  apiBaseUrl = API_BASE_URL,
  documentId
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const grapesRef = useRef<any>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showDesignPanel, setShowDesignPanel] = useState(false);
  const [logoUrl, setLogoUrl] = useState('https://via.placeholder.com/150x50/3498db/ffffff.png?text=LOGO');
  const [primaryColor, setPrimaryColor] = useState('#3498db');
  const [backgroundImage, setBackgroundImage] = useState('');

  // Images de fond prédéfinies pour les voyages
  const predefinedBackgrounds = [
    { name: 'Aucune', url: '' },
    { name: '✨ Template 1', url: 'https://i.imgur.com/ZgV341i.jpeg' },
    { name: '🎯 Ma Image 2', url: 'VOTRE_URL_IMGUR_2' },
  ];
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Invitation au Voyage',
    phone: '+33 1 23 45 67 89',
    email: 'contact@invitationauvoyage.fr'
  });
  const [backgroundUrl, setBackgroundUrl] = useState(DEFAULT_BG_URL);
  const [currentOfferStructure, setCurrentOfferStructure] = useState<any>(null);

  // Helper pour appliquer le background par défaut
  const applyDefaultBackground = (editor: any, bgUrl: string) => {
    const wrapper = editor.DomComponents.getWrapper();
    // On fusionne le style du wrapper (root de la page)
    wrapper.addStyle({
      'min-height': '100vh',
      'background-image': `url("${bgUrl}")`,
      'background-size': '800px 297mm', // Taille fixe pour format A4 (297mm de hauteur)
      'background-position': 'start top', // En haut à gauche de chaque page
      'background-repeat': 'repeat-y', // Répéter verticalement avec espacement
      'background-attachment': 'local' // Local pour répéter sur chaque page
    });
  };

  // Helper pour s'assurer que le brand-header existe
  const ensureBrandHeader = (editor: any) => {
    const wrapper = editor.DomComponents.getWrapper();
    // cherche un composant existant brand-header
    const exists = wrapper.find('.brand-header').length > 0;
    if (!exists) {
      wrapper.append({ type: 'brand-header' });
    }
  };

  // Charger un document existant
  const loadDocument = async (docId: number) => {
    setIsLoading(true);
    try {
      const response = await api.get(`api/documents/${docId}/`);
      const documentData = response.data;
      console.log('📄 Document chargé:', documentData);
      
      // Mettre à jour les états
      setCurrentOfferStructure(documentData.offer_structure);
      setCompanyInfo(documentData.company_info || companyInfo);
      
      // Charger le contenu dans GrapesJS
      if (grapesRef.current && documentData.grapes_html) {
        const editor = grapesRef.current;
        editor.setComponents(documentData.grapes_html);
        editor.setStyle(documentData.grapes_css || '');
        
        // Appliquer le background par défaut
        applyDefaultBackground(editor, backgroundUrl);
      }
      
      // Si c'est une structure d'offre, la charger
      if (documentData.offer_structure) {
        loadOfferData(documentData);
      }
      
    } catch (error: any) {
      console.error('Erreur chargement document:', error);
      alert(`❌ Erreur chargement: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialiser le state avec les données pré-remplies
  useEffect(() => {
    if (prefilledData?.offer_structure) {
      setCurrentOfferStructure(prefilledData.offer_structure);
    }
  }, [prefilledData]);

  // Charger un document si documentId est fourni
  useEffect(() => {
    if (documentId && grapesRef.current) {
      loadDocument(documentId);
    }
  }, [documentId]);

  useEffect(() => {
    if (!editorRef.current) return;

    const editor = grapesjs.init({
      container: editorRef.current,
      height: '100vh',
      storageManager: false,
      
      // Configuration pour permettre l'édition
      canvas: {
        styles: [
          'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css'
        ]
      },
      
      // Panels configuration simplifiée
      panels: {
        defaults: []
      },
      
      // Device Manager
      deviceManager: {
        devices: [
          {
            name: 'Desktop',
            width: '',
          },
          {
            name: 'Mobile',
            width: '320px',
            widthMedia: '480px',
          }
        ]
      },
      
      // Rich Text Editor
      richTextEditor: {
        actions: ['bold', 'italic', 'underline', 'strikethrough', 'link'],
      },
      
      // Asset Manager
      assetManager: {
        embedAsBase64: true,
        assets: [],
        upload: false,
        autoAdd: true,
      },
      
      // Configuration simplifiée pour éviter les erreurs
      showOffsets: true,
      noticeOnUnload: false,
      showDevices: false
    });

    grapesRef.current = editor;

    editor.on('load', () => {
      setupTravelComponents(editor);
      applyDefaultBackground(editor, DEFAULT_BG_URL);
      ensureBrandHeader(editor);

      if (prefilledData?.offer_structure) {
        loadOfferData(prefilledData);
      }
    });

    return () => {
      if (grapesRef.current) {
        grapesRef.current.destroy();
      }
    };
  }, [prefilledData]);

  const setupTravelComponents = (editor: any) => {
    const domc = editor.DomComponents;
    const blockManager = editor.BlockManager;

    // Composant Section Vols
    domc.addType('flight-section', {
      model: {
        defaults: {
          tagName: 'div',
          droppable: true,
          attributes: { class: 'flight-section' },
          components: [
            {
              tagName: 'div',
              attributes: { class: 'section-header' },
              components: [{ tagName: 'h3', content: '✈️ Vols & Transport Aérien' }]
            },
            {
              tagName: 'div',
              attributes: { class: 'section-content' },
              components: [{ 
                tagName: 'p', 
                content: 'Détails des vols : compagnie, trajets, dates/horaires, classe de service' 
              }]
            }
          ],
          styles: `
            .flight-section {
              background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
              border: none;
              border-radius: 16px;
              padding: 30px;
              margin: 25px 0;
              box-shadow: 0 8px 32px rgba(52, 152, 219, 0.12), 0 4px 16px rgba(52, 152, 219, 0.08);
              position: relative;
              overflow: hidden;
            }
            .flight-section::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 4px;
              height: 100%;
              background: linear-gradient(180deg, #3498db 0%, #2980b9 100%);
            }
            .section-header h3 {
              color: #2c3e50;
              margin: 0 0 20px 0;
              font-size: 24px;
              font-weight: 700;
              border-bottom: 2px solid #3498db;
              padding-bottom: 12px;
              position: relative;
            }
            .section-header h3::after {
              content: '';
              position: absolute;
              bottom: -2px;
              left: 0;
              width: 30px;
              height: 2px;
              background: #3498db;
            }
            .section-content {
              color: #2c3e50;
              line-height: 1.7;
              font-size: 16px;
              font-weight: 400;
            }
            .section-content p {
              margin-bottom: 12px;
            }
            .section-content ul {
              margin: 15px 0;
              padding-left: 20px;
            }
            .section-content li {
              margin-bottom: 8px;
              position: relative;
            }
            .section-content li::before {
              content: '•';
              color: #3498db;
              font-weight: bold;
              position: absolute;
              left: -15px;
            }
            .section-image {
              margin: 20px 0;
              text-align: center;
            }
            .section-image img {
              max-width: 100%;
              height: auto;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              transition: transform 0.3s ease;
            }
            .section-image img:hover {
              transform: scale(1.02);
            }
            .image-credit {
              text-align: center;
              margin-top: 8px;
              margin-bottom: 15px;
              color: #666;
              font-size: 12px;
              font-style: italic;
            }
          `,
        },
      },
    });

    // Composant Section Hôtel
    domc.addType('hotel-section', {
      model: {
        defaults: {
          tagName: 'div',
          droppable: true,
          attributes: { class: 'hotel-section' },
          components: [
            {
              tagName: 'div',
              attributes: { class: 'section-header' },
              components: [{ tagName: 'h3', content: '🏨 Hébergement' }]
            },
            {
              tagName: 'div',
              attributes: { class: 'section-content' },
              components: [{ 
                tagName: 'p', 
                content: 'Détails de l\'hébergement : nom, type de chambre, pension, dates' 
              }]
            }
          ],
          styles: `
            .hotel-section {
              background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
              border: none;
              border-radius: 16px;
              padding: 30px;
              margin: 25px 0;
              box-shadow: 0 8px 32px rgba(231, 76, 60, 0.12), 0 4px 16px rgba(231, 76, 60, 0.08);
              position: relative;
              overflow: hidden;
            }
            .hotel-section::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 4px;
              height: 100%;
              background: linear-gradient(180deg, #e74c3c 0%, #c0392b 100%);
            }
            .hotel-section .section-header h3 {
              color: #2c3e50;
              margin: 0 0 20px 0;
              font-size: 24px;
              font-weight: 700;
              border-bottom: 2px solid #e74c3c;
              padding-bottom: 12px;
              position: relative;
            }
            .hotel-section .section-header h3::after {
              content: '';
              position: absolute;
              bottom: -2px;
              left: 0;
              width: 30px;
              height: 2px;
              background: #e74c3c;
            }
            .hotel-section .section-content {
              color: #2c3e50;
              line-height: 1.7;
              font-size: 16px;
              font-weight: 400;
            }
            .hotel-section .section-content li::before {
              color: #e74c3c;
            }
            .hotel-section .section-image {
              margin: 20px 0;
              text-align: center;
            }
            .hotel-section .section-image img {
              max-width: 100%;
              height: auto;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              transition: transform 0.3s ease;
            }
            .hotel-section .section-image img:hover {
              transform: scale(1.02);
            }
            .hotel-section .image-credit {
              text-align: center;
              margin-top: 8px;
              margin-bottom: 15px;
              color: #666;
              font-size: 12px;
              font-style: italic;
            }
          `,
        },
      },
    });

    // Composant Section Prix
    domc.addType('price-section', {
      model: {
        defaults: {
          tagName: 'div',
          droppable: true,
          attributes: { class: 'price-section' },
          components: [
            {
              tagName: 'div',
              attributes: { class: 'section-header' },
              components: [{ tagName: 'h3', content: '💰 Tarifs & Conditions' }]
            },
            {
              tagName: 'div',
              attributes: { class: 'section-content' },
              components: [{ 
                tagName: 'p', 
                content: 'Prix total et conditions de réservation' 
              }]
            }
          ],
          styles: `
            .price-section {
              background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
              border: none;
              border-radius: 16px;
              padding: 30px;
              margin: 25px 0;
              box-shadow: 0 8px 32px rgba(39, 174, 96, 0.12), 0 4px 16px rgba(39, 174, 96, 0.08);
              position: relative;
              overflow: hidden;
            }
            .price-section::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 4px;
              height: 100%;
              background: linear-gradient(180deg, #27ae60 0%, #229954 100%);
            }
            .price-section .section-header h3 {
              color: #2c3e50;
              margin: 0 0 20px 0;
              font-size: 24px;
              font-weight: 700;
              border-bottom: 2px solid #27ae60;
              padding-bottom: 12px;
              position: relative;
            }
            .price-section .section-header h3::after {
              content: '';
              position: absolute;
              bottom: -2px;
              left: 0;
              width: 30px;
              height: 2px;
              background: #27ae60;
            }
            .price-section .section-content {
              color: #2c3e50;
              line-height: 1.7;
              font-size: 16px;
              font-weight: 400;
            }
            .price-section .section-content li::before {
              color: #27ae60;
            }
            .price-section .section-image {
              margin: 20px 0;
              text-align: center;
            }
            .price-section .section-image img {
              max-width: 100%;
              height: auto;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              transition: transform 0.3s ease;
            }
            .price-section .section-image img:hover {
              transform: scale(1.02);
            }
            .price-section .image-credit {
              text-align: center;
              margin-top: 8px;
              margin-bottom: 15px;
              color: #666;
              font-size: 12px;
              font-style: italic;
            }
          `,
        },
      },
    });

    // Composant Section Transferts
    domc.addType('transfers-section', {
      model: {
        defaults: {
          tagName: 'div',
          droppable: true,
          attributes: { class: 'transfers-section' },
          components: [
            {
              tagName: 'div',
              attributes: { class: 'section-header' },
              components: [{ tagName: 'h3', content: '🚗 Transferts & Transport' }]
            },
            {
              tagName: 'div',
              attributes: { class: 'section-content' },
              components: [{ 
                tagName: 'p', 
                content: 'Détails des transferts et transport local' 
              }]
            }
          ],
          styles: `
            .transfers-section {
              background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
              border: none;
              border-radius: 16px;
              padding: 30px;
              margin: 25px 0;
              box-shadow: 0 8px 32px rgba(243, 156, 18, 0.12), 0 4px 16px rgba(243, 156, 18, 0.08);
              position: relative;
              overflow: hidden;
            }
            .transfers-section::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 4px;
              height: 100%;
              background: linear-gradient(180deg, #f39c12 0%, #e67e22 100%);
            }
            .transfers-section .section-header h3 {
              color: #2c3e50;
              margin: 0 0 20px 0;
              font-size: 24px;
              font-weight: 700;
              border-bottom: 2px solid #f39c12;
              padding-bottom: 12px;
              position: relative;
            }
            .transfers-section .section-header h3::after {
              content: '';
              position: absolute;
              bottom: -2px;
              left: 0;
              width: 30px;
              height: 2px;
              background: #f39c12;
            }
            .transfers-section .section-content {
              color: #2c3e50;
              line-height: 1.7;
              font-size: 16px;
              font-weight: 400;
            }
            .transfers-section .section-content li::before {
              color: #f39c12;
            }
            .transfers-section .section-image {
              margin: 20px 0;
              text-align: center;
            }
            .transfers-section .section-image img {
              max-width: 100%;
              height: auto;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              transition: transform 0.3s ease;
            }
            .transfers-section .section-image img:hover {
              transform: scale(1.02);
            }
            .transfers-section .image-credit {
              text-align: center;
              margin-top: 8px;
              margin-bottom: 15px;
              color: #666;
              font-size: 12px;
              font-style: italic;
            }
          `,
        },
      },
    });

    // Composant Section Activités
    domc.addType('activities-section', {
      model: {
        defaults: {
          tagName: 'div',
          droppable: true,
          attributes: { class: 'activities-section' },
          components: [
            {
              tagName: 'div',
              attributes: { class: 'section-header' },
              components: [{ tagName: 'h3', content: '🎯 Activités & Excursions' }]
            },
            {
              tagName: 'div',
              attributes: { class: 'section-content' },
              components: [{ 
                tagName: 'p', 
                content: 'Programme détaillé des activités et excursions' 
              }]
            }
          ],
          styles: `
            .activities-section {
              background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
              border: none;
              border-radius: 16px;
              padding: 30px;
              margin: 25px 0;
              box-shadow: 0 8px 32px rgba(155, 89, 182, 0.12), 0 4px 16px rgba(155, 89, 182, 0.08);
              position: relative;
              overflow: hidden;
            }
            .activities-section::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 4px;
              height: 100%;
              background: linear-gradient(180deg, #9b59b6 0%, #8e44ad 100%);
            }
            .activities-section .section-header h3 {
              color: #2c3e50;
              margin: 0 0 20px 0;
              font-size: 24px;
              font-weight: 700;
              border-bottom: 2px solid #9b59b6;
              padding-bottom: 12px;
              position: relative;
            }
            .activities-section .section-header h3::after {
              content: '';
              position: absolute;
              bottom: -2px;
              left: 0;
              width: 30px;
              height: 2px;
              background: #9b59b6;
            }
            .activities-section .section-content {
              color: #2c3e50;
              line-height: 1.7;
              font-size: 16px;
              font-weight: 400;
            }
            .activities-section .section-content li::before {
              color: #9b59b6;
            }
            .activities-section .section-image {
              margin: 20px 0;
              text-align: center;
            }
            .activities-section .section-image img {
              max-width: 100%;
              height: auto;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              transition: transform 0.3s ease;
            }
            .activities-section .section-image img:hover {
              transform: scale(1.02);
            }
            .activities-section .image-credit {
              text-align: center;
              margin-top: 8px;
              margin-bottom: 15px;
              color: #666;
              font-size: 12px;
              font-style: italic;
            }
          `,
        },
      },
    });

    // Composant CTA
    domc.addType('cta-section', {
      model: {
        defaults: {
          tagName: 'div',
          droppable: true,
          attributes: { class: 'cta-section' },
          components: [
            {
              tagName: 'div',
              attributes: { class: 'cta-content' },
              components: [
                { tagName: 'h3', content: '🎯 Réservez maintenant !' },
                { tagName: 'p', content: 'Ne manquez pas cette opportunité unique' },
                { 
                  tagName: 'button', 
                  attributes: { class: 'cta-button' },
                  content: 'Réserver maintenant'
                }
              ]
            }
          ],
          styles: `
            .cta-section {
              background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
              color: white;
              border-radius: 15px;
              padding: 40px;
              margin: 40px 0;
              text-align: center;
              box-shadow: 0 8px 25px rgba(52, 152, 219, 0.3);
            }
            .cta-content h3 {
              margin: 0 0 15px 0;
              font-size: 28px;
              font-weight: bold;
            }
            .cta-content p {
              margin: 0 0 30px 0;
              font-size: 18px;
              opacity: 0.95;
            }
            .cta-button {
              background: white;
              color: #3498db;
              border: none;
              padding: 18px 40px;
              border-radius: 30px;
              font-size: 18px;
              font-weight: bold;
              cursor: pointer;
              box-shadow: 0 4px 15px rgba(0,0,0,0.2);
              transition: all 0.3s ease;
            }
          `,
        },
      },
    });

    // Header avec Logo
    domc.addType('header-with-logo', {
      model: {
        defaults: {
          tagName: 'div',
          droppable: true,
          attributes: { class: 'offer-header' },
          components: [
            {
              tagName: 'img',
              attributes: { 
                src: logoUrl,
                alt: 'Logo Company',
                class: 'company-logo',
                style: 'max-width: 150px; margin-bottom: 20px; border-radius: 8px;'
              }
            },
            {
              tagName: 'h1',
              content: 'OFFRE DE VOYAGE EXCEPTIONNELLE',
              style: { 
                'margin': '0 0 10px 0', 
                'font-size': '32px',
                'text-shadow': '0 2px 4px rgba(0,0,0,0.3)'
              }
            },
            {
              tagName: 'p',
              content: 'Découvrez nos destinations de rêve',
              style: { 
                'margin': '0',
                'font-size': '18px',
                'opacity': '0.9'
              }
            }
          ],
          styles: `
            .offer-header {
              text-align: center;
              padding: 40px 20px;
              background: linear-gradient(135deg, #3498db 0%, #2c3e50 100%);
              color: white;
              border-radius: 12px;
              margin-bottom: 30px;
            }
            .company-logo {
              max-width: 150px;
              height: auto;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }
          `,
        },
      },
    });

    // Ajouter les blocs
    blockManager.add('flight-section', {
      label: '✈️ Section Vols',
      category: 'Voyage',
      content: { type: 'flight-section' },
    });

    blockManager.add('hotel-section', {
      label: '🏨 Section Hôtel',
      category: 'Voyage',
      content: { type: 'hotel-section' },
    });

    blockManager.add('price-section', {
      label: '💰 Section Prix',
      category: 'Voyage',
      content: { type: 'price-section' },
    });

    blockManager.add('transfers-section', {
      label: '🚗 Section Transferts',
      category: 'Voyage',
      content: { type: 'transfers-section' },
    });

    blockManager.add('activities-section', {
      label: '🎯 Section Activités',
      category: 'Voyage',
      content: { type: 'activities-section' },
    });

    blockManager.add('cta-section', {
      label: '🎯 Call to Action',
      category: 'Voyage',
      content: { type: 'cta-section' },
    });

    blockManager.add('header-with-logo', {
      label: '🏢 Header avec Logo',
      category: 'Voyage',
      content: { type: 'header-with-logo' },
    });
  };

  const textToHtml = (txt?: string) => {
    if (!txt) return '';
    // Mini-parser : paragraphes + listes
    // - Sépare sur les lignes
    const lines = txt.split('\n').map(l => l.trim());
    const items: string[] = [];
    let inList = false;

    for (const line of lines) {
      if (!line) { items.push('<br/>'); continue; }
      // puces style markdown
      if (/^[-*•]\s+/.test(line)) {
        if (!inList) { items.push('<ul>'); inList = true; }
        items.push(`<li>${line.replace(/^[-*•]\s+/, '')}</li>`);
      } else {
        if (inList) { items.push('</ul>'); inList = false; }
        items.push(`<p>${line}</p>`);
      }
    }
    if (inList) items.push('</ul>');
    return items.join('');
  };

  const loadOfferData = (offerData: any) => {
    if (!grapesRef.current) return;
    const editor = grapesRef.current;
    const wrapper = editor.DomComponents.getWrapper();

    console.log('🎯 loadOfferData appelé avec:', offerData);
    
    // Extraire offer_structure et assets
    const offer = offerData.offer_structure || offerData;
    const assets = offerData.assets || [];
    
    // Sauvegarder la structure d'offre actuelle pour l'amélioration IA
    setCurrentOfferStructure(offer);
    
    // Ajouter les images importées à l'AssetManager si elles existent
    if (assets && assets.length > 0) {
      console.log('🖼️ Ajout des images importées à l\'AssetManager:', assets.length);
      console.log('🖼️ Détails des images:', assets.map((a: any) => ({
        name: a.name,
        size: a.size_kb + 'KB',
        dimensions: `${a.width}x${a.height}`
      })));
      const assetManager = editor.AssetManager;
      assets.forEach((asset: any, index: number) => {
        console.log(`🖼️ Ajout image ${index + 1}:`, asset.name);
        assetManager.add(asset.data_url);
      });
    } else {
      console.log('ℹ️ Aucune image à ajouter à l\'AssetManager');
    }
    
    // Vérifier si des images sont présentes
    const hasImages = offer?.sections?.some((s: any) => s.images && s.images.length > 0);
    if (hasImages) {
      console.log('🖼️ Images détectées dans les sections');
    } else {
      console.log('ℹ️ Aucune image dans les sections (APIs non configurées ou erreur)');
    }

    // (Optionnel) Vider le contenu SANS perdre le style du wrapper
    // wrapper.empty();

    const toAppend: any[] = [];

    // 1) Juste le titre modifiable (sans section bleue)
    if (offer?.title) {
      toAppend.push({
        tagName: 'h1',
        content: offer.title,
        type: 'text',
        editable: true,
        attributes: { 
          class: 'main-title',
          'data-gjs-type': 'text',
          'contenteditable': 'true'
        },
        style: { 
          'margin': '30px 0 40px 0', 
          'font-size': '28px', 
          'text-align': 'center', 
          'color': '#2c3e50',
          'font-weight': 'normal',
          'font-family': 'Georgia, serif',
          'letter-spacing': '1px',
          'text-transform': 'uppercase'
        },
      });
    }

    // 2) Introduction
    if (offer?.introduction) {
      toAppend.push({
        tagName: 'div',
        attributes: { class: 'introduction' },
        components: [{
          tagName: 'div',
          content: textToHtml(offer.introduction),
        }],
        style: {
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          padding: '30px',
          'border-radius': '16px',
          margin: '30px 0',
          'font-size': '18px',
          'line-height': '1.8',
          'font-weight': '400',
          'color': '#2c3e50',
          'box-shadow': '0 8px 32px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
          'border': 'none',
          'position': 'relative',
          'overflow': 'hidden',
        },
      });
    }

    // 3) Sections
    const iconFor = (type: string) =>
      type === 'Flights' ? '✈️' :
      type === 'Hotel'   ? '🏨' :
      type === 'Price'   ? '💰' :
      type === 'Transfers' ? '🚗' :
      type === 'Activities' ? '🎯' : '📌';

    const classFor = (type: string) =>
      type === 'Flights' ? 'flight-section' :
      type === 'Hotel'   ? 'hotel-section'  :
      type === 'Price'   ? 'price-section'  :
      type === 'Transfers' ? 'transfers-section' :
      type === 'Activities' ? 'activities-section' : 'generic-section';

    if (Array.isArray(offer?.sections)) {
      offer.sections.forEach((s: any) => {
        const cls = classFor(s?.type || '');
        const icon = iconFor(s?.type || '');
        const title = s?.title || (s?.type || 'Section');
        const body = textToHtml(s?.body || '');

        const comps: any[] = [
          {
            tagName: 'div',
            attributes: { class: 'section-header' },
            components: [{ 
              tagName: 'h3', 
              content: title, // Sans icône, juste le titre
              type: 'text',
              editable: true,
              style: {
                'background': 'linear-gradient(90deg, #F5E6A8 0%, #E8D78F 100%)',
                'padding': '8px 15px',
                'margin': '0 0 20px 0',
                'font-size': '16px',
                'font-weight': 'bold',
                'color': '#2C3E50',
                'border-radius': '0',
                'display': 'inline-block',
                'font-family': 'Georgia, serif'
              },
              attributes: {
                'data-gjs-type': 'text',
                'contenteditable': 'true'
              }
            }],
          },
        ];

        // Ajouter le contenu textuel avec style élégant
        comps.push({
          tagName: 'div',
          attributes: { class: 'section-content' },
          components: [{ 
            tagName: 'div', 
            content: body,
            type: 'text',
            editable: true,
            droppable: true,
            style: {
              'font-family': 'Georgia, serif',
              'font-size': '14px',
              'line-height': '1.6',
              'color': '#2C3E50',
              'text-align': 'justify',
              'margin': '0'
            },
            attributes: {
              'data-gjs-type': 'text',
              'contenteditable': 'true'
            }
          }],
        });

        // Puis ajouter les images associées à cette section (après le texte)
        if (Array.isArray(s.images) && s.images.length > 0 && assets) {
          console.log(`🖼️ Section "${title}" a ${s.images.length} image(s) associée(s)`);
          s.images.forEach((imgRef: any) => {
            const asset = assets[imgRef.index];
            if (asset) {
              console.log(`🖼️ Ajout image ${asset.name} à la section ${title}`);
              comps.push({
                tagName: 'div',
                attributes: { class: 'section-image' },
                style: {
                  'margin': '20px 0',
                  'text-align': 'center'
                },
                components: [
                  {
                    tagName: 'img',
                    attributes: { 
                      src: asset.data_url, 
                      alt: imgRef.description || asset.name,
                      style: 'max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);'
                    }
                  },
                  {
                    tagName: 'p',
                    content: imgRef.description || asset.name,
                    style: {
                      'margin-top': '10px',
                      'font-size': '14px',
                      'color': '#666',
                      'font-style': 'italic'
                    }
                  }
                ]
              });
            }
          });
        }

        toAppend.push({
          tagName: 'div',
          attributes: { 
            class: cls,
            'data-gjs-type': 'default'
          },
          components: comps,
          selectable: true,
          hoverable: true,
          editable: false,
          droppable: true,
           style: {
             'background': 'none', // Aucun fond
             'border': 'none',
             'padding': '20px 0',
             'margin': '25px 0',
             'box-shadow': 'none', // Aucune ombre
             'position': 'relative'
           },
        });
      });
    }

    // 4) CTA
    if (offer?.cta) {
      toAppend.push({
        tagName: 'div',
        attributes: { class: 'cta-section' },
        components: [
          { tagName: 'h3', content: offer.cta.title || '🎯 Réservez maintenant !' },
          { tagName: 'p', content: offer.cta.description || 'Ne manquez pas cette opportunité.' },
          {
            tagName: 'a',
            attributes: { class: 'cta-button', href: '#', target: '_blank' },
            content: offer.cta.buttonText || 'Réserver',
          },
        ],
        style: {
          'background': 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
          'color': 'white',
          'border-radius': '20px',
          'padding': '40px',
          'margin': '40px 0',
          'text-align': 'center',
          'box-shadow': '0 12px 40px rgba(52, 152, 219, 0.3), 0 6px 20px rgba(52, 152, 219, 0.2)',
          'position': 'relative',
          'overflow': 'hidden',
        },
      });
    }

    // 5) Les images sont maintenant intégrées directement dans chaque section
    console.log('🖼️ Images intégrées dans les sections individuelles');

    // 6) Injecter sans écraser le header/background existants
    console.log('📦 Composants à injecter:', toAppend.length);
    toAppend.forEach(c => wrapper.append(c));
    console.log('✅ Contenu injecté dans GrapesJS');
  };

  // Génération PDF avec design GrapesJS
  const generatePDF = async () => {
    if (!grapesRef.current) {
      alert('Éditeur non initialisé');
      return;
    }

    setIsLoading(true);
    
    try {
      const editor = grapesRef.current;
      const html = editor.getHtml();
      const css = editor.getCss();

      console.log('Génération PDF avec design GrapesJS...');

      const fullHTML = `
        <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          ${html}
        </div>
      `;

      const fullCSS = `
        body {
          margin: 0;
          padding: 20px;
          font-family: 'Arial', 'Helvetica', sans-serif;
          line-height: 1.6;
          color: #333;
          background: white;
          background-image: url("${DEFAULT_BG_URL}");
          background-size: 800px 26.7cm;
          background-repeat: space;
          background-position: start top;
          background-attachment: local;
        }
        
        @media print {
          body { 
            margin: 0; 
            padding: 15px; 
            background-image: url("${DEFAULT_BG_URL}") !important;
            background-size: 700px 26.7cm !important;
            background-repeat: space !important;
            background-position: center top !important;
            background-attachment: local !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .no-print { display: none !important; }
        }
        
        @page {
          margin: 2cm;
          size: A4;
          background-image: url("${DEFAULT_BG_URL}");
          background-size: 700px 23.7cm;
          background-repeat: space;
          background-position: start top;
        }
        
        ${css}
        
        /* Sections complètement transparentes - juste le texte */
        .flight-section, .hotel-section, .price-section, .transfers-section, .activities-section {
          page-break-inside: avoid;
          margin-bottom: 20px !important;
          background: none !important; /* Aucun fond */
          border: none !important; /* Aucune bordure */
          box-shadow: none !important; /* Aucune ombre */
        }
        
        /* Titres jaunes avec surlignage */
        .section-header h3 {
          background: linear-gradient(90deg, #F5E6A8 0%, #E8D78F 100%) !important;
          padding: 8px 15px !important;
          margin: 0 0 20px 0 !important;
          font-size: 16px !important;
          font-weight: bold !important;
          color: #2C3E50 !important;
          border-radius: 0 !important;
          display: inline-block !important;
          font-family: Georgia, serif !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        /* Style du contenu */
        .section-content {
          font-family: Georgia, serif !important;
          font-size: 14px !important;
          line-height: 1.6 !important;
          color: #2C3E50 !important;
          text-align: justify !important;
        }
        
        /* Titre principal */
        .main-title {
          font-family: Georgia, serif !important;
          font-size: 28px !important;
          text-align: center !important;
          color: #2c3e50 !important;
          font-weight: normal !important;
          letter-spacing: 1px !important;
          text-transform: uppercase !important;
          margin: 30px 0 40px 0 !important;
        }
        
        .cta-section {
          background: none !important; /* Aucun fond non plus */
          border: none !important;
          color: #2c3e50 !important;
        }
        
        .cta-button {
          background: #3498db !important;
          color: white !important;
        }
        
        img {
          max-width: 100% !important;
          height: auto !important;
        }
        
        h1, h2, h3 {
          page-break-after: avoid;
        }
      `;

      const response = await api.post('api/grapesjs-pdf-generator/', {
        html: fullHTML,
        css: fullCSS,
        company_info: companyInfo
      }, {
        responseType: 'blob'
      });

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `offre-voyage-design-${Date.now()}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);

      alert('✅ PDF généré avec votre design GrapesJS !');

    } catch (error: any) {
      console.error('Erreur génération PDF:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Mise à jour des logos dans le design
  const updateLogosInDesign = () => {
    if (!grapesRef.current) return;

    const editor = grapesRef.current;
    const wrapper = editor.DomComponents.getWrapper();
    
    const updateLogosRecursive = (component: any) => {
      if (component.get('tagName') === 'img') {
        const attributes = component.get('attributes') || {};
        const src = attributes.src || '';
        
        if (src.includes('logo') || src.includes('LOGO') || 
            attributes.alt?.toLowerCase().includes('logo') ||
            attributes.class?.includes('logo') ||
            attributes.class?.includes('company-logo')) {
          
          component.set('attributes', {
            ...attributes,
            src: logoUrl
          });
        }
      }
      
      const components = component.components();
      if (components) {
        components.each((child: any) => updateLogosRecursive(child));
      }
    };

    updateLogosRecursive(wrapper);
    editor.refresh();
  };

  // Application du design
  const applyDesign = () => {
    if (!grapesRef.current) return;
    
    const editor = grapesRef.current;
    
    updateLogosInDesign();
    
    // Appliquer le background
    applyDefaultBackground(editor, backgroundUrl);
    
    editor.CssComposer.addRules(`
      :root { --primary-color: ${primaryColor}; }
      .flight-section { border-color: ${primaryColor} !important; }
      .cta-section { background: linear-gradient(135deg, ${primaryColor} 0%, #2c3e50 100%) !important; }
      .offer-header, .brand-header.offer-header {
        background: linear-gradient(135deg, ${primaryColor} 0%, #2c3e50 100%) !important;
      }
    `);
    
    editor.refresh();
  };

  // Fonction pour appliquer le background image personnalisé (même format que default_bg)
  const applyBackgroundImage = (imageUrl: string) => {
    if (!grapesRef.current) return;
    
    const editor = grapesRef.current;
    const wrapper = editor.DomComponents.getWrapper();
    
    if (imageUrl) {
      // Appliquer l'image de fond avec les MÊMES paramètres que applyDefaultBackground
      wrapper.addStyle({
        'min-height': '100vh',
        'background-image': `url("${imageUrl}")`,
        'background-size': '800px 297mm', // Même taille fixe pour format A4
        'background-position': 'start top', // Même position qu'applyDefaultBackground
        'background-repeat': 'repeat-y', // Même répétition verticale
        'background-attachment': 'local' // Même attachement pour répéter sur chaque page
      });
    } else {
      // Supprimer l'image de fond et revenir au background par défaut
      wrapper.removeStyle(['background-image']);
      // Remettre le background par défaut
      applyDefaultBackground(editor, backgroundUrl);
    }
    
    editor.refresh();
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoUrl(result);
        
        setTimeout(() => {
          updateLogosInDesign();
        }, 100);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setBackgroundUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBackgroundUrl(event.target.value);
  };

  const handleBackgroundImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setBackgroundImage(result);
        applyBackgroundImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundImageUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setBackgroundImage(url);
    applyBackgroundImage(url);
  };

  const generateCompleteOffer = async (travelRequest: string) => {
    setIsLoading(true);
    
    try {
      const response = await api.post('api/generate-pdf-offer/', {
        text: travelRequest,
        company_info: companyInfo
      }, {
        responseType: 'blob'
      });

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `offre-complete-${Date.now()}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);

      alert('✅ Offre complète générée !');

    } catch (error: any) {
      console.error('Erreur:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    console.log('🔥 handleSave appelé !');
    
    if (!grapesRef.current) {
      console.error('❌ Éditeur non initialisé');
      alert('Éditeur non initialisé');
      return;
    }
    
    console.log('✅ Éditeur initialisé, début sauvegarde...');

    const html = grapesRef.current.getHtml();
    const css = grapesRef.current.getCss();
    
    console.log('📝 HTML et CSS récupérés');
    
    // Utiliser des valeurs par défaut simples pour éviter les prompts
    const title = currentOfferStructure?.title || `Document ${new Date().toLocaleTimeString('fr-FR')}`;
    const folderId = undefined; // Sauvegarder à la racine par défaut
    
    console.log('📂 Titre:', title, 'Dossier:', folderId || 'racine');

    setIsLoading(true);
    
    try {
      const saveData = {
        title: title,
        description: `Document créé le ${new Date().toLocaleDateString('fr-FR')}`,
        document_type: 'grapesjs_project',
        grapes_html: html,
        grapes_css: css,
        offer_structure: currentOfferStructure,
        company_info: companyInfo,
        assets: prefilledData?.assets || [],
        folder_id: folderId
      };

      console.log('💾 Données à sauvegarder:', {
        title: saveData.title,
        folder_id: saveData.folder_id,
        html_length: saveData.grapes_html.length,
        css_length: saveData.grapes_css.length
      });
      
      console.log('📡 Envoi vers API...');
      const response = await api.post('api/documents/', saveData);
      const result = response.data;
      
      console.log('✅ Réponse API:', result);
      
      alert(`✅ Document "${title}" sauvegardé avec succès ! (ID: ${result.id})`);
      
      // Appeler le callback original si fourni
      if (onSave) {
        onSave({ html, css, companyInfo, documentId: result.id });
      }

    } catch (error: any) {
      console.error('❌ Erreur sauvegarde:', error);
      alert(`❌ Erreur sauvegarde: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsLoading(false);
      console.log('🏁 Fin de sauvegarde');
    }
  };


  // Améliorer avec IA
  const improveWithAI = async (mode: 'premium'|'concis'|'vendeur'|'familial'|'luxe'='premium') => {
    if (!grapesRef.current) return;
    setIsLoading(true);
    try {
      // Utiliser la structure d'offre actuelle stockée dans le state
      const current = currentOfferStructure;
      if (!current) throw new Error("Structure inexistante. (Importe un PDF ou génère une offre d'abord)");

      const res = await api.post('api/improve-offer/', { 
        offer_structure: current, 
        mode 
      });
      const data = res.data;

      if (data.offer_structure) {
        loadOfferData(data.offer_structure);
        setTimeout(() => applyDesign(), 50);
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
      <div style={{ 
        backgroundColor: '#2c3e50', 
        color: 'white', 
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>
          🍇 GrapesJS - Générateur d'Offres
        </h3>
        
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
              Génération...
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
            onClick={handleSave}
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
            onClick={generatePDF}
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
      </div>

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
              Logo:
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
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
              Couleur:
            </label>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                border: '1px solid #bdc3c7',
                borderRadius: '4px',
                cursor: 'pointer'
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
              onChange={handleBackgroundUrlChange}
              placeholder="URL de l'image de fond"
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
              Background (Fichier):
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleBackgroundChange}
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
              🖼️ Image de fond document:
            </label>
            <select
              value={backgroundImage}
              onChange={(e) => {
                const url = e.target.value;
                setBackgroundImage(url);
                applyBackgroundImage(url);
              }}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #bdc3c7',
                borderRadius: '4px',
                marginBottom: '5px'
              }}
            >
              {predefinedBackgrounds.map((bg, index) => (
                <option key={index} value={bg.url}>
                  {bg.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={backgroundImage}
              onChange={handleBackgroundImageUrlChange}
              placeholder="URL de l'image de fond"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #bdc3c7',
                borderRadius: '4px',
                marginBottom: '5px'
              }}
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleBackgroundImageUpload}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #bdc3c7',
                borderRadius: '4px'
              }}
            />
            {backgroundImage && (
              <button
                onClick={() => {
                  setBackgroundImage('');
                  applyBackgroundImage('');
                }}
                style={{
                  marginTop: '5px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ❌ Supprimer
              </button>
            )}
          </div>

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
            <button
              onClick={applyDesign}
              disabled={isLoading}
              style={{
                backgroundColor: '#9b59b6',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                width: '100%',
                opacity: isLoading ? 0.6 : 1
              }}
            > 
              ✨ Appliquer
            </button>
          </div>

          <div>
            <button
              onClick={() => {
                const request = prompt('Décrivez votre voyage:');
                if (request) {
                  generateCompleteOffer(request);
                }
              }}
              disabled={isLoading}
              style={{
                backgroundColor: '#f39c12',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                width: '100%',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              🚀 Offre Complète
            </button>
          </div>
        </div>
      )}

      <div ref={editorRef} style={{ flex: 1 }} />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GrapesJSEditor;