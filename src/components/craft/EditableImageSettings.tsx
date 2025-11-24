import React from 'react';
import { useNode } from '@craftjs/core';

export const EditableImageSettings = () => {
  const { actions: { setProp }, src, alt, width, height, borderRadius, margin } = useNode((node) => ({
    src: node.data.props.src,
    alt: node.data.props.alt,
    width: node.data.props.width,
    height: node.data.props.height,
    borderRadius: node.data.props.borderRadius,
    margin: node.data.props.margin,
  }));

  return (
    <div style={{ padding: '10px' }}>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
          URL de l'image
        </label>
        <input
          type="text"
          value={src}
          onChange={(e) => setProp((props: any) => props.src = e.target.value)}
          style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
          Texte alternatif
        </label>
        <input
          type="text"
          value={alt}
          onChange={(e) => setProp((props: any) => props.alt = e.target.value)}
          style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
          Largeur
        </label>
        <input
          type="text"
          value={width}
          onChange={(e) => setProp((props: any) => props.width = e.target.value)}
          placeholder="100% ou 500px"
          style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
          Border Radius
        </label>
        <input
          type="text"
          value={borderRadius}
          onChange={(e) => setProp((props: any) => props.borderRadius = e.target.value)}
          placeholder="12px"
          style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
          Marge
        </label>
        <input
          type="text"
          value={margin}
          onChange={(e) => setProp((props: any) => props.margin = e.target.value)}
          placeholder="20px 0"
          style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>
    </div>
  );
};


