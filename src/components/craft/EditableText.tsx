import React from 'react';
import { useNode, UserComponent } from '@craftjs/core';
// @ts-ignore - react-contenteditable n'a pas de types officiels
import ContentEditable from 'react-contenteditable';

interface EditableTextProps {
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: string;
  margin?: string;
  padding?: string;
  fontFamily?: string;
  className?: string;
}

export const EditableText: UserComponent<EditableTextProps> = ({ 
  text = 'Texte éditable',
  fontSize = 16,
  fontWeight = 'normal',
  color = '#2c3e50',
  textAlign = 'left',
  margin = '0',
  padding = '0',
  fontFamily = 'Georgia, serif',
  className = ''
}) => {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();

  return (
    <div
      ref={(ref: HTMLDivElement | null) => {
        if (ref) connect(drag(ref));
      }}
      style={{
        fontSize: `${fontSize}px`,
        fontWeight,
        color,
        textAlign: textAlign as any,
        margin,
        padding,
        fontFamily,
        cursor: 'pointer',
      }}
      className={className}
    >
      <ContentEditable
        html={text}
        onChange={(e: any) => {
          setProp((props: EditableTextProps) => props.text = e.target.value);
        }}
        tagName="div"
        style={{ outline: 'none' }}
      />
    </div>
  );
};

(EditableText as any).craft = {
  displayName: 'Texte',
  props: {
    text: 'Texte éditable',
    fontSize: 16,
    fontWeight: 'normal',
    color: '#2c3e50',
    textAlign: 'left',
    margin: '0',
    padding: '0',
    fontFamily: 'Georgia, serif',
  },
  related: {
    toolbar: () => {
      try {
        return import('./EditableTextSettings').then((mod) => mod.EditableTextSettings);
      } catch (error) {
        console.error('Error loading EditableTextSettings:', error);
        return () => null;
      }
    },
  },
};

