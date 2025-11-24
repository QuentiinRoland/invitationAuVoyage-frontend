import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';

interface EditableImageProps {
  src?: string;
  alt?: string;
  width?: string;
  height?: string;
  borderRadius?: string;
  margin?: string;
}

export const EditableImage: UserComponent<EditableImageProps> = ({ 
  src = 'https://via.placeholder.com/600x400',
  alt = 'Image',
  width = '100%',
  height = 'auto',
  borderRadius = '12px',
  margin = '20px 0',
}) => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div
      ref={(ref: HTMLDivElement | null) => {
        if (ref) connect(drag(ref));
      }}
      style={{ textAlign: 'center', margin }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          maxWidth: width,
          height,
          borderRadius,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      />
    </div>
  );
};

(EditableImage as any).craft = {
  displayName: 'Image',
  props: {
    src: 'https://via.placeholder.com/600x400',
    alt: 'Image',
    width: '100%',
    height: 'auto',
    borderRadius: '12px',
    margin: '20px 0',
  },
  related: {
    toolbar: () => import('./EditableImageSettings').then((mod) => mod.EditableImageSettings),
  },
};

