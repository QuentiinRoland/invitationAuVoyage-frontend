import React, { useState } from 'react';
import { api } from '../api/client';

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

const PDFReformatter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [instructions, setInstructions] = useState('Reformate ce document de manière professionnelle en améliorant la présentation et en ajoutant les informations de l\'entreprise');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: 'Invitation au Voyage',
    address: '123 Rue de l\'Innovation, 75001 Paris',
    phone: '+33 1 23 45 67 89',
    email: 'contact@invitationauvoyage.fr',
    website: 'www.invitationauvoyage.fr'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Veuillez sélectionner un fichier PDF.');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleReformatPDF = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier PDF.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('instructions', instructions);
      formData.append('company_info', JSON.stringify(companyInfo));

      const response = await api.post('api/pdf-to-gjs/', formData, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Créer un lien de téléchargement pour le PDF reformaté
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name.replace('.pdf', '')}_reformate.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err: any) {
      setError(err.detail || 'Erreur lors du reformatage du PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ 
        backgroundColor: '#2C3E50', 
        color: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0 0 10px 0' }}>🔄 Reformateur de PDF</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Améliorez vos documents PDF avec l'IA et ajoutez votre identité d'entreprise
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* Formulaire de upload */}
        <div style={{ backgroundColor: '#F8F9FA', padding: '25px', borderRadius: '8px' }}>
          <h3 style={{ color: '#2C3E50', marginBottom: '20px' }}>📁 Document à reformater</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Sélectionnez votre PDF :
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px dashed #BDC3C7',
                borderRadius: '6px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            />
            {file && (
              <div style={{ 
                marginTop: '10px', 
                padding: '10px', 
                backgroundColor: '#D5DBDB', 
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Instructions de reformatage :
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ex: Améliore la mise en page, corrige les erreurs, ajoute un en-tête professionnel..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                border: '1px solid #DDD',
                borderRadius: '6px',
                fontSize: '14px',
                lineHeight: '1.5',
                resize: 'vertical'
              }}
            />
          </div>

          <h4 style={{ color: '#2C3E50', marginBottom: '15px' }}>🏢 Informations de l'entreprise</h4>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <input
              type="text"
              value={companyInfo.name}
              onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
              placeholder="Nom de l'entreprise"
              style={{ padding: '10px', border: '1px solid #DDD', borderRadius: '4px' }}
            />
            <input
              type="text"
              value={companyInfo.address}
              onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})}
              placeholder="Adresse"
              style={{ padding: '10px', border: '1px solid #DDD', borderRadius: '4px' }}
            />
            <input
              type="text"
              value={companyInfo.phone}
              onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})}
              placeholder="Téléphone"
              style={{ padding: '10px', border: '1px solid #DDD', borderRadius: '4px' }}
            />
            <input
              type="email"
              value={companyInfo.email}
              onChange={(e) => setCompanyInfo({...companyInfo, email: e.target.value})}
              placeholder="Email"
              style={{ padding: '10px', border: '1px solid #DDD', borderRadius: '4px' }}
            />
            <input
              type="text"
              value={companyInfo.website}
              onChange={(e) => setCompanyInfo({...companyInfo, website: e.target.value})}
              placeholder="Site web"
              style={{ padding: '10px', border: '1px solid #DDD', borderRadius: '4px' }}
            />
          </div>

          <button
            onClick={handleReformatPDF}
            disabled={loading || !file}
            style={{
              width: '100%',
              backgroundColor: loading || !file ? '#BDC3C7' : '#E74C3C',
              color: 'white',
              border: 'none',
              padding: '15px',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading || !file ? 'not-allowed' : 'pointer',
              marginTop: '20px'
            }}
          >
            {loading ? '⏳ Reformatage en cours...' : '🔄 Reformater le PDF'}
          </button>
        </div>

        {/* Informations et aperçu */}
        <div style={{ backgroundColor: 'white', border: '1px solid #E0E0E0', borderRadius: '8px' }}>
          <div style={{ 
            backgroundColor: '#ECF0F1', 
            padding: '15px', 
            borderRadius: '8px 8px 0 0',
            borderBottom: '1px solid #E0E0E0'
          }}>
            <h3 style={{ margin: 0, color: '#2C3E50' }}>ℹ️ Comment ça marche ?</h3>
          </div>
          
          <div style={{ padding: '20px' }}>
            {error && (
              <div style={{
                backgroundColor: '#FADBD8',
                color: '#C0392B',
                padding: '15px',
                borderRadius: '6px',
                marginBottom: '15px',
                border: '1px solid #F1948A'
              }}>
                ⚠️ {error}
              </div>
            )}
            
            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ color: '#2C3E50', marginBottom: '10px' }}>🎯 Fonctionnalités</h4>
              <ul style={{ paddingLeft: '20px', lineHeight: '1.6', color: '#5D6D7E' }}>
                <li>Amélioration automatique de la mise en page</li>
                <li>Correction des erreurs de formatage</li>
                <li>Ajout d'un en-tête professionnel</li>
                <li>Intégration des informations d'entreprise</li>
                <li>Optimisation de la lisibilité</li>
                <li>Standardisation du style</li>
              </ul>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ color: '#2C3E50', marginBottom: '10px' }}>📋 Étapes</h4>
              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  padding: '10px',
                  backgroundColor: file ? '#D5EDDA' : '#F8F9FA',
                  borderRadius: '4px',
                  border: file ? '1px solid #C3E6CB' : '1px solid #E9ECEF'
                }}>
                  <span style={{ marginRight: '10px' }}>
                    {file ? '✅' : '1️⃣'}
                  </span>
                  <span style={{ fontSize: '14px' }}>
                    Sélectionner votre PDF
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  padding: '10px',
                  backgroundColor: '#F8F9FA',
                  borderRadius: '4px',
                  border: '1px solid #E9ECEF'
                }}>
                  <span style={{ marginRight: '10px' }}>2️⃣</span>
                  <span style={{ fontSize: '14px' }}>
                    Personnaliser les instructions
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  padding: '10px',
                  backgroundColor: '#F8F9FA',
                  borderRadius: '4px',
                  border: '1px solid #E9ECEF'
                }}>
                  <span style={{ marginRight: '10px' }}>3️⃣</span>
                  <span style={{ fontSize: '14px' }}>
                    Lancer le reformatage
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  padding: '10px',
                  backgroundColor: '#F8F9FA',
                  borderRadius: '4px',
                  border: '1px solid #E9ECEF'
                }}>
                  <span style={{ marginRight: '10px' }}>4️⃣</span>
                  <span style={{ fontSize: '14px' }}>
                    Télécharger le résultat
                  </span>
                </div>
              </div>
            </div>

            <div style={{ 
              backgroundColor: '#FFF3CD',
              border: '1px solid #FFEAA7',
              borderRadius: '6px',
              padding: '15px'
            }}>
              <h5 style={{ color: '#856404', margin: '0 0 10px 0' }}>💡 Conseil</h5>
              <p style={{ 
                margin: 0, 
                fontSize: '14px', 
                color: '#856404',
                lineHeight: '1.5'
              }}>
                Plus vos instructions sont précises, meilleur sera le résultat. 
                N'hésitez pas à mentionner le style souhaité, les éléments à améliorer, 
                ou les modifications spécifiques à apporter.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFReformatter;
