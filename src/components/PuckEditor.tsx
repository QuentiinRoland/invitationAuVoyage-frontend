import React, { useState, useRef, useEffect } from 'react';
import { Puck, Data, Config, usePuck } from '@measured/puck';
import '@measured/puck/puck.css';
import { api } from '../api/client';
import { API_BASE_URL } from '../config/api';
import FreepikImagePicker from './FreepikImagePicker';
import { useAuth } from '../contexts/SimpleAuthContext';

// ===== HOOK POUR ÉDITION INLINE (comme Word) =====
const useInlineEdit = (initialValue: string, onSave: (value: string) => void) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setValue(initialValue);
    // Mettre à jour le contenu du DOM si pas en cours d'édition
    if (ref.current && !isEditing) {
      ref.current.textContent = initialValue;
    }
  }, [initialValue]);

  const handleClick = () => {
    setIsEditing(true);
    // Placer le curseur à la fin du texte
    setTimeout(() => {
      if (ref.current) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(ref.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (ref.current && ref.current.textContent !== initialValue) {
      onSave(ref.current.textContent || '');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      ref.current?.blur();
    }
    if (e.key === 'Escape') {
      if (ref.current) {
        ref.current.textContent = initialValue;
      }
      setIsEditing(false);
    }
  };

  return {
    ref,
    isEditing,
    value,
    handlers: {
      onDoubleClick: handleClick,
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      contentEditable: isEditing,
      suppressContentEditableWarning: true,
    },
  };
};

// ===== COMPOSANT INPUT HAUTEUR (avec état local pour éviter le blocage de frappe) =====
const HeightInput = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const [inputVal, setInputVal] = useState(String(value || 300));

  useEffect(() => {
    setInputVal(String(value || 300));
  }, [value]);

  const commitValue = (str: string) => {
    const v = parseInt(str, 10);
    if (!isNaN(v) && v >= 50 && v <= 2000) {
      onChange(v);
    } else {
      setInputVal(String(value || 300));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <input
        type="range"
        min={50}
        max={2000}
        step={10}
        value={value || 300}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          onChange(v);
          setInputVal(String(v));
        }}
        style={{ width: '100%' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="number"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={(e) => commitValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitValue((e.target as HTMLInputElement).value);
          }}
          style={{
            width: '80px',
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        />
        <span style={{ fontSize: '12px', color: '#888' }}>{value || 300}px</span>
      </div>
    </div>
  );
};

// ===== COMPOSANT CUSTOM POUR SÉLECTION D'IMAGE =====
const ImageUrlField = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => {
          onChange(e.target.value);
          setImageError(false);
          setImageLoaded(false);
        }}
        placeholder="https://..."
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
        }}
      />
      <button
        type="button"
        onClick={() => setShowPicker(true)}
        style={{
          width: '100%',
          padding: '8px 16px',
          backgroundColor: '#8b5cf6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        🖼️ Rechercher
      </button>
      {value && (
        <div style={{ position: 'relative' }}>
          {!imageLoaded && !imageError && (
            <div style={{
              width: '100%',
              height: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
            }}>
              <span style={{ color: '#9ca3af', fontSize: '14px' }}>Chargement...</span>
            </div>
          )}
          {imageError && (
            <div style={{
              width: '100%',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fee2e2',
              borderRadius: '6px',
              border: '1px solid #fecaca',
            }}>
              <span style={{ color: '#dc2626', fontSize: '12px' }}>❌ Erreur de chargement</span>
            </div>
          )}
          <img
            src={value}
            alt="Aperçu"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              console.error('Erreur chargement image:', value);
            }}
            style={{
              maxWidth: '100%',
              height: 'auto',
              maxHeight: '120px',
              objectFit: 'cover',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              display: imageLoaded ? 'block' : 'none',
            }}
          />
        </div>
      )}
      {showPicker && (
        <FreepikImagePicker
          onSelectImage={(url) => {
            console.log('🖼️ Image sélectionnée:', url);
            onChange(url);
            setShowPicker(false);
            setImageError(false);
            setImageLoaded(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
};

// ===== COMPOSANTS PUCK AVEC ÉDITION INLINE =====

// Utilitaire pour dispatching inline dans Puck
const usePuckInlineUpdate = (id: string) => {
  const { dispatch } = usePuck();
  return (propName: string, value: string) => {
    if (!id) return;
    dispatch({
      type: 'setData' as any,
      data: (currentData: any) => ({
        ...currentData,
        content: currentData.content.map((item: any) =>
          item.props.id === id
            ? { ...item, props: { ...item.props, [propName]: value } }
            : item
        ),
      }),
    } as any);
  };
};

// Utilitaire pour mettre à jour un item dans un tableau (paragraphes, features...)
const usePuckArrayItemUpdate = (id: string) => {
  const { dispatch } = usePuck();
  return (arrayProp: string, index: number, itemKey: string, value: string) => {
    if (!id) return;
    dispatch({
      type: 'setData' as any,
      data: (currentData: any) => ({
        ...currentData,
        content: currentData.content.map((item: any) =>
          item.props.id === id
            ? {
                ...item,
                props: {
                  ...item.props,
                  [arrayProp]: item.props[arrayProp].map((arrItem: any, i: number) =>
                    i === index ? { ...arrItem, [itemKey]: value } : arrItem
                  ),
                },
              }
            : item
        ),
      }),
    } as any);
  };
};

// Composant pour éditer un contenu multilignes inline (body text)
const EditableContent = ({
  content,
  onSave,
  style = {},
}: {
  content: string;
  onSave: (value: string) => void;
  style?: React.CSSProperties;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const startEdit = () => {
    setIsEditing(true);
    setTimeout(() => {
      if (ref.current) {
        ref.current.innerText = content;
        ref.current.focus();
        const range = document.createRange();
        range.selectNodeContents(ref.current);
        range.collapse(false);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    }, 0);
  };

  const handleBlur = () => {
    if (ref.current) {
      const newContent = ref.current.innerText;
      if (newContent !== content) onSave(newContent);
    }
    setIsEditing(false);
  };

  const baseStyle: React.CSSProperties = {
    fontSize: '15px',
    lineHeight: '1.8',
    color: '#34495e',
    whiteSpace: 'pre-wrap',
    borderRadius: '4px',
    transition: 'outline 0.15s',
    ...style,
  };

  if (isEditing) {
    return (
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            if (ref.current) ref.current.innerText = content;
            ref.current?.blur();
          }
        }}
        style={{ ...baseStyle, outline: '2px solid #667eea', padding: '4px', cursor: 'text', minHeight: '20px' }}
      />
    );
  }

  return (
    <div
      onDoubleClick={startEdit}
      title="✏️ Double-cliquez pour éditer"
      style={{ ...baseStyle, cursor: 'text', outline: '1px dashed transparent' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.outline = '1px dashed #a5b4fc'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.outline = '1px dashed transparent'; }}
      dangerouslySetInnerHTML={{ __html: content ? content.replace(/\n/g, '<br/>') : '<span style="color:#aaa;font-style:italic">Double-cliquez pour écrire...</span>' }}
    />
  );
};

// 1. Hero - En-tête d'offre (ÉDITABLE INLINE)
type HeroProps = {
  id?: string;
  title?: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
}

const Hero = ({ id = '', title = '', subtitle = '', align = 'left' }: HeroProps) => {
  const updateProp = usePuckInlineUpdate(id);
  const titleEdit = useInlineEdit(title, (newValue) => updateProp('title', newValue));
  const subtitleEdit = useInlineEdit(subtitle, (newValue) => updateProp('subtitle', newValue));

  return (
    <div
      style={{
        padding: '10px 0 20px 0',
        textAlign: align,
        marginBottom: '15px',
        borderBottom: '3px solid #667eea',
      }}
    >
      <h1
        ref={titleEdit.ref}
        {...titleEdit.handlers}
        style={{
          fontSize: '38px',
          fontWeight: 'bold',
          margin: '0 0 8px 0',
          fontFamily: 'Georgia, serif',
          color: '#2c3e50',
          outline: titleEdit.isEditing ? '2px solid #667eea' : 'none',
          padding: titleEdit.isEditing ? '4px' : '0',
          borderRadius: '4px',
          cursor: titleEdit.isEditing ? 'text' : 'pointer',
          transition: 'all 0.2s',
        }}
        title="✏️ Double-cliquez pour éditer"
      >
        {title}
      </h1>
      <p
        ref={subtitleEdit.ref}
        {...subtitleEdit.handlers}
        style={{
          fontSize: '17px',
          margin: 0,
          color: '#7f8c8d',
          outline: subtitleEdit.isEditing ? '2px solid #667eea' : 'none',
          padding: subtitleEdit.isEditing ? '4px' : '0',
          borderRadius: '4px',
          cursor: subtitleEdit.isEditing ? 'text' : 'pointer',
          transition: 'all 0.2s',
        }}
        title="✏️ Double-cliquez pour éditer"
      >
        {subtitle}
      </p>
    </div>
  );
};

// 2. TravelSection - Section de voyage simple (sans background)
type TravelSectionProps = {
  id?: string;
  title?: string;
  content?: string;
}

const TravelSection = ({
  id = '',
  title = '',
  content = '',
}: TravelSectionProps) => {
  const updateProp = usePuckInlineUpdate(id);
  const titleEdit = useInlineEdit(title, (newValue) => updateProp('title', newValue));

  return (
    <div style={{
      padding: '20px 0',
      marginBottom: '20px',
      borderBottom: '1px solid #e0e0e0',
    }}>
      <h2
        ref={titleEdit.ref}
        {...titleEdit.handlers}
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0 0 12px 0',
          color: '#2c3e50',
          fontFamily: 'Georgia, serif',
          outline: titleEdit.isEditing ? '2px solid #667eea' : 'none',
          padding: titleEdit.isEditing ? '4px' : '0',
          borderRadius: '4px',
          cursor: titleEdit.isEditing ? 'text' : 'pointer',
          transition: 'all 0.2s',
        }}
        title="✏️ Double-cliquez pour éditer le titre"
      >
        {title}
      </h2>
      <EditableContent
        content={content}
        onSave={(v) => updateProp('content', v)}
      />
    </div>
  );
};

// 3. PriceCard - Carte de prix (simple, sans background)
type PriceCardProps = {
  id?: string;
  title?: string;
  price?: string;
  currency?: string;
  features?: string[];
}

const PriceCard = ({
  id = '',
  title = '',
  price = '',
  currency = '€',
  features = [],
}: PriceCardProps) => {
  const updateProp = usePuckInlineUpdate(id);
  const titleEdit = useInlineEdit(title, (v) => updateProp('title', v));
  const priceEdit = useInlineEdit(price, (v) => updateProp('price', v));

  const inlineStyle = (isEditing: boolean): React.CSSProperties => ({
    outline: isEditing ? '2px solid #667eea' : 'none',
    padding: isEditing ? '2px 6px' : '0',
    borderRadius: '4px',
    cursor: isEditing ? 'text' : 'pointer',
    transition: 'all 0.2s',
    display: 'inline-block',
  });

  return (
    <div style={{
      padding: '30px 0',
      borderTop: '2px solid #667eea',
      borderBottom: '2px solid #667eea',
      textAlign: 'center',
      marginBottom: '20px',
    }}>
      <h3
        ref={titleEdit.ref}
        {...titleEdit.handlers}
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '15px',
          fontFamily: 'Georgia, serif',
          color: '#2c3e50',
          ...inlineStyle(titleEdit.isEditing),
        }}
        title="✏️ Double-cliquez pour éditer le titre"
      >
        {title}
      </h3>
      <div style={{ marginBottom: '20px' }}>
        <span
          ref={priceEdit.ref}
          {...priceEdit.handlers}
          style={{ fontSize: '42px', fontWeight: 'bold', color: '#667eea', ...inlineStyle(priceEdit.isEditing) }}
          title="✏️ Double-cliquez pour éditer le prix"
        >
          {price}
        </span>
        <span style={{ fontSize: '20px', marginLeft: '5px', color: '#667eea' }}>{currency}</span>
      </div>
      {features.length > 0 && (
        <ul style={{
          listStyle: 'none',
          padding: 0,
          textAlign: 'left',
          fontSize: '15px',
          lineHeight: '2',
          color: '#34495e',
          maxWidth: '500px',
          margin: '0 auto',
        }}>
          {features.map((feature, idx) => (
            <PriceFeatureItem key={idx} id={id} index={idx} feature={feature} />
          ))}
        </ul>
      )}
    </div>
  );
};

