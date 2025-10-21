import React, { useState } from 'react';

interface SimpleOfferEditorProps {
  onSave?: (data: any) => void;
  onGeneratePDF?: (data: any) => void;
  prefilledData?: any;
}

// Version simple sans Puck pour tester
const SimpleOfferEditor: React.FC<SimpleOfferEditorProps> = ({ onSave, onGeneratePDF, prefilledData }) => {
  const [title, setTitle] = useState('OFFRE COMMERCIALE');
  const [company, setCompany] = useState('Invitation au Voyage');
  const [content, setContent] = useState('Cher client, nous avons le plaisir de vous présenter notre offre personnalisée.');
  
  // Si on a des données pré-remplies, les utiliser
  React.useEffect(() => {
    if (prefilledData?.offer_structure) {
      console.log('🎨 SimpleOfferEditor - Données reçues:', prefilledData);
      setTitle(prefilledData.offer_structure.title || 'OFFRE COMMERCIALE');
      setCompany(prefilledData.company_info?.name || 'Invitation au Voyage');
      
      // Créer un contenu structuré à partir des sections
      const sectionsText = prefilledData.offer_structure.sections?.map((section: any) => {
        let sectionText = `\n\n## ${section.title}\n${section.body || ''}`;
        if (section.items && Array.isArray(section.items)) {
          sectionText += '\n' + section.items.map((item: any) => `- ${item.label}: ${item.value}`).join('\n');
        }
        return sectionText;
      }).join('\n') || '';
      
      const fullContent = `${prefilledData.offer_structure.introduction || ''}${sectionsText}`;
      setContent(fullContent);
    }
  }, [prefilledData]);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Panneau d'édition */}
      <div style={{ 
        width: '300px', 
        backgroundColor: '#F8F9FA', 
        padding: '20px',
        borderRight: '1px solid #E0E0E0',
        overflow: 'auto'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#2C3E50' }}>✏️ Éditeur Simple</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Titre :
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #DDD',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Entreprise :
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #DDD',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Contenu :
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '8px',
              border: '1px solid #DDD',
              borderRadius: '4px',
              resize: 'vertical'
            }}
          />
        </div>

        <button
          onClick={() => onSave && onSave({ title, company, content })}
          style={{
            width: '100%',
            backgroundColor: '#27AE60',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginBottom: '10px'
          }}
        >
          💾 Sauvegarder
        </button>
        
        <button
          onClick={() => onGeneratePDF && onGeneratePDF({ title, company, content })}
          style={{
            width: '100%',
            backgroundColor: '#3498DB',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          📄 Générer PDF
        </button>
      </div>

      {/* Aperçu */}
      <div style={{ 
        flex: 1, 
        padding: '40px',
        backgroundColor: 'white',
        overflow: 'auto'
      }}>
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          backgroundColor: 'white',
          padding: '40px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          borderRadius: '8px'
        }}>
          {/* Titre */}
          <h1 style={{ 
            textAlign: 'center', 
            color: '#2C3E50', 
            marginBottom: '30px',
            fontSize: '28px'
          }}>
            {title}
          </h1>

          {/* Informations entreprise */}
          <div style={{ 
            textAlign: 'right',
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#F8F9FA',
            borderRadius: '8px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#2C3E50' }}>{company}</h4>
            <div style={{ fontSize: '14px', color: '#666' }}>
              <div>📞 +33 1 23 45 67 89</div>
              <div>✉️ contact@invitationauvoyage.fr</div>
            </div>
          </div>

          {/* Contenu */}
          <div style={{ 
            lineHeight: '1.8',
            fontSize: '16px',
            color: '#333',
            marginBottom: '30px'
          }}>
            {content.split('\n').map((paragraph, index) => {
              if (paragraph.startsWith('## ')) {
                // Titre de section
                return (
                  <h3 key={index} style={{ 
                    color: '#2C3E50', 
                    marginTop: '30px', 
                    marginBottom: '15px',
                    fontSize: '20px',
                    borderBottom: '2px solid #3498DB',
                    paddingBottom: '8px'
                  }}>
                    {paragraph.replace('## ', '')}
                  </h3>
                );
              } else if (paragraph.startsWith('- ')) {
                // Item de liste
                return (
                  <div key={index} style={{ 
                    marginLeft: '20px', 
                    marginBottom: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#F8F9FA',
                    borderRadius: '4px',
                    borderLeft: '3px solid #3498DB'
                  }}>
                    {paragraph.replace('- ', '')}
                  </div>
                );
              } else if (paragraph.trim() === '') {
                // Ligne vide
                return <div key={index} style={{ height: '10px' }} />;
              } else {
                // Paragraphe normal
                return (
                  <p key={index} style={{ marginBottom: '15px' }}>
                    {paragraph}
                  </p>
                );
              }
            })}
          </div>

          {/* Call to action */}
          <div style={{
            backgroundColor: '#3498DB',
            color: 'white',
            padding: '25px',
            borderRadius: '8px',
            textAlign: 'center',
            marginTop: '40px'
          }}>
            <p style={{ margin: '0 0 15px 0', fontSize: '18px' }}>
              Contactez-nous pour discuter de votre projet !
            </p>
            <button style={{
              backgroundColor: 'white',
              color: '#3498DB',
              border: 'none',
              padding: '12px 25px',
              borderRadius: '25px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              Nous contacter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleOfferEditor;
