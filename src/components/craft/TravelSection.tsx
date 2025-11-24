import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';

interface TravelSectionProps {
  title?: string;
  icon?: string;
  borderColor?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}

export const TravelSection: UserComponent<TravelSectionProps> = ({ 
  title = 'Section de voyage',
  icon = '✈️',
  borderColor = '#F5E6A8',
  backgroundColor = 'transparent',
  children
}) => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div
      ref={(ref: HTMLDivElement | null) => {
        if (ref) connect(drag(ref));
      }}
      style={{
        background: backgroundColor,
        padding: '20px 0',
        margin: '25px 0',
        position: 'relative',
      }}
    >
      <div style={{
        background: `linear-gradient(90deg, ${borderColor} 0%, #E8D78F 100%)`,
        padding: '8px 15px',
        margin: '0 0 20px 0',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#2C3E50',
        display: 'inline-block',
        fontFamily: 'Georgia, serif'
      }}>
        {icon} {title}
      </div>
      <div style={{
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#2C3E50',
        textAlign: 'justify',
      }}>
        {children}
      </div>
    </div>
  );
};

(TravelSection as any).craft = {
  displayName: 'Section Voyage',
  props: {
    title: 'Section de voyage',
    icon: '✈️',
    borderColor: '#F5E6A8',
    backgroundColor: 'transparent',
  },
  related: {
    toolbar: () => import('./TravelSectionSettings').then((mod) => mod.TravelSectionSettings),
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
};

