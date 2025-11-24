import React from 'react';
import { useNode } from '@craftjs/core';

export const EditableTextSettings = () => {
  const { actions: { setProp }, fontSize, fontWeight, color, textAlign, margin, padding } = useNode((node) => ({
    fontSize: node.data.props.fontSize,
    fontWeight: node.data.props.fontWeight,
    color: node.data.props.color,
    textAlign: node.data.props.textAlign,
    margin: node.data.props.margin,
    padding: node.data.props.padding,
  }));

  return (
    <div style={{ padding: '10px' }}>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
          Taille de police
        </label>
        <input
          type="number"
          value={fontSize}
          onChange={(e) => setProp((props: any) => props.fontSize = parseInt(e.target.value))}
          style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
          Couleur
        </label>
        <input
          type="color"
          value={color}
          onChange={(e) => setProp((props: any) => props.color = e.target.value)}
          style={{ width: '100%', height: '40px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
          Alignement
        </label>
        <select
          value={textAlign}
          onChange={(e) => setProp((props: any) => props.textAlign = e.target.value)}
          style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="left">Gauche</option>
          <option value="center">Centre</option>
          <option value="right">Droite</option>
          <option value="justify">Justifié</option>
        </select>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
          Graisse
        </label>
        <select
          value={fontWeight}
          onChange={(e) => setProp((props: any) => props.fontWeight = e.target.value)}
          style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="normal">Normal</option>
          <option value="bold">Gras</option>
          <option value="lighter">Léger</option>
        </select>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
          Marge
        </label>
        <input
          type="text"
          value={margin}
          onChange={(e) => setProp((props: any) => props.margin = e.target.value)}
          placeholder="ex: 10px 0"
          style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
          Padding
        </label>
        <input
          type="text"
          value={padding}
          onChange={(e) => setProp((props: any) => props.padding = e.target.value)}
          placeholder="ex: 10px"
          style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>
    </div>
  );
};