// Sub-composant pour chaque feature éditable
const PriceFeatureItem = ({ id, index, feature }: { id: string; index: number; feature: string }) => {
  const updateArrayItem = usePuckArrayItemUpdate(id);
  const featureEdit = useInlineEdit(feature, (v) => updateArrayItem('features', index, 'feature', v));
  return (
    <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ color: '#667eea', fontWeight: 'bold' }}>✓</span>
      <span
        ref={featureEdit.ref}
        {...featureEdit.handlers}
        style={{
          outline: featureEdit.isEditing ? '2px solid #667eea' : 'none',
          padding: featureEdit.isEditing ? '1px 4px' : '0',
          borderRadius: '3px',
          cursor: featureEdit.isEditing ? 'text' : 'pointer',
          flex: 1,
        }}
        title="✏️ Double-cliquez pour éditer"
      >
        {feature}
      </span>
    </li>
  );
};

// 4. SingleImage - Image unique avec suppression facile ✨ RECOMMANDÉ
type SingleImageProps = {
  url?: string;
  caption?: string;
  height?: number;
  borderRadius?: number;
}

const SingleImage = ({ 
  url = '', 
  caption = '', 
  height = 300,
  borderRadius = 8 
}: SingleImageProps) => {
  return (
    <div style={{ 
      marginBottom: '25px',
      position: 'relative',
      border: '2px dashed transparent',
      padding: '8px',
      transition: 'all 0.3s',
    }}
    className="single-image-block"
    onMouseEnter={(e) => {
      e.currentTarget.style.border = '2px dashed #667eea';
      e.currentTarget.style.backgroundColor = '#f8f9ff';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.border = '2px dashed transparent';
      e.currentTarget.style.backgroundColor = 'transparent';
    }}
    >
      {url ? (
        <>
          <img 
            src={url} 
            alt={caption || 'Image'}
            style={{ 
              width: '100%', 
              height: `${height}px`, 
              objectFit: 'cover', 
              borderRadius: `${borderRadius}px`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'block',
            }}
          />
          {caption && (
            <p style={{ 
              textAlign: 'center', 
              fontSize: '14px', 
              marginTop: '10px',
              color: '#7f8c8d',
              fontStyle: 'italic',
            }}>
              {caption}
            </p>
          )}
          {/* Indicateur visuel pour la suppression */}
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: 'rgba(231, 76, 60, 0.9)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            opacity: 0,
            transition: 'opacity 0.3s',
            pointerEvents: 'none',
          }}
          className="delete-hint"
          >
            🗑️ Cliquez pour supprimer
          </div>
        </>
      ) : (
        <div style={{
          width: '100%',
          height: `${height}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          border: '2px dashed #ccc',
          borderRadius: `${borderRadius}px`,
          color: '#999',
          fontSize: '14px',
          gap: '8px',
        }}>
          <span style={{ fontSize: '48px' }}>🖼️</span>
          <span>Ajoutez une URL d'image dans le panneau →</span>
        </div>
      )}
    </div>
  );
};

// 5. ImageGallery - Galerie d'images
type ImageGalleryProps = {
  images?: { url: string; caption?: string }[];
  columns?: number;
}

const ImageGallery = ({ images = [], columns = 3 }: ImageGalleryProps) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '15px',
      marginBottom: '30px',
    }}>
      {images.map((img, idx) => (
        <div key={idx} style={{ position: 'relative' }}>
          <img 
            src={img.url} 
            alt={img.caption || `Image ${idx + 1}`}
            style={{ 
              width: '100%', 
              height: '200px', 
              objectFit: 'cover', 
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
          {img.caption && (
            <p style={{ 
              textAlign: 'center', 
              fontSize: '12px', 
              marginTop: '8px',
              color: '#7f8c8d'
            }}>
              {img.caption}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

// 6. TextBlock - Bloc de texte simple
type TextBlockProps = {
  id?: string;
  content?: string;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  backgroundColor?: string;
  textColor?: string;
  padding?: number;
  borderRadius?: number;
}

const TextBlock = ({
  id = '',
  content = '',
  fontSize = 16,
  textAlign = 'justify',
  backgroundColor = 'transparent',
  textColor = '#34495e',
  padding = 0,
  borderRadius = 0,
}: TextBlockProps) => {
  const hasBackground = backgroundColor !== 'transparent' && backgroundColor !== '';
  const [isEditing, setIsEditing] = useState(false);
  const editRef = useRef<HTMLDivElement>(null);
  const updateProp = usePuckInlineUpdate(id);

  const handleBlur = () => {
    setIsEditing(false);
    if (editRef.current) {
      const newContent = editRef.current.innerText;
      if (newContent !== content) {
        updateProp('content', newContent);
      }
    }
  };

  return (
    <div
      ref={editRef}
      onDoubleClick={() => setIsEditing(true)}
      onBlur={handleBlur}
      contentEditable={isEditing}
      suppressContentEditableWarning
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: '1.8',
        textAlign,
        marginBottom: '20px',
        color: textColor,
        whiteSpace: 'pre-wrap',
        backgroundColor: hasBackground ? backgroundColor : 'transparent',
        padding: hasBackground ? `${padding}px` : `${padding}px`,
        borderRadius: hasBackground ? `${borderRadius}px` : 0,
        boxShadow: hasBackground ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
        outline: isEditing ? '2px solid #667eea' : '1px dashed transparent',
        cursor: isEditing ? 'text' : 'pointer',
        transition: 'outline 0.2s',
        minHeight: '40px',
        position: 'relative' as const,
      }}
      title="Double-cliquez pour éditer"
    >
      {content.split('\n').map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < content.split('\n').length - 1 && <br />}
        </React.Fragment>
      ))}
      {!isEditing && !content && (
        <span style={{ color: '#aaa', fontStyle: 'italic' }}>Cliquez pour écrire...</span>
      )}
    </div>
  );
};

// 7. CalloutBox - Titre surligné (highlight style) - VERSION SIMPLE
type CalloutBoxProps = {
  id?: string;
  title?: string;
  content?: string;
  titleBackgroundColor?: string;
  titleTextColor?: string;
}

const CalloutBox = ({
  id = '',
  title = 'Titre important',
  content = 'Votre contenu ici...',
  titleBackgroundColor = '#667eea',
  titleTextColor = '#ffffff',
}: CalloutBoxProps) => {
  const updateProp = usePuckInlineUpdate(id);
  const titleEdit = useInlineEdit(title, (newValue) => updateProp('title', newValue));

  return (
    <div style={{
      marginBottom: '25px',
    }}>
      {/* Titre surligné (highlight) */}
      <div style={{
        display: 'inline-block',
        backgroundColor: titleBackgroundColor,
        color: titleTextColor,
        padding: '10px 20px',
        borderRadius: '6px',
        marginBottom: '12px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      }}>
        <h3
          ref={titleEdit.ref}
          {...titleEdit.handlers}
          style={{
            fontSize: '22px',
            fontWeight: 'bold',
            margin: 0,
            fontFamily: 'Georgia, serif',
            outline: titleEdit.isEditing ? '2px solid rgba(255,255,255,0.8)' : 'none',
            borderRadius: '3px',
            cursor: titleEdit.isEditing ? 'text' : 'pointer',
          }}
          title="✏️ Double-cliquez pour éditer le titre"
        >
          {title}
        </h3>
      </div>

      {/* Contenu éditable */}
      <EditableContent
        content={content}
        onSave={(v) => updateProp('content', v)}
      />
    </div>
  );
};

// 8. RichCalloutBox - CalloutBox AVANCÉ avec paragraphes éditables individuellement ✨ NOUVEAU
type RichCalloutBoxProps = {
  id?: string;
  title?: string;
  paragraphs?: { text: string }[];
  titleBackgroundColor?: string;
  titleTextColor?: string;
}

const RichCalloutBox = ({
  id = '',
  title = 'Titre important',
  paragraphs = [{ text: 'Paragraphe 1' }],
  titleBackgroundColor = '#667eea',
  titleTextColor = '#ffffff',
}: RichCalloutBoxProps) => {
  const updateProp = usePuckInlineUpdate(id);
  const titleEdit = useInlineEdit(title, (newValue) => updateProp('title', newValue));

  return (
    <div style={{
      marginBottom: '25px',
    }}>
      {/* Titre surligné (highlight) */}
      <div style={{
        display: 'inline-block',
        backgroundColor: titleBackgroundColor,
        color: titleTextColor,
        padding: '10px 20px',
        borderRadius: '6px',
        marginBottom: '12px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      }}>
        <h3
          ref={titleEdit.ref}
          {...titleEdit.handlers}
          style={{
            fontSize: '22px',
            fontWeight: 'bold',
            margin: 0,
            fontFamily: 'Georgia, serif',
            outline: titleEdit.isEditing ? '2px solid rgba(255,255,255,0.8)' : 'none',
            borderRadius: '3px',
            cursor: titleEdit.isEditing ? 'text' : 'pointer',
          }}
          title="✏️ Double-cliquez pour éditer le titre"
        >
          {title}
        </h3>
      </div>

      {/* Paragraphes éditables individuellement */}
      <div style={{ color: '#34495e', fontSize: '15px', lineHeight: '1.8' }}>
        {paragraphs.map((para, idx) => (
          <RichParagraph key={idx} id={id} index={idx} text={para.text} />
        ))}
      </div>
    </div>
  );
};

// Sub-composant pour chaque paragraphe éditable
const RichParagraph = ({ id, index, text }: { id: string; index: number; text: string }) => {
  const updateArrayItem = usePuckArrayItemUpdate(id);
  const edit = useInlineEdit(text, (v) => updateArrayItem('paragraphs', index, 'text', v));
  return (
    <p
      ref={edit.ref}
      {...edit.handlers}
      style={{
        marginBottom: '10px',
        whiteSpace: 'pre-wrap',
        outline: edit.isEditing ? '2px solid #667eea' : '1px dashed transparent',
        padding: edit.isEditing ? '3px 6px' : '2px',
        borderRadius: '3px',
        cursor: edit.isEditing ? 'text' : 'pointer',
        transition: 'outline 0.15s',
      }}
      onMouseEnter={(e) => { if (!edit.isEditing) (e.currentTarget as HTMLParagraphElement).style.outline = '1px dashed #a5b4fc'; }}
      onMouseLeave={(e) => { if (!edit.isEditing) (e.currentTarget as HTMLParagraphElement).style.outline = '1px dashed transparent'; }}
      title="✏️ Double-cliquez pour éditer"
    >
      {text}
    </p>
  );
};

// 9. PageBreak - Saut de page
type PageBreakProps = {
  label?: string;
  showInEditor?: boolean;
}

const PageBreak = ({ 
  label = 'Nouvelle page', 
  showInEditor = true 
}: PageBreakProps) => {
  return (
    <div style={{
      margin: '40px 0',
      padding: '20px',
      border: showInEditor ? '2px dashed #667eea' : 'none',
      borderRadius: '8px',
      backgroundColor: showInEditor ? '#f0f4ff' : 'transparent',
      textAlign: 'center',
      pageBreakAfter: 'always',
    }}>
      {showInEditor && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          color: '#667eea',
          fontSize: '14px',
          fontWeight: 'bold',
        }}>
          <span style={{ fontSize: '20px' }}>📄</span>
          <span>{label}</span>
          <span style={{ fontSize: '20px' }}>✂️</span>
        </div>
      )}
    </div>
  );
};

// 10. Divider - Séparateur
type DividerProps = {
  style?: 'solid' | 'dashed' | 'dotted';
  color?: string;
  spacing?: number;
}

const Divider = ({ 
  style = 'solid', 
  color = '#e0e0e0',
  spacing = 30
}: DividerProps) => {
  return (
    <hr style={{
      border: 'none',
      borderTop: `2px ${style} ${color}`,
      margin: `${spacing}px 0`,
    }} />
  );
};

// 11. ContactInfo - Informations de contact (simple)
type ContactInfoProps = {
  id?: string;
  companyName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

const ContactInfo = ({
  id = '',
  companyName = '',
  phone = '',
  email = '',
  address = '',
}: ContactInfoProps) => {
  const updateProp = usePuckInlineUpdate(id);
  const nameEdit = useInlineEdit(companyName, (v) => updateProp('companyName', v));
  const phoneEdit = useInlineEdit(phone, (v) => updateProp('phone', v));
  const emailEdit = useInlineEdit(email, (v) => updateProp('email', v));
  const addressEdit = useInlineEdit(address, (v) => updateProp('address', v));

  const fieldStyle = (isEditing: boolean): React.CSSProperties => ({
    outline: isEditing ? '2px solid #667eea' : 'none',
    padding: isEditing ? '1px 6px' : '0',
    borderRadius: '3px',
    cursor: isEditing ? 'text' : 'pointer',
    display: 'inline-block',
    minWidth: '20px',
  });

  return (
    <div style={{
      padding: '30px 0',
      marginTop: '40px',
      textAlign: 'center',
      borderTop: '2px solid #2c3e50',
    }}>
      <h3
        ref={nameEdit.ref}
        {...nameEdit.handlers}
        style={{
          fontSize: '22px',
          fontWeight: 'bold',
          marginBottom: '15px',
          fontFamily: 'Georgia, serif',
          color: '#2c3e50',
          ...fieldStyle(nameEdit.isEditing),
        }}
        title="✏️ Double-cliquez pour éditer"
      >
        {companyName}
      </h3>
      <div style={{ fontSize: '15px', lineHeight: '2', color: '#34495e' }}>
        {(phone !== undefined) && (
          <div>
            📞 <span ref={phoneEdit.ref} {...phoneEdit.handlers} style={fieldStyle(phoneEdit.isEditing)} title="✏️ Double-cliquez pour éditer">{phone}</span>
          </div>
        )}
        {(email !== undefined) && (
          <div>
            ✉️ <span ref={emailEdit.ref} {...emailEdit.handlers} style={fieldStyle(emailEdit.isEditing)} title="✏️ Double-cliquez pour éditer">{email}</span>
          </div>
        )}
        {(address !== undefined) && (
          <div>
            📍 <span ref={addressEdit.ref} {...addressEdit.handlers} style={fieldStyle(addressEdit.isEditing)} title="✏️ Double-cliquez pour éditer">{address}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ===== CONFIGURATION PUCK =====

const config: Config = {
  components: {
    Hero: {
      fields: {
        title: { 
          type: 'text',
          label: 'Titre',
        },
        subtitle: { 
          type: 'text',
          label: 'Sous-titre',
        },
        align: {
          type: 'radio',
          label: 'Alignement',
          options: [
            { label: 'Gauche', value: 'left' },
            { label: 'Centre', value: 'center' },
            { label: 'Droite', value: 'right' },
          ],
        },
      },
      defaultProps: {
        title: 'Découvrez votre voyage de rêve',
        subtitle: 'Une expérience inoubliable vous attend',
        align: 'left', // ✅ Par défaut à gauche
      },
      render: Hero as any,
    },
    TravelSection: {
      fields: {
        title: {
          type: 'text',
          label: 'Titre',
        },
        content: {
          type: 'textarea',
          label: 'Contenu',
        },
      },
      defaultProps: {
        title: 'Vols & Transport',
        content: 'Détails de vos vols et transports...',
      },
      render: TravelSection as any,
    },
    PriceCard: {
      fields: {
        title: {
          type: 'text',
          label: 'Titre',
        },
        price: {
          type: 'text',
          label: 'Prix',
        },
        currency: {
          type: 'text',
          label: 'Devise',
        },
        features: {
          type: 'array',
          label: 'Caractéristiques',
          arrayFields: {
            feature: {
              type: 'text',
              label: 'Caractéristique',
            },
          },
          getItemSummary: (item: any) => item.feature || 'Nouvelle caractéristique',
        },
      },
      defaultProps: {
        title: 'Offre Standard',
        price: '1500',
        currency: '€',
        features: [],
      },
      render: (props: any) => (
        <PriceCard
          {...props}
          id={props.id}
          features={props.features?.map((f: any) => f.feature) || []}
        />
      ),
    },
    SingleImage: {
      label: '🖼️ Image',
      fields: {
        url: {
          type: 'custom',
          label: '📸 URL de l\'image',
          render: ({ value, onChange }) => (
            <ImageUrlField value={value} onChange={onChange} />
          ),
        },
        caption: {
          type: 'text',
          label: '📝 Légende (optionnel)',
        },
        height: {
          type: 'custom',
          label: '📏 Hauteur (px)',
          render: ({ value, onChange }) => (
            <HeightInput value={value} onChange={onChange} />
          ),
        },
        borderRadius: {
          type: 'custom',
          label: '🔲 Arrondi des coins (px)',
          render: ({ value, onChange }) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="range"
                min={0}
                max={30}
                value={value || 0}
                onChange={(e) => onChange(parseInt(e.target.value, 10))}
                style={{ flex: 1 }}
              />
              <input
                type="number"
                min={0}
                max={30}
                value={value || 0}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v)) onChange(Math.min(30, Math.max(0, v)));
                }}
                style={{
                  width: '60px',
                  padding: '4px 8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>
          ),
        },
      },
      defaultProps: {
        url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
        caption: '',
        height: 300,
        borderRadius: 8,
      },
      render: SingleImage as any,
    },
    ImageGallery: {
      fields: {
        images: {
          type: 'array',
          label: 'Images (cliquez pour modifier/supprimer 🗑️)',
          arrayFields: {
            url: {
              type: 'custom',
              label: 'URL de l\'image',
              render: ({ value, onChange }) => (
                <ImageUrlField value={value} onChange={onChange} />
              ),
            },
            caption: {
              type: 'text',
              label: 'Légende (optionnel)',
            },
          },
          getItemSummary: (item: any, index: number) => {
            const displayUrl = item.url ? item.url.substring(0, 50) + '...' : 'Pas d\'URL';
            const caption = item.caption ? ` - "${item.caption}"` : '';
            return `🖼️ Image ${index + 1}: ${caption || displayUrl}`;
          },
          defaultItemProps: {
            url: '',
            caption: '',
          },
        },
        columns: {
          type: 'number',
          label: 'Colonnes',
          min: 1,
          max: 4,
        },
      },
      defaultProps: {
        images: [
          { url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400', caption: 'Destination' },
        ],
        columns: 3,
      },
      render: ImageGallery as any,
    },
    TextBlock: {
      fields: {
        content: {
          type: 'textarea',
          label: 'Contenu',
        },
        fontSize: {
          type: 'number',
          label: 'Taille de police',
          min: 10,
          max: 32,
        },
        textAlign: {
          type: 'radio',
          label: 'Alignement',
          options: [
            { label: 'Gauche', value: 'left' },
            { label: 'Centre', value: 'center' },
            { label: 'Droite', value: 'right' },
            { label: 'Justifié', value: 'justify' },
          ],
        },
        backgroundColor: {
          type: 'select',
          label: 'Couleur de fond',
          options: [
            { label: 'Aucune', value: 'transparent' },
            { label: 'Gris clair', value: '#f8f9fa' },
            { label: 'Vert clair', value: '#e8f5e9' },
            { label: 'Bleu clair', value: '#e3f2fd' },
            { label: 'Orange clair', value: '#fff3e0' },
            { label: 'Rose clair', value: '#fce4ec' },
            { label: 'Violet clair', value: '#f3e5f5' },
            { label: 'Jaune clair', value: '#fffde7' },
            { label: 'Blanc', value: '#ffffff' },
          ],
        },
        textColor: {
          type: 'select',
          label: 'Couleur du texte',
          options: [
            { label: 'Gris foncé (défaut)', value: '#34495e' },
            { label: 'Noir', value: '#000000' },
            { label: 'Blanc', value: '#ffffff' },
            { label: 'Bleu', value: '#2196F3' },
            { label: 'Vert', value: '#4CAF50' },
            { label: 'Rouge', value: '#f44336' },
            { label: 'Orange', value: '#FF9800' },
          ],
        },
        padding: {
          type: 'number',
          label: 'Espacement intérieur (px)',
          min: 0,
          max: 60,
        },
        borderRadius: {
          type: 'number',
          label: 'Arrondi des coins (px)',
          min: 0,
          max: 30,
        },
      },
      defaultProps: {
        content: 'Votre texte ici...',
        fontSize: 15,
        textAlign: 'left', // ✅ Par défaut à gauche
        backgroundColor: 'transparent',
        textColor: '#34495e',
        padding: 0,
        borderRadius: 0,
      },
      render: TextBlock as any,
    },
    PageBreak: {
      fields: {
        label: {
          type: 'text',
          label: 'Label de la page',
        },
        showInEditor: {
          type: 'radio',
          label: 'Afficher dans l\'éditeur',
          options: [
            { label: 'Oui', value: true },
            { label: 'Non', value: false },
          ],
        },
      },
      defaultProps: {
        label: 'Nouvelle page',
        showInEditor: true,
      },
      render: PageBreak as any,
    },
    Divider: {
      fields: {
        style: {
          type: 'radio',
          label: 'Style',
          options: [
            { label: 'Solide', value: 'solid' },
            { label: 'Tirets', value: 'dashed' },
            { label: 'Points', value: 'dotted' },
          ],
        },
        color: {
          type: 'text',
          label: 'Couleur',
        },
        spacing: {
          type: 'number',
          label: 'Espacement (px)',
          min: 0,
          max: 100,
        },
      },
      defaultProps: {
        style: 'solid',
        color: '#e0e0e0',
        spacing: 30,
      },
      render: Divider as any,
    },
    CalloutBox: {
      fields: {
        title: {
          type: 'text',
          label: 'Titre',
        },
        content: {
          type: 'textarea',
          label: 'Contenu',
        },
        titleBackgroundColor: {
          type: 'select',
          label: 'Couleur du titre',
          options: [
            { label: 'Bleu', value: '#667eea' },
            { label: 'Bleu clair', value: '#2196F3' },
            { label: 'Vert', value: '#4CAF50' },
            { label: 'Orange', value: '#FF9800' },
            { label: 'Rouge', value: '#f44336' },
            { label: 'Violet', value: '#9C27B0' },
            { label: 'Rose', value: '#E91E63' },
            { label: 'Cyan', value: '#00BCD4' },
            { label: 'Gris foncé', value: '#424242' },
            { label: 'Noir', value: '#000000' },
          ],
        },
        titleTextColor: {
          type: 'select',
          label: 'Couleur texte titre',
          options: [
            { label: 'Blanc', value: '#ffffff' },
            { label: 'Noir', value: '#000000' },
            { label: 'Gris clair', value: '#f5f5f5' },
          ],
        },
      },
      defaultProps: {
        title: 'Information importante',
        content: 'Votre contenu mis en valeur...',
        titleBackgroundColor: '#667eea',
        titleTextColor: '#ffffff',
      },
      render: CalloutBox as any,
    },
    RichCalloutBox: {
      fields: {
        title: {
          type: 'text',
          label: 'Titre',
        },
        paragraphs: {
          type: 'array',
          label: '📝 Paragraphes (chaque ligne est éditable individuellement)',
          arrayFields: {
            text: {
              type: 'textarea',
              label: 'Texte',
            },
          },
          getItemSummary: (item: any, index: number) => {
            const preview = item.text ? item.text.substring(0, 60) + (item.text.length > 60 ? '...' : '') : 'Paragraphe vide';
            return `📝 §${index + 1}: ${preview}`;
          },
          defaultItemProps: {
            text: 'Nouveau paragraphe...',
          },
        },
        titleBackgroundColor: {
          type: 'select',
          label: 'Couleur du titre',
          options: [
            { label: 'Bleu', value: '#667eea' },
            { label: 'Bleu clair', value: '#2196F3' },
            { label: 'Vert', value: '#4CAF50' },
            { label: 'Orange', value: '#FF9800' },
            { label: 'Rouge', value: '#f44336' },
            { label: 'Violet', value: '#9C27B0' },
            { label: 'Rose', value: '#E91E63' },
            { label: 'Cyan', value: '#00BCD4' },
            { label: 'Gris foncé', value: '#424242' },
            { label: 'Noir', value: '#000000' },
          ],
        },
        titleTextColor: {
          type: 'select',
          label: 'Couleur texte titre',
          options: [
            { label: 'Blanc', value: '#ffffff' },
            { label: 'Noir', value: '#000000' },
            { label: 'Gris clair', value: '#f5f5f5' },
          ],
        },
      },
      defaultProps: {
        title: 'Information importante',
        paragraphs: [
          { text: 'Premier paragraphe...' },
          { text: 'Deuxième paragraphe...' },
        ],
        titleBackgroundColor: '#667eea',
        titleTextColor: '#ffffff',
      },
      render: RichCalloutBox as any,
    },
    ContactInfo: {
      fields: {
        companyName: {
          type: 'text',
          label: 'Nom de l\'entreprise',
        },
        phone: {
          type: 'text',
          label: 'Téléphone',
        },
        email: {
          type: 'text',
          label: 'Email',
        },
        address: {
          type: 'text',
          label: 'Adresse',
        },
      },
      defaultProps: {
        companyName: 'Invitation au Voyage',
        phone: '+33 1 23 45 67 89',
        email: 'contact@invitationauvoyage.fr',
        address: 'Paris, France',
      },
      render: (props: any) => <ContactInfo {...props} id={props.id} />,
    },
  },
};

// ===== DONNÉES PAR DÉFAUT =====

const initialData: Data = {
  content: [
    {
      type: 'Hero',
      props: {
        id: 'Hero-1',
        title: 'Voyage à Paris',
        subtitle: 'Découvrez la ville lumière',
        align: 'center',
      },
    },
    {
      type: 'TextBlock',
      props: {
        id: 'TextBlock-1',
        content: 'Bienvenue dans votre offre de voyage sur mesure. Découvrez ci-dessous tous les détails de votre séjour exceptionnel.',
        fontSize: 16,
        textAlign: 'left',
      },
    },
    {
      type: 'SingleImage',
      props: {
        id: 'SingleImage-1',
        url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
        caption: 'Paris, la ville lumière',
        height: 300,
        borderRadius: 8,
      },
    },
    {
      type: 'RichCalloutBox',
      props: {
        id: 'RichCalloutBox-1',
        title: 'Vols & Transport',
        paragraphs: [
          { text: 'Vol aller-retour Paris CDG - Destination' },
          { text: 'Bagages inclus : 1 bagage cabine + 1 bagage en soute' },
          { text: 'Transferts aéroport inclus' },
        ],
        titleBackgroundColor: '#2196F3',
        titleTextColor: '#ffffff',
      },
    },
    {
      type: 'RichCalloutBox',
      props: {
        id: 'RichCalloutBox-2',
        title: 'Hébergement',
        paragraphs: [
          { text: 'Hôtel 4 étoiles en centre-ville' },
          { text: 'Chambre double avec petit-déjeuner inclus' },
          { text: '7 nuits' },
        ],
        titleBackgroundColor: '#9C27B0',
        titleTextColor: '#ffffff',
      },
    },
    {
      type: 'PriceCard',
      props: {
        id: 'PriceCard-1',
        title: 'Prix par personne',
        price: '1500',
        currency: '€',
        features: [
          { feature: 'Vols aller-retour' },
          { feature: '7 nuits d\'hôtel' },
          { feature: 'Petit-déjeuner inclus' },
          { feature: 'Transferts aéroport' },
        ],
      },
    },
    // ❌ ContactInfo supprimé - plus besoin des infos de la société en dernière page
  ],
  root: { props: {} },
};

// ===== FONCTIONS UTILITAIRES =====

// Convertir une offre en données Puck
const convertOfferToPuckData = (offer: any): Data => {
  console.log('🔄 Conversion offre → Puck:', offer);
  const newContent: any[] = [];

  // Hero
  if (offer.title) {
    newContent.push({
      type: 'Hero',
      props: {
        id: 'Hero-1',
        title: offer.title,
        subtitle: offer.destination || offer.subtitle || 'Votre voyage sur mesure',
        align: 'left', // ✅ Aligné à gauche !
      },
    });
  }

  // Introduction
  if (offer.introduction) {
    newContent.push({
      type: 'TextBlock',
      props: {
        id: 'TextBlock-intro',
        content: offer.introduction,
        fontSize: 15,
        textAlign: 'left', // ✅ Aligné à gauche !
      },
    });
  }

  // Sections → Convertir en CalloutBox
  if (offer.sections && Array.isArray(offer.sections)) {
    offer.sections.forEach((section: any, idx: number) => {
      // Debug: voir la structure complète de la section
      console.log(`  🔍 Structure section ${idx}:`, section);
      
      // Plus besoin d'icônes
      
      // Couleurs par type de section
      const colors: Record<string, { bg: string, border: string }> = {
        'Flights': { bg: '#e3f2fd', border: '#2196F3' },
        'Transfers': { bg: '#fff3e0', border: '#FF9800' },
        'Hotel': { bg: '#f3e5f5', border: '#9C27B0' },
        'Hébergement': { bg: '#f3e5f5', border: '#9C27B0' },
        'Activities': { bg: '#e8f5e9', border: '#4CAF50' },
        'Activités': { bg: '#e8f5e9', border: '#4CAF50' },
        'Price': { bg: '#fce4ec', border: '#E91E63' },
        'Prix': { bg: '#fce4ec', border: '#E91E63' },
        'Tarifs': { bg: '#fce4ec', border: '#E91E63' },
      };

      // Extraire le contenu de la section (plusieurs formats possibles)
      let sectionContent = '';
      
      // Format 1: body (format OpenAI le plus courant)
      if (section.body) {
        sectionContent = typeof section.body === 'string' 
          ? section.body 
          : JSON.stringify(section.body, null, 2);
      }
      // Format 2: content direct
      else if (section.content) {
        sectionContent = typeof section.content === 'string' 
          ? section.content 
          : JSON.stringify(section.content, null, 2);
      } 
      // Format 3: description
      else if (section.description) {
        sectionContent = typeof section.description === 'string'
          ? section.description
          : JSON.stringify(section.description, null, 2);
      } 
      // Format 4: details
      else if (section.details) {
        sectionContent = typeof section.details === 'string'
          ? section.details
          : JSON.stringify(section.details, null, 2);
      }
      // Format 5: items (liste)
      else if (section.items && Array.isArray(section.items)) {
        sectionContent = section.items
          .map((item: any) => {
            if (typeof item === 'string') return `• ${item}`;
            if (item.title && item.description) return `• ${item.title}\n  ${item.description}`;
            if (item.label) return `• ${item.label}`;
            return `• ${JSON.stringify(item)}`;
          })
          .join('\n');
      }
      // Format 6: tous les champs sauf title/type/icon/id
      else {
        const ignoredKeys = ['title', 'type', 'icon', 'id'];
        const contentKeys = Object.keys(section).filter(k => !ignoredKeys.includes(k));
        if (contentKeys.length > 0) {
          sectionContent = contentKeys
            .map(key => `${key}: ${JSON.stringify(section[key])}`)
            .join('\n');
        }
      }

      console.log(`  📋 Section ${idx}:`, section.title || section.type, '→', sectionContent?.substring(0, 80));

      // Extraire les images de la section (format: section.image ou section.images)
      // Dédoublonner pour éviter les répétitions
      const sectionImagesSet = new Set<string>();
      
      if (section.image) {
        // Format: section.image peut être une URL string ou un objet {url, description}
        if (typeof section.image === 'string') {
          sectionImagesSet.add(section.image);
        } else if (section.image.url) {
          sectionImagesSet.add(section.image.url);
        }
      }
      if (section.images && Array.isArray(section.images)) {
        section.images.forEach((img: any) => {
          if (typeof img === 'string') {
            sectionImagesSet.add(img);
          } else if (img.url) {
            sectionImagesSet.add(img.url);
          }
        });
      }
      
      // Convertir le Set en tableau (images uniques)
      const sectionImages = Array.from(sectionImagesSet);

      // ✨ Utiliser RichCalloutBox avec paragraphes éditables au lieu de CalloutBox
      const sectionType = section.type || section.title || '';
      const colorScheme = colors[sectionType] || { bg: '#f0f4ff', border: '#667eea' };
      
      // Découper le contenu en paragraphes (séparés par \n\n ou \n)
      const paragraphs = sectionContent
        .split(/\n{2,}/)  // Split sur double saut de ligne d'abord
        .flatMap(p => p.split('\n'))  // Puis split sur simple saut de ligne
        .filter(p => p.trim() !== '')  // Retirer les lignes vides
        .map(p => ({ text: p.trim() }));
      
      // Si pas de paragraphes, créer un paragraphe par défaut
      if (paragraphs.length === 0) {
        paragraphs.push({ text: sectionContent || 'Contenu à définir...' });
      }
      
      newContent.push({
        type: 'RichCalloutBox',
        props: {
          id: `RichCalloutBox-${idx}`,
          title: section.title || section.type || `Section ${idx + 1}`,
          paragraphs: paragraphs,
          titleBackgroundColor: colorScheme.border,
          titleTextColor: '#ffffff',
        },
      });
      
      // ✨ Ajouter les images en SingleImage au lieu d'ImageGallery (une image = un bloc)
      if (sectionImages.length > 0) {
        console.log(`  🖼️ ${sectionImages.length} image(s) trouvée(s) pour section ${idx} → conversion en SingleImage`);
        sectionImages.forEach((url, imgIdx) => {
          newContent.push({
            type: 'SingleImage',
            props: {
              id: `SingleImage-${idx}-${imgIdx}`,
              url: url,
              caption: `${section.title || section.type} - Image ${imgIdx + 1}`,
              height: 300,
              borderRadius: 8,
            },
          });
        });
      }
      
      // Ajouter un PageBreak après chaque section
      newContent.push({
        type: 'PageBreak',
        props: {
          id: `PageBreak-${idx}`,
          label: `Page ${idx + 2}`,
          showInEditor: true,
        },
      });
    });
  }

  // Prix
  if (offer.price || offer.budget) {
    const priceData = offer.price || offer.budget;
    newContent.push({
      type: 'PriceCard',
      props: {
        id: 'PriceCard-1',
        title: 'Prix par personne',
        price: priceData.toString().replace(/[^0-9]/g, ''),
        currency: '€',
        features: [
          { feature: 'Vols aller-retour' },
          { feature: 'Hébergement' },
          { feature: 'Taxes incluses' },
        ],
        highlighted: true,
      },
    });
  }

  // ❌ Contact supprimé - l'utilisateur ne veut plus les infos de la société en dernière page
  // newContent.push({
  //   type: 'ContactInfo',
  //   props: {
  //     id: 'ContactInfo-1',
  //     companyName: 'Invitation au Voyage',
  //     phone: '+33 1 23 45 67 89',
  //     email: 'contact@invitationauvoyage.fr',
  //     address: 'Paris, France',
  //   },
  // });

  console.log('🎨 Données Puck générées:', newContent);
  
  return {
    content: newContent,
    root: { props: {} },
  };
};

// ===== COMPOSANT PRINCIPAL =====

interface PuckEditorProps {
  prefilledData?: any;
  documentId?: number;
  onSave?: (data: any) => void;
}

const PuckEditor: React.FC<PuckEditorProps> = ({
  prefilledData,
  documentId,
  onSave
}) => {
  const { user } = useAuth();

  // Initialiser avec les données converties si disponibles, sinon utiliser initialData
  const [data, setData] = useState<Data>(() => {
    console.log('🎬 Initialisation PuckEditor avec:', prefilledData);
    
    if (prefilledData) {
      // Cas 1 : Données avec offer_structure
      if (prefilledData.offer_structure) {
        console.log('✅ Init depuis offer_structure');
        return convertOfferToPuckData(prefilledData.offer_structure);
      }
      // Cas 2 : Données directes
      else if (prefilledData.title || prefilledData.sections) {
        console.log('✅ Init depuis données directes');
        return convertOfferToPuckData(prefilledData);
      }
      // Cas 3 : Données Puck déjà formatées
      else if (prefilledData.content && Array.isArray(prefilledData.content)) {
        console.log('✅ Init depuis données Puck');
        return prefilledData;
      }
    }
    
    console.log('✅ Init avec données par défaut');
    return initialData;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [showDesignPanel, setShowDesignPanel] = useState(false);
  const [globalBackground, setGlobalBackground] = useState({
    image: '',
    opacity: 0.1,
    repeat: 'repeat',
    size: '800px auto',
    position: 'top center',
  });
  
  const [headerFooter, setHeaderFooter] = useState({
    enabled: true, // ✅ Réactivé avec les nouvelles images par défaut
    headerLogo: 'https://i.imgur.com/Yc6RF8t.png',// ✅ Nouvelle image header
    headerText: '',  // Pas de texte, juste l'image
    footerLogo: 'https://i.imgur.com/6Ku63dc.png', // ✅ Nouvelle image footer
    footerText: '', // Pas de texte, juste l'image
    logoSize: 'auto', // Taille automatique pour que l'image prenne toute la largeur
    textSize: '16px',
  });

  // Mettre à jour si les données changent après le montage
  React.useEffect(() => {
    if (prefilledData) {
      console.log('📥 Mise à jour des données:', prefilledData);
      
      // Cas 1 : Données avec offer_structure
      if (prefilledData.offer_structure) {
        console.log('🔄 Update depuis offer_structure');
        setData(convertOfferToPuckData(prefilledData.offer_structure));
      }
      // Cas 2 : Données directes
      else if (prefilledData.title || prefilledData.sections) {
        console.log('🔄 Update depuis données directes');
        setData(convertOfferToPuckData(prefilledData));
      }
      // Cas 3 : Données Puck déjà formatées
      else if (prefilledData.content && Array.isArray(prefilledData.content)) {
        console.log('🔄 Update depuis données Puck');
        setData(prefilledData);
      }
    }
  }, [prefilledData]);

  // Trouver le dossier de l'utilisateur connecté
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const findFolderIdForUser = (folders: any[]): number | undefined => {
    if (!user || !folders?.length) return undefined;
    const candidates: string[] = [];
    if (user.first_name) candidates.push(user.first_name.toLowerCase());
    if (user.last_name) candidates.push(user.last_name.toLowerCase());
    if (user.username) {
      const emailPrefix = user.username.split('@')[0].toLowerCase();
      if (emailPrefix) candidates.push(emailPrefix);
    }
    if (user.email) {
      const emailPrefix = user.email.split('@')[0].toLowerCase();
      if (emailPrefix && !candidates.includes(emailPrefix)) candidates.push(emailPrefix);
    }
    console.log('🔍 Recherche dossier pour candidates:', candidates, 'dans dossiers:', folders.map((f: any) => f.name));
    const folder = folders.find((f: any) =>
      candidates.some(name => name && f.name.toLowerCase().includes(name))
    );
    console.log('📁 Dossier trouvé:', folder?.name, '(id:', folder?.id, ')');
    return folder?.id;
  };

  // Sauvegarder le document
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const title = data.content.find((c: any) => c.type === 'Hero')?.props?.title || 'Document Puck';

      // Récupérer les dossiers depuis l'API
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
        console.log('📁 Dossiers récupérés:', allFolders.map((f: any) => `${f.name} (id:${f.id})`));
        console.log('👤 User:', { username: user?.username, email: user?.email, first_name: user?.first_name });
        folderId = findFolderIdForUser(allFolders);
        console.log('📂 FolderId sélectionné:', folderId);
      } catch (folderErr) {
        console.warn('⚠️ Impossible de récupérer les dossiers:', folderErr);
        // Fallback: localStorage
        try {
          const saved = localStorage.getItem('demo_folders');
          if (saved) folderId = findFolderIdForUser(JSON.parse(saved));
        } catch {}
      }

      const saveData: any = {
        title,
        description: `Document Puck créé le ${new Date().toLocaleDateString('fr-FR')}`,
        document_type: 'puck_project',
        puck_data: data,
        global_background: globalBackground,
        header_footer: headerFooter,
        offer_structure: prefilledData?.offer_structure || null,
      };

      if (folderId !== undefined) {
        saveData.folder_id = folderId;
      }

      const response = await api.post('api/documents/', saveData);
      const result = response.data;

      // Invalider le cache localStorage
      localStorage.removeItem('demo_documents');
      localStorage.removeItem('demo_data_timestamp');

      const folderMsg = folderId ? ` dans votre dossier` : ' (sans dossier — vérifiez la console)';
      const msg = `✅ Document "${title}" sauvegardé${folderMsg} !`;
      window.alert(msg);

      if (onSave) {
        onSave({ puck_data: data, documentId: result.id });
      }
    } catch (error: any) {
      console.error('❌ Erreur sauvegarde:', error);
      const msg = error?.detail || error?.message || 'Erreur inconnue';
      window.alert(`❌ Erreur lors de la sauvegarde : ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Générer le PDF
  const handleGeneratePDF = async () => {
    setIsLoading(true);
    try {
      // Convertir les données Puck en HTML
      const html = convertPuckToHTML(data);
      
      // CSS avec background global si configuré
      const backgroundStyles = globalBackground.image ? `
        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url("${globalBackground.image}");
          background-repeat: ${globalBackground.repeat};
          background-size: ${globalBackground.size};
          background-position: ${globalBackground.position};
          opacity: ${globalBackground.opacity};
          z-index: -1;
          pointer-events: none;
        }
      ` : '';

      // Header/Footer pour chaque page
      const headerFooterStyles = headerFooter.enabled ? `
        @page {
          margin: 4cm 0 3cm 0;
          margin-top: 6cm;
          size: A4;
          
          @top-left {
            content: element(header);
            width: 100%;
          }
          
          @bottom-left {
            content: element(footer);
            width: 100%;
          }
        }
        
        .page-header {
          position: running(header);
          text-align: left;
          padding: 0;
          margin: 0;
          width: 100%;
        }
        
        .page-footer {
          position: running(footer);
          text-align: left;
          padding: 0;
          margin: 0;
          width: 100%;
        }
        
        .header-content, .footer-content {
          display: block;
          width: 100%;
          margin: 0;
          padding: 0;
        }
        
        .header-logo, .footer-logo {
          width: 100%;
          height: auto;
          display: block;
          margin: 0;
          padding: 0;
        }
        
        .header-text, .footer-text {
          font-size: ${headerFooter.textSize};
          color: #2c3e50;
          font-weight: bold;
          padding: 10px 20px;
          display: block;
        }
      ` : `
        @page {
          margin: 4cm 2cm 2cm 2cm;
          margin-top: 4cm;
          size: A4;
        }
      `;

      const css = `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap');
        
        body {
          margin: 0;
          padding: 0;
          font-family: Georgia, 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', serif;
          line-height: 1.6;
          color: #2c3e50;
          background: white;
          position: relative;
          width: 100%;
          max-width: 210mm; /* A4 width */
        }
        
        /* Conteneur principal - A4 width */
        body > div {
          max-width: 210mm !important;
          width: 100%;
          margin: 0 auto;
          padding: 0 2cm !important;
          text-align: left !important;
          box-sizing: border-box;
        }
        
        ${backgroundStyles}
        
        ${headerFooterStyles}
        
        * {
          box-sizing: border-box;
        }
        
        /* FORCER l'alignement à gauche */
        div {
          text-align: left !important;
        }
        
        h1, h2, h3, h4, h5, h6 {
          text-align: left !important;
        }
        
        /* Support des emojis */
        span, h1, h2, h3, h4, h5, h6 {
          font-family: Georgia, 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', serif;
        }
      `;

      console.log('📄 Génération PDF avec HTML:', html.substring(0, 200));

      const response = await api.post('api/grapesjs-pdf-generator/', {
        html,
        css,
        company_info: {
          name: 'Invitation au Voyage',
          phone: '+33 1 23 45 67 89',
          email: 'contact@invitationauvoyage.fr',
        },
      }, {
        responseType: 'blob',
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
      console.error('❌ Erreur génération PDF:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour remplacer les emojis par du texte
  const replaceEmojisWithText = (text: string): string => {
    const emojiMap: Record<string, string> = {
      '✈️': '[Avion]',
      '🏨': '[Hotel]',
      '🚗': '[Transfert]',
      '🎯': '[Activites]',
      '💰': '[Prix]',
      '📞': 'Tel:',
      '✉️': 'Email:',
      '📍': 'Adresse:',
      '🌴': '[Palmier]',
      '🏖️': '[Plage]',
      '🏔️': '[Montagne]',
      '🌆': '[Ville]',
      '💡': '[Info]',
      '⚠️': '[Important]',
      '✓': 'v',
      '•': '-',
    };
    
    let result = text;
    Object.entries(emojiMap).forEach(([emoji, replacement]) => {
      result = result.replace(new RegExp(emoji, 'g'), replacement);
    });
    
    // Supprimer les autres emojis restants
    result = result.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    
    return result;
  };

  // Convertir les données Puck en HTML
  const convertPuckToHTML = (puckData: Data): string => {
    let html = '';
    
    // Ajouter Header/Footer si activé
    if (headerFooter.enabled) {
      // Header
      html += `
        <div class="page-header">
          <div class="header-content">
            ${headerFooter.headerLogo ? `<img src="${headerFooter.headerLogo}" class="header-logo" alt="Logo" />` : ''}
            ${headerFooter.headerText ? `<span class="header-text">${replaceEmojisWithText(headerFooter.headerText)}</span>` : ''}
          </div>
        </div>
      `;
      
      // Footer
      html += `
        <div class="page-footer">
          <div class="footer-content">
            ${headerFooter.footerLogo ? `<img src="${headerFooter.footerLogo}" class="footer-logo" alt="Logo" />` : ''}
            ${headerFooter.footerText ? `<span class="footer-text">${replaceEmojisWithText(headerFooter.footerText)}</span>` : ''}
          </div>
        </div>
      `;
    }
    
    html += '<div style="max-width: 800px; margin: 0; padding: 0; text-align: left;">';
    
    puckData.content.forEach((component: any) => {
      const props = component.props;
      
      switch (component.type) {
        case 'Hero':
          html += `
            <div style="padding: 10px 0 20px 0; text-align: ${props.align}; margin-bottom: 15px; border-bottom: 3px solid #667eea;">
              <h1 style="font-size: 38px; font-weight: bold; margin: 0 0 8px 0; color: #2c3e50;">${replaceEmojisWithText(props.title)}</h1>
              <p style="font-size: 17px; margin: 0; color: #7f8c8d;">${replaceEmojisWithText(props.subtitle)}</p>
            </div>
          `;
          break;
        
        case 'TravelSection':
          html += `
            <div style="padding: 20px 0; margin-bottom: 20px; border-bottom: 1px solid #e0e0e0;">
              <h2 style="font-size: 24px; font-weight: bold; margin: 0 0 12px 0; color: #2c3e50;">${replaceEmojisWithText(props.title)}</h2>
              <div style="font-size: 15px; line-height: 1.8; color: #34495e;">${replaceEmojisWithText(props.content.replace(/\n/g, '<br/>'))}</div>
            </div>
          `;
          break;
        
        case 'PriceCard':
          html += `
            <div style="padding: 30px 0; border-top: 2px solid #667eea; border-bottom: 2px solid #667eea; text-align: center; margin-bottom: 20px;">
              <h3 style="font-size: 24px; font-weight: bold; margin-bottom: 15px; color: #2c3e50;">${replaceEmojisWithText(props.title)}</h3>
              <div style="margin-bottom: 20px;">
                <span style="font-size: 42px; font-weight: bold; color: #667eea;">${props.price}</span>
                <span style="font-size: 20px; margin-left: 5px; color: #667eea;">${props.currency}</span>
              </div>
              ${props.features?.length > 0 ? `
                <ul style="list-style: none; padding: 0; text-align: left; font-size: 15px; line-height: 2; color: #34495e; max-width: 500px; margin: 0 auto;">
                  ${props.features.map((f: any) => `<li style="margin-bottom: 8px;">v ${replaceEmojisWithText(f.feature)}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          `;
          break;
        
        case 'TextBlock':
          html += `
            <div style="font-size: ${props.fontSize}px; line-height: 1.8; text-align: ${props.textAlign}; margin-bottom: 20px; color: #34495e;">
              ${replaceEmojisWithText(props.content.replace(/\n/g, '<br/>'))}
            </div>
          `;
          break;
        
        case 'PageBreak':
          html += `<div style="page-break-after: always; height: 0; margin: 0;"></div>`;
          break;
        
        case 'Divider':
          html += `<hr style="border: none; border-top: 2px ${props.style} ${props.color}; margin: ${props.spacing}px 0;" />`;
          break;
        
        case 'CalloutBox':
          html += `
            <div style="margin-bottom: 25px;">
              <div style="display: inline-block; background-color: ${props.titleBackgroundColor}; color: ${props.titleTextColor}; padding: 10px 20px; border-radius: 6px; margin-bottom: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
                <h3 style="font-size: 22px; font-weight: bold; margin: 0;">${replaceEmojisWithText(props.title)}</h3>
              </div>
              <div style="color: #34495e; padding: 0; font-size: 15px; line-height: 1.8;">
                ${replaceEmojisWithText(props.content.replace(/\n/g, '<br/>'))}
              </div>
            </div>
          `;
          break;
        
        case 'RichCalloutBox':
          html += `
            <div style="margin-bottom: 25px;">
              <div style="display: inline-block; background-color: ${props.titleBackgroundColor}; color: ${props.titleTextColor}; padding: 10px 20px; border-radius: 6px; margin-bottom: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
                <h3 style="font-size: 22px; font-weight: bold; margin: 0;">${replaceEmojisWithText(props.title)}</h3>
              </div>
              <div style="color: #34495e; font-size: 15px; line-height: 1.8;">
                ${props.paragraphs?.map((para: any) => `
                  <p style="margin-bottom: 12px;">
                    ${replaceEmojisWithText(para.text)}
                  </p>
                `).join('') || ''}
              </div>
            </div>
          `;
          break;
        
        case 'ContactInfo':
          html += `
            <div style="padding: 30px 0; margin-top: 40px; text-align: center; border-top: 2px solid #2c3e50;">
              <h3 style="font-size: 22px; font-weight: bold; margin-bottom: 15px; color: #2c3e50;">${replaceEmojisWithText(props.companyName)}</h3>
              <div style="font-size: 15px; line-height: 2; color: #34495e;">
                ${props.phone ? `<div>Tel: ${replaceEmojisWithText(props.phone)}</div>` : ''}
                ${props.email ? `<div>Email: ${replaceEmojisWithText(props.email)}</div>` : ''}
                ${props.address ? `<div>Adresse: ${replaceEmojisWithText(props.address)}</div>` : ''}
              </div>
            </div>
          `;
          break;
        
        case 'SingleImage':
          if (props.url) {
            html += `
              <div style="margin-bottom: 25px;">
                <img 
                  src="${props.url}" 
                  alt="${props.caption || 'Image'}"
                  style="
                    width: 100%;
                    height: ${props.height || 300}px;
                    object-fit: cover;
                    border-radius: ${props.borderRadius || 8}px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    display: block;
                  "
                />
                ${props.caption ? `
                  <p style="
                    text-align: center;
                    font-size: 14px;
                    margin-top: 10px;
                    color: #7f8c8d;
                    font-style: italic;
                  ">${replaceEmojisWithText(props.caption)}</p>
                ` : ''}
              </div>
            `;
          }
          break;
        
        case 'ImageGallery':
          if (props.images && Array.isArray(props.images) && props.images.length > 0) {
            const columns = props.columns || (props.images.length > 1 ? 2 : 1);
            // Utiliser flexbox au lieu de grid pour meilleure compatibilité PDF (WeasyPrint)
            const imageWidth = columns === 1 ? '100%' : '48%';
            html += `
              <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 30px; justify-content: flex-start;">
                ${props.images.map((img: any) => `
                  <div style="position: relative; width: ${imageWidth}; min-width: 200px;">
                    <img 
                      src="${img.url}" 
                      alt="${img.alt || img.caption || 'Image'}"
                      style="
                        width: 100%;
                        height: 250px;
                        object-fit: cover;
                        border-radius: 8px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                        display: block;
                      "
                    />
                    ${img.caption ? `
                      <p style="
                        text-align: center;
                        font-size: 12px;
                        margin-top: 8px;
                        color: #7f8c8d;
                        margin: 8px 0 0 0;
                      ">${replaceEmojisWithText(img.caption)}</p>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            `;
          }
          break;
      }
    });
    
    html += '</div>';
    return html;
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Toast de notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: toast.type === 'success' ? '#27ae60' : '#e74c3c',
          color: 'white',
          padding: '14px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          fontSize: '14px',
          fontWeight: '500',
          maxWidth: '360px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginLeft: 'auto', fontSize: '16px', lineHeight: 1 }}
          >×</button>
        </div>
      )}

      {/* Barre d'outils personnalisée */}
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
          🎨 Puck Editor - Générateur d'Offres Pro
        </h3>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {isLoading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f39c12',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '14px',
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid white',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              Chargement...
            </div>
          )}
          
          <button
            onClick={() => setShowDesignPanel(!showDesignPanel)}
            disabled={isLoading}
            style={{
              backgroundColor: '#e67e22',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            🖼️ Background
          </button>

          <button
            onClick={() => setShowJsonPreview(!showJsonPreview)}
            disabled={isLoading}
            style={{
              backgroundColor: '#9b59b6',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {showJsonPreview ? '🎨 Éditeur' : '💻 JSON'}
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
              fontWeight: 'bold',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            💾 Sauvegarder
          </button>
          
          <button
            onClick={handleGeneratePDF}
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
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            📄 Générer PDF
          </button>
        </div>
      </div>

      {/* Panneau de configuration Background */}
      {showDesignPanel && (
        <div style={{
          backgroundColor: '#ecf0f1',
          padding: '20px',
          borderBottom: '1px solid #bdc3c7',
        }}>
          <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#2c3e50' }}>
            🖼️ Background Global (toutes les pages)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>
                Image de fond :
              </label>
              <select
                value={globalBackground.image}
                onChange={(e) => setGlobalBackground({...globalBackground, image: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #bdc3c7',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="">Aucune</option>
                <option value="https://i.imgur.com/ZgV341i.jpeg">Image par défaut</option>
                <option value="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200">🏔️ Montagnes</option>
                <option value="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200">🏖️ Plage</option>
                <option value="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200">✈️ Avion</option>
                <option value="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200">🌆 Ville</option>
                <option value="https://images.unsplash.com/photo-1502933691298-84fc14542831?w=1200">🌴 Tropiques</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>
                Opacité : {globalBackground.opacity}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={globalBackground.opacity}
                onChange={(e) => setGlobalBackground({...globalBackground, opacity: parseFloat(e.target.value)})}
                style={{
                  width: '100%',
                }}
              />
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '3px' }}>
                0 = invisible, 1 = totalement visible
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>
                Répétition :
              </label>
              <select
                value={globalBackground.repeat}
                onChange={(e) => setGlobalBackground({...globalBackground, repeat: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #bdc3c7',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="repeat">Répéter (toutes directions)</option>
                <option value="repeat-y">Répéter verticalement</option>
                <option value="no-repeat">Pas de répétition</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>
                Taille :
              </label>
              <select
                value={globalBackground.size}
                onChange={(e) => setGlobalBackground({...globalBackground, size: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #bdc3c7',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="800px auto">800px (A4)</option>
                <option value="100% auto">100% largeur</option>
                <option value="cover">Couvrir (cover)</option>
                <option value="contain">Contenir (contain)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>
                Position :
              </label>
              <select
                value={globalBackground.position}
                onChange={(e) => setGlobalBackground({...globalBackground, position: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #bdc3c7',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="top center">Haut centré</option>
                <option value="center center">Centre</option>
                <option value="top left">Haut gauche</option>
                <option value="top right">Haut droite</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#d1ecf1', borderRadius: '4px', fontSize: '13px', color: '#0c5460' }}>
            💡 <strong>Astuce :</strong> Le background s'appliquera sur toutes les pages du PDF. Utilisez une opacité faible (0.05-0.15) pour ne pas gêner la lecture.
          </div>

          {/* Séparateur */}
          <hr style={{ margin: '30px 0', border: 'none', borderTop: '2px solid #bdc3c7' }} />

          {/* Section Header/Footer */}
          <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#2c3e50' }}>
            📋 Header & Footer (logo sur chaque page)
          </h4>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={headerFooter.enabled}
                onChange={(e) => setHeaderFooter({...headerFooter, enabled: e.target.checked})}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                Activer le header/footer automatique
              </span>
            </label>
          </div>

          {headerFooter.enabled && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>
                  Logo Header (en haut) :
                </label>
                <select
                  value={headerFooter.headerLogo}
                  onChange={(e) => setHeaderFooter({...headerFooter, headerLogo: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #bdc3c7',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Aucun logo</option>
                  <option value="https://i.imgur.com/ZgV341i.jpeg">Logo par défaut</option>
                  <option value="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=200">✈️ Avion</option>
                  <option value="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200">🏖️ Plage</option>
                  <option value="https://images.unsplash.com/photo-1502933691298-84fc14542831?w=200">🌴 Palmier</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>
                  Texte Header :
                </label>
                <input
                  type="text"
                  value={headerFooter.headerText}
                  onChange={(e) => setHeaderFooter({...headerFooter, headerText: e.target.value})}
                  placeholder="Nom de l'entreprise"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #bdc3c7',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>
                  Logo Footer (en bas) :
                </label>
                <select
                  value={headerFooter.footerLogo}
                  onChange={(e) => setHeaderFooter({...headerFooter, footerLogo: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #bdc3c7',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Aucun logo</option>
                  <option value="https://i.imgur.com/ZgV341i.jpeg">Logo par défaut</option>
                  <option value="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=200">✈️ Avion</option>
                  <option value="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200">🏖️ Plage</option>
                  <option value="https://images.unsplash.com/photo-1502933691298-84fc14542831?w=200">🌴 Palmier</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>
                  Texte Footer :
                </label>
                <input
                  type="text"
                  value={headerFooter.footerText}
                  onChange={(e) => setHeaderFooter({...headerFooter, footerText: e.target.value})}
                  placeholder="www.exemple.fr"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #bdc3c7',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>
                  Taille du logo :
                </label>
                <select
                  value={headerFooter.logoSize}
                  onChange={(e) => setHeaderFooter({...headerFooter, logoSize: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #bdc3c7',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="60px">Petit (60px)</option>
                  <option value="80px">Moyen (80px)</option>
                  <option value="100px">Grand (100px)</option>
                  <option value="120px">Très grand (120px)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>
                  Taille du texte :
                </label>
                <select
                  value={headerFooter.textSize}
                  onChange={(e) => setHeaderFooter({...headerFooter, textSize: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #bdc3c7',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="10px">Petit (10px)</option>
                  <option value="12px">Moyen (12px)</option>
                  <option value="14px">Grand (14px)</option>
                  <option value="16px">Très grand (16px)</option>
                </select>
              </div>
            </div>
          )}

          {headerFooter.enabled && (
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '13px', color: '#856404' }}>
              📋 <strong>Info :</strong> Le header/footer apparaîtra sur toutes les pages du PDF avec le logo et texte configurés.
            </div>
          )}
        </div>
      )}

      {/* Aperçu JSON */}
      {showJsonPreview && (
        <div style={{
          backgroundColor: '#ecf0f1',
          padding: '20px',
          borderBottom: '1px solid #bdc3c7',
          maxHeight: '300px',
          overflowY: 'auto',
        }}>
          <pre style={{
            backgroundColor: '#2c3e50',
            color: '#2ecc71',
            padding: '15px',
            borderRadius: '8px',
            fontSize: '12px',
            margin: 0,
            overflow: 'auto',
          }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      {/* Éditeur Puck */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        position: 'relative',
      }}>
        {/* Background global appliqué à la zone d'édition */}
        {globalBackground.image && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${globalBackground.image})`,
            backgroundRepeat: globalBackground.repeat,
            backgroundSize: globalBackground.size,
            backgroundPosition: globalBackground.position,
            opacity: globalBackground.opacity,
            pointerEvents: 'none',
            zIndex: 0,
          }} />
        )}
        
        {/* Header simulé (aperçu) - VERSION COMPACTE POUR L'ÉDITEUR */}
        {headerFooter.enabled && (
          <div style={{
            backgroundColor: '#ecf0f1',
            padding: '12px 20px',
            margin: '0 0 20px 0',
            borderBottom: '2px solid #95a5a6',
            borderRadius: '4px',
            fontSize: '13px',
            color: '#7f8c8d',
            textAlign: 'center',
          }}>
            📄 <strong>Header (visible dans le PDF)</strong>
            {headerFooter.headerLogo && (
              <div style={{ marginTop: '8px' }}>
                <img 
                  src={headerFooter.headerLogo} 
                  alt="Logo Header" 
                  style={{ 
                    maxWidth: '500px',
                    maxHeight: '100px',
                    height: 'auto', 
                    display: 'inline-block',
                    margin: '0 auto',
                  }} 
                />
              </div>
            )}
            {headerFooter.headerText && (
              <span style={{ 
                fontSize: '12px',
                color: '#7f8c8d',
                marginTop: '8px',
                display: 'block',
              }}>
                {headerFooter.headerText}
              </span>
            )}
          </div>
        )}
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Puck
            config={config}
            data={data}
            onPublish={(newData: Data) => {
              setData(newData);
              console.log('📝 Données publiées:', newData);
            }}
            onChange={(newData: Data) => {
              setData(newData);
            }}
          />
        </div>
        
        {/* Footer simulé (aperçu) - VERSION COMPACTE POUR L'ÉDITEUR */}
        {headerFooter.enabled && (
          <div style={{
            backgroundColor: '#ecf0f1',
            padding: '12px 20px',
            margin: '20px 0 0 0',
            borderTop: '2px solid #95a5a6',
            borderRadius: '4px',
            fontSize: '13px',
            color: '#7f8c8d',
            textAlign: 'center',
          }}>
            📄 <strong>Footer (visible dans le PDF)</strong>
            {headerFooter.footerLogo && (
              <div style={{ marginTop: '8px' }}>
                <img 
                  src={headerFooter.footerLogo} 
                  alt="Logo Footer" 
                  style={{ 
                    maxWidth: '500px',
                    maxHeight: '100px',
                    height: 'auto', 
                    display: 'inline-block',
                    margin: '0 auto',
                  }} 
                />
              </div>
            )}
            {headerFooter.footerText && (
              <span style={{ 
                fontSize: '12px',
                color: '#7f8c8d',
                marginTop: '8px',
                display: 'block',
              }}>
                {headerFooter.footerText}
              </span>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Personnalisation Puck */
        .Puck-root {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }
        
        .Puck-preview {
          background-color: #ffffff !important;
          padding: 40px !important;
        }
        
        /* Afficher le hint de suppression au survol des images */
        .single-image-block:hover .delete-hint {
          opacity: 1 !important;
        }
        
        /* Style pour les composants sélectionnés dans Puck */
        .Puck-preview [data-rbd-draggable-id]:hover {
          outline: 2px solid #667eea !important;
          outline-offset: 4px;
        }
      `}</style>
    </div>
  );
};

export default PuckEditor;


