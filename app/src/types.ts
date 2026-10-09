export interface ElementSettings {
  [key: string]: unknown;
}

export interface BuilderElement {
  id: string;
  type: string;
  props: ElementSettings;
  styles: ElementSettings;
  children: BuilderElement[];
}

export type DevicePreview = 'desktop' | 'tablet' | 'mobile';
export type PanelView = 'elements' | 'structure' | 'templates' | 'components';
export type InspectorTab = 'content' | 'style';

export interface ElementDefinition {
  type: string;
  label: string;
  icon: string;
  category: 'layout' | 'basic' | 'media' | 'interactive' | 'wordpress';
  defaultProps: ElementSettings;
  defaultStyles: ElementSettings;
  canContain: boolean;
  allowedChildren?: string[];
}

export interface Template {
  id: string;
  name: string;
  category: 'page' | 'section' | 'block';
  elements: BuilderElement[];
  created: number;
  updated?: number;
  builtin?: boolean;
  thumbnail?: string;
}

export interface MeshcahTemplateJSON {
  version: number;
  type: 'meshcah-template';
  name: string;
  category: Template['category'];
  elements: BuilderElement[];
  created: number;
  metadata?: {
    meshcahVersion?: string;
    elementCount?: number;
    elementTypes?: string[];
  };
}

export interface PageListItem {
  id: number;
  title: string;
  status: string;
  type: string;
  editUrl: string;
  viewUrl: string;
}

export interface ComponentDefinition {
  id: string;
  name: string;
  elements: BuilderElement[];
  created: number;
}

export interface GlobalStyles {
  colors: Record<string, string>;
  fonts: Record<string, string>;
  spacing: Record<string, string>;
}

export const DEFAULT_GLOBAL_STYLES: GlobalStyles = {
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    text: '#1e293b',
    background: '#ffffff',
    muted: '#f1f5f9',
    border: '#e2e8f0',
  },
  fonts: {
    heading: "'Segoe UI', Tahoma, sans-serif",
    body: "'Segoe UI', Tahoma, sans-serif",
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '32px',
    xl: '64px',
  },
};

export interface EditorConfig {
  postId: number;
  restUrl: string;
  nonce: string;
  elements: BuilderElement[];
}

declare global {
  interface Window {
    alawiEditorConfig?: EditorConfig;
  }
}
