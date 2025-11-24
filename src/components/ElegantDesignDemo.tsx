import React from 'react';
import CraftJSEditor from './CraftJSEditor';

// Données de démonstration pour tester le design élégant
const elegantDemoData = {
  offer_structure: {
    title: "VOYAGE À BALI - DÉCOUVERTE D'UBUD",
    introduction: "Partez à la découverte de Bali, l'île des dieux, et laissez-vous envoûter par la magie d'Ubud, cœur culturel et spirituel de l'île.",
    sections: [
      {
        type: "Flights",
        title: "07 JUILLET - AÉROPORT DE DENPASAR - UBUD",
        body: "Accueil personnalisé à votre arrivée, avec colliers de fleurs. Transfert et installation à votre hôtel."
      },
      {
        type: "Hotel",
        title: "Installation à l'hôtel SRI RATIH COTTAGE",
        body: "Installation à l'hôtel SRI RATIH COTTAGE 3* sup., hôtel de charme à la décoration raffinée, avec piscine, restaurant et spa, situé dans un quartier agréable et à 15 min à pied du centre d'Ubud.\n\nNuit à l'hôtel SRI RATIH COTTAGE – Duplex suite 2bd"
      },
      {
        type: "Activities",
        title: "08 JUILLET - UBUD",
        body: "SÉJOUR LIBRE en chambre et petit-déjeuner pour profiter de votre hôtel et pour découvrir la capitale culturelle de l'île par vous-même : vous perdre dans les petites ruelles, arpenter la forêt des singes, découvrir les musées et galeries d'art, parcourir les boutiques d'artisanat...\n\nLes rizières sont aux portes de la ville, n'hésitez pas à vous y balader !"
      },
      {
        type: "Activities", 
        title: "09 JUILLET - UBUD (déjeuner)",
        body: "Le matin, départ pour une balade à VÉLO à travers les rizières et les villages. Une très belle promenade d'environ 2h30 qui vous permettra de plonger dans l'atmosphère balinaise. Le guide vous fera découvrir la vie quotidienne des Balinais, par plusieurs arrêts pendant le parcours.\n\nNote : prévoir de 5-6 ans selon jour niveau pour les plus jeunes, des sièges enfant sont disponibles."
      }
    ],
    cta: {
      title: "Réservez votre voyage de rêve",
      description: "Cette offre reste valable sous réserve des disponibilités au moment de la réservation définitive",
      buttonText: "Réserver maintenant"
    }
  },
  company_info: {
    name: "Invitation au Voyage",
    phone: "+32 2 774 04 04",
    email: "info@invit.be",
    address: "Av. Baron d'Huart, 7 - 1150 Woluwe St-Pierre"
  },
  assets: [
    {
      name: "Hotel Pool View",
      data_url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=240&fit=crop",
      width: 400,
      height: 240,
      size_kb: 85
    },
    {
      name: "Hotel Room",
      data_url: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=240&fit=crop",
      width: 400,
      height: 240,
      size_kb: 92
    },
    {
      name: "Hotel Restaurant",
      data_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=240&fit=crop",
      width: 400,
      height: 240,
      size_kb: 78
    }
  ]
};

// Les images sont gérées via le tableau assets
// @ts-ignore - Désactivé pour compatibilité avec différentes versions du type
if (elegantDemoData.offer_structure.sections[1]) {
  (elegantDemoData.offer_structure.sections[1] as any).images = [
    { index: 0, description: "Vue sur la piscine" },
    { index: 1, description: "Chambre duplex" },
    { index: 2, description: "Restaurant" }
  ];
}

const ElegantDesignDemo: React.FC = () => {
  const handleSave = (data: any) => {
    console.log('Design élégant sauvegardé:', data);
  };

  return (
    <div style={{ height: '100vh' }}>
      <div style={{
        background: '#2c3e50',
        color: 'white',
        padding: '10px 20px',
        textAlign: 'center',
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        🎨 Démonstration du Design Élégant - Style "Invitation au Voyage"
      </div>
      
      <CraftJSEditor
        onSave={handleSave}
        prefilledData={elegantDemoData}
        apiBaseUrl="http://127.0.0.1:8003/api"
      />
    </div>
  );
};

export default ElegantDesignDemo;
