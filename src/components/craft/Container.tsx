import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';

interface ContainerProps {
  background?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  children?: React.ReactNode;
  className?: string;
}

export const Container: UserComponent<ContainerProps> = ({ 
  background = 'transparent',
  padding = '20px',
  margin = '20px 0',
  borderRadius = '0',
  children,
  className = ''
}) => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div
      ref={(ref: HTMLDivElement | null) => {
        if (ref) connect(drag(ref));
      }}
      style={{
        background,
        padding,
        margin,
        borderRadius,
        position: 'relative',
      }}
      className={className}
    >
      {children}
    </div>
  );
};

(Container as any).craft = {
  displayName: 'Container',
  props: {
    background: 'transparent',
    padding: '20px',
    margin: '20px 0',
    borderRadius: '0',
  },
  related: {
    toolbar: () => import('./ContainerSettings').then((mod) => mod.ContainerSettings),
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
  },
};

