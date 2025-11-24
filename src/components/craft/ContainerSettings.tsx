import React from 'react';
import { useNode } from '@craftjs/core';

export const ContainerSettings = () => {
  const { actions: { setProp }, background, padding, margin, borderRadius } = useNode((node) => ({
    background: node.data.props.background,
    padding: node.data.props.padding,
    margin: node.data.props.margin,
    borderRadius: node.data.props.borderRadius,
  }));

  return (
    <div style={{ padding: '10px' }}>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
          Fond
        </label>
        <input
          type="text"
          value={background}
          onChange={(e) => setProp((props: any) => props.background = e.target.value)}
          placeholder="ex: #fff ou transparent"
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
          placeholder="ex: 20px"
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
          placeholder="ex: 20px 0"
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
          placeholder="ex: 8px"
          style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>
    </div>
  );
};


