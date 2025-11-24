import React from 'react';
import { useNode } from '@craftjs/core';

export const TravelSectionSettings = () => {
  const { actions: { setProp }, title, icon, borderColor, backgroundColor } = useNode((node) => ({
    title: node.data.props.title,
    icon: node.data.props.icon,
    borderColor: node.data.props.borderColor,
    backgroundColor: node.data.props.backgroundColor,
  }));

  return (
    <div style={{ padding: '10px' }}>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
          Titre
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setProp((props: any) => props.title = e.target.value)}
          style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
          Icône
        </label>
        <select
          value={icon}
          onChange={(e) => setProp((props: any) => props.icon = e.target.value)}
          style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="✈️">✈️ Avion</option>
          <option value="🏨">🏨 Hôtel</option>
          <option value="💰">💰 Prix</option>
          <option value="🚗">🚗 Transport</option>
          <option value="🎯">🎯 Activités</option>
          <option value="📌">📌 Général</option>
        </select>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
          Couleur bandeau
        </label>
        <input
          type="color"
          value={borderColor}
          onChange={(e) => setProp((props: any) => props.borderColor = e.target.value)}
          style={{ width: '100%', height: '40px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
          Couleur de fond
        </label>
        <input
          type="text"
          value={backgroundColor}
          onChange={(e) => setProp((props: any) => props.backgroundColor = e.target.value)}
          placeholder="transparent ou #fff"
          style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>
    </div>
  );
};


