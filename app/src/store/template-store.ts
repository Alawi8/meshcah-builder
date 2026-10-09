import { create } from 'zustand';
import type { Template, BuilderElement, MeshcahTemplateJSON, PageListItem } from '../types';
import { deepClone } from '../utils/tree';
import { generateId } from '../utils/id';
import { registry } from '../blocks/registry';

const TEMPLATE_VERSION = 1;

interface TemplateState {
  templates: Template[];
  loading: boolean;
  pages: PageListItem[];
  pagesLoading: boolean;

  loadTemplates: () => Promise<void>;
  saveTemplate: (name: string, category: Template['category'], elements: BuilderElement[]) => Promise<Template | null>;
  updateTemplate: (id: string, name: string, elements: BuilderElement[]) => Promise<void>;
  deleteTemplate: (id: string) => Promise<boolean>;
  duplicateTemplate: (id: string) => Promise<void>;

  exportTemplate: (tpl: Template) => MeshcahTemplateJSON;
  importTemplate: (json: string) => { success: boolean; error?: string; template?: Template };
  validateTemplateJSON: (data: unknown) => { valid: boolean; errors: string[]; warnings: string[] };

  loadPages: () => Promise<void>;
}

function getConfig() {
  return window.alawiEditorConfig as { restUrl: string; nonce: string; postId?: number } | undefined;
}

function countElements(els: BuilderElement[]): number {
  let count = 0;
  for (const el of els) {
    count += 1 + countElements(el.children);
  }
  return count;
}

function collectTypes(els: BuilderElement[]): string[] {
  const types = new Set<string>();
  function walk(items: BuilderElement[]) {
    for (const el of items) {
      types.add(el.type);
      walk(el.children);
    }
  }
  walk(els);
  return Array.from(types);
}

function reassignIds(els: BuilderElement[]): BuilderElement[] {
  return els.map((el) => ({
    ...el,
    id: generateId(),
    props: { ...el.props },
    styles: { ...el.styles },
    children: reassignIds(el.children),
  }));
}

function validateElementTree(els: unknown[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!Array.isArray(els)) {
    return { valid: false, errors: ['Elements must be an array'] };
  }
  function walk(items: unknown[], depth: number) {
    if (depth > 20) {
      errors.push('Element tree too deeply nested (max 20 levels)');
      return;
    }
    if (!Array.isArray(items)) return;
    for (let i = 0; i < items.length; i++) {
      const el = items[i] as Record<string, unknown>;
      if (!el || typeof el !== 'object') {
        errors.push(`Element at index ${i} is not an object`);
        continue;
      }
      if (!el.type || typeof el.type !== 'string') {
        errors.push(`Element missing valid "type" field`);
      }
      if (!el.props || typeof el.props !== 'object') {
        errors.push(`Element "${el.type}" missing "props" object`);
      }
      if (!el.styles || typeof el.styles !== 'object') {
        errors.push(`Element "${el.type}" missing "styles" object`);
      }
      if (el.children) {
        walk(el.children as unknown[], depth + 1);
      }
    }
  }
  walk(els, 0);
  return { valid: errors.length === 0, errors };
}

// ── Built-in Templates ──────────────────────────────────

const BUILTIN_TEMPLATES: Template[] = [
  {
    id: 'builtin_blank',
    name: 'Blank Page',
    category: 'page',
    builtin: true,
    created: 0,
    elements: [],
  },
  
  {
    id: 'builtin_homepage',
    name: 'Homepage',
    category: 'page',
    builtin: true,
    created: 0,
    elements: [

      // =========================
      // HERO
      // =========================
      {
        id: 'hp_hero',
        type: 'div', props: { divType: 'section' },
        styles: {
          padding: '110px 20px 120px',
          background: 'linear-gradient(135deg, #111827 0%, #1e1b4b 55%, #312e81 100%)',
          position: 'relative',
          overflow: 'hidden',
        },
        children: [
          {
            id: 'hp_hero_c',
            type: 'div', props: { divType: 'container' },
            styles: {
              maxWidth: '1100px',
              margin: '0 auto',
              textAlign: 'center',
            },
            children: [

              {
                id: 'hp_hero_badge',
                type: 'div',
                props: {},
                styles: {
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  marginBottom: '24px',
                  borderRadius: '999px',
                  backgroundColor: '#ffffff12',
                  border: '1px solid #ffffff1f',
                  color: '#c4b5fd',
                  fontSize: '14px',
                  fontWeight: '600',
                },
                children: [
                  {
                    id: 'hp_hero_badge_icon',
                    type: 'icon',
                    props: {
                      icon: 'fa-solid fa-sparkles',
                      size: '14px',
                    },
                    styles: {
                      color: '#a78bfa',
                    },
                    children: [],
                  },
                  {
                    id: 'hp_hero_badge_text',
                    type: 'text',
                    props: {
                      content: '<span>Introducing Meshcah Builder</span>',
                    },
                    styles: {},
                    children: [],
                  },
                ],
              },

              {
                id: 'hp_h1',
                type: 'heading',
                props: {
                  text: 'Build Beautiful Websites. Visually.',
                  tag: 'h1',
                },
                styles: {
                  fontSize: 'clamp(42px, 7vw, 72px)',
                  lineHeight: '1.05',
                  letterSpacing: '-2px',
                  color: '#ffffff',
                  maxWidth: '900px',
                  margin: '0 auto 24px',
                  fontWeight: '800',
                },
                children: [],
              },

              {
                id: 'hp_p',
                type: 'text',
                props: {
                  content: '<p>Design, customize, and launch professional WordPress websites with Meshcah — a powerful visual builder made for creators who want complete control without writing code.</p>',
                },
                styles: {
                  fontSize: '20px',
                  lineHeight: '1.7',
                  color: '#cbd5e1',
                  maxWidth: '720px',
                  margin: '0 auto 36px',
                },
                children: [],
              },

              {
                id: 'hp_hero_actions',
                type: 'div',
                props: {},
                styles: {
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '14px',
                  flexWrap: 'wrap',
                },
                children: [

                  {
                    id: 'hp_btn',
                    type: 'button',
                    props: {
                      text: 'Start Building Free',
                      url: '#features',
                    },
                    styles: {
                      backgroundColor: '#ffffff',
                      color: '#4f46e5',
                      padding: '15px 28px',
                      borderRadius: '10px',
                      fontWeight: '700',
                      fontSize: '16px',
                      border: 'none',
                      boxShadow: '0 10px 30px #00000030',
                    },
                    children: [],
                  },

                  {
                    id: 'hp_btn_secondary',
                    type: 'button',
                    props: {
                      text: 'Explore Features',
                      url: '#features',
                    },
                    styles: {
                      backgroundColor: '#ffffff10',
                      color: '#ffffff',
                      padding: '15px 28px',
                      borderRadius: '10px',
                      fontWeight: '600',
                      fontSize: '16px',
                      border: '1px solid #ffffff25',
                    },
                    children: [],
                  },

                ],
              },

              {
                id: 'hp_hero_note',
                type: 'text',
                props: {
                  content: '<p>No coding required · Built for WordPress · Fully responsive</p>',
                },
                styles: {
                  marginTop: '24px',
                  fontSize: '13px',
                  color: '#94a3b8',
                },
                children: [],
              },

            ],
          },
        ],
      },

      // =========================
      // TRUST BAR
      // =========================
      {
        id: 'hp_trust',
        type: 'div', props: { divType: 'section' },
        styles: {
          padding: '28px 20px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
        },
        children: [
          {
            id: 'hp_trust_c',
            type: 'div', props: { divType: 'container' },
            styles: {
              maxWidth: '1000px',
              margin: '0 auto',
            },
            children: [
              {
                id: 'hp_trust_text',
                type: 'text',
                props: {
                  content: '<p>Everything you need to build a modern WordPress website — without the unnecessary complexity.</p>',
                },
                styles: {
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '15px',
                  margin: '0',
                },
                children: [],
              },
            ],
          },
        ],
      },

      // =========================
      // FEATURES
      // =========================
      {
        id: 'hp_features',
        type: 'div', props: { divType: 'section' },
        styles: {
          padding: '100px 20px',
          backgroundColor: '#f8fafc',
        },
        children: [
          {
            id: 'hp_fc',
            type: 'div', props: { divType: 'container' },
            styles: {
              maxWidth: '1100px',
              margin: '0 auto',
            },
            children: [

              {
                id: 'hp_f_label',
                type: 'text',
                props: {
                  content: '<p>POWERFUL FEATURES</p>',
                },
                styles: {
                  textAlign: 'center',
                  color: '#6366f1',
                  fontSize: '13px',
                  fontWeight: '800',
                  letterSpacing: '1.5px',
                  marginBottom: '12px',
                },
                children: [],
              },

              {
                id: 'hp_fh',
                type: 'heading',
                props: {
                  text: 'Everything You Need to Build Better',
                  tag: 'h2',
                },
                styles: {
                  fontSize: '42px',
                  lineHeight: '1.15',
                  textAlign: 'center',
                  color: '#0f172a',
                  margin: '0 auto 16px',
                  fontWeight: '800',
                  letterSpacing: '-1px',
                },
                children: [],
              },

              {
                id: 'hp_fsub',
                type: 'text',
                props: {
                  content: '<p>From your first section to a complete website, Meshcah gives you the tools to build exactly what you imagine.</p>',
                },
                styles: {
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '18px',
                  lineHeight: '1.7',
                  maxWidth: '680px',
                  margin: '0 auto 55px',
                },
                children: [],
              },

              {
                id: 'hp_fg',
                type: 'div',
                props: {},
                styles: {
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '24px',
                },
                children: [

                  // Feature 1
                  {
                    id: 'hp_f1',
                    type: 'div',
                    props: {},
                    styles: {
                      padding: '34px',
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 20px #0f172a08',
                    },
                    children: [
                      {
                        id: 'hp_f1i',
                        type: 'icon',
                        props: {
                          icon: 'fa-solid fa-bolt',
                          size: '22px',
                        },
                        styles: {
                          color: '#6366f1',
                          marginBottom: '22px',
                        },
                        children: [],
                      },
                      {
                        id: 'hp_f1h',
                        type: 'heading',
                        props: {
                          text: 'Fast & Modern',
                          tag: 'h3',
                        },
                        styles: {
                          fontSize: '21px',
                          color: '#0f172a',
                          marginBottom: '10px',
                          fontWeight: '700',
                        },
                        children: [],
                      },
                      {
                        id: 'hp_f1p',
                        type: 'text',
                        props: {
                          content: '<p>Build lightweight, modern pages with a clean architecture designed for performance.</p>',
                        },
                        styles: {
                          color: '#64748b',
                          lineHeight: '1.7',
                          fontSize: '15px',
                        },
                        children: [],
                      },
                    ],
                  },

                  // Feature 2
                  {
                    id: 'hp_f2',
                    type: 'div',
                    props: {},
                    styles: {
                      padding: '34px',
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 20px #0f172a08',
                    },
                    children: [
                      {
                        id: 'hp_f2i',
                        type: 'icon',
                        props: {
                          icon: 'fa-solid fa-layer-group',
                          size: '22px',
                        },
                        styles: {
                          color: '#8b5cf6',
                          marginBottom: '22px',
                        },
                        children: [],
                      },
                      {
                        id: 'hp_f2h',
                        type: 'heading',
                        props: {
                          text: 'Visual Builder',
                          tag: 'h3',
                        },
                        styles: {
                          fontSize: '21px',
                          color: '#0f172a',
                          marginBottom: '10px',
                          fontWeight: '700',
                        },
                        children: [],
                      },
                      {
                        id: 'hp_f2p',
                        type: 'text',
                        props: {
                          content: '<p>Design visually with intuitive sections, containers, elements, and complete layout control.</p>',
                        },
                        styles: {
                          color: '#64748b',
                          lineHeight: '1.7',
                          fontSize: '15px',
                        },
                        children: [],
                      },
                    ],
                  },

                  // Feature 3
                  {
                    id: 'hp_f3',
                    type: 'div',
                    props: {},
                    styles: {
                      padding: '34px',
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 20px #0f172a08',
                    },
                    children: [
                      {
                        id: 'hp_f3i',
                        type: 'icon',
                        props: {
                          icon: 'fa-solid fa-mobile-screen',
                          size: '22px',
                        },
                        styles: {
                          color: '#ec4899',
                          marginBottom: '22px',
                        },
                        children: [],
                      },
                      {
                        id: 'hp_f3h',
                        type: 'heading',
                        props: {
                          text: 'Fully Responsive',
                          tag: 'h3',
                        },
                        styles: {
                          fontSize: '21px',
                          color: '#0f172a',
                          marginBottom: '10px',
                          fontWeight: '700',
                        },
                        children: [],
                      },
                      {
                        id: 'hp_f3p',
                        type: 'text',
                        props: {
                          content: '<p>Create layouts that look polished across desktops, tablets, and mobile devices.</p>',
                        },
                        styles: {
                          color: '#64748b',
                          lineHeight: '1.7',
                          fontSize: '15px',
                        },
                        children: [],
                      },
                    ],
                  },

                  // Feature 4
                  {
                    id: 'hp_f4',
                    type: 'div',
                    props: {},
                    styles: {
                      padding: '34px',
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 20px #0f172a08',
                    },
                    children: [
                      {
                        id: 'hp_f4i',
                        type: 'icon',
                        props: {
                          icon: 'fa-solid fa-code',
                          size: '22px',
                        },
                        styles: {
                          color: '#0ea5e9',
                          marginBottom: '22px',
                        },
                        children: [],
                      },
                      {
                        id: 'hp_f4h',
                        type: 'heading',
                        props: {
                          text: 'Clean & Flexible',
                          tag: 'h3',
                        },
                        styles: {
                          fontSize: '21px',
                          color: '#0f172a',
                          marginBottom: '10px',
                          fontWeight: '700',
                        },
                        children: [],
                      },
                      {
                        id: 'hp_f4p',
                        type: 'text',
                        props: {
                          content: '<p>Keep your design system organized while maintaining complete control over every element.</p>',
                        },
                        styles: {
                          color: '#64748b',
                          lineHeight: '1.7',
                          fontSize: '15px',
                        },
                        children: [],
                      },
                    ],
                  },

                  // Feature 5
                  {
                    id: 'hp_f5',
                    type: 'div',
                    props: {},
                    styles: {
                      padding: '34px',
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 20px #0f172a08',
                    },
                    children: [
                      {
                        id: 'hp_f5i',
                        type: 'icon',
                        props: {
                          icon: 'fa-solid fa-sliders',
                          size: '22px',
                        },
                        styles: {
                          color: '#f59e0b',
                          marginBottom: '22px',
                        },
                        children: [],
                      },
                      {
                        id: 'hp_f5h',
                        type: 'heading',
                        props: {
                          text: 'Complete Control',
                          tag: 'h3',
                        },
                        styles: {
                          fontSize: '21px',
                          color: '#0f172a',
                          marginBottom: '10px',
                          fontWeight: '700',
                        },
                        children: [],
                      },
                      {
                        id: 'hp_f5p',
                        type: 'text',
                        props: {
                          content: '<p>Fine-tune spacing, typography, colors, layouts, and styles without fighting the builder.</p>',
                        },
                        styles: {
                          color: '#64748b',
                          lineHeight: '1.7',
                          fontSize: '15px',
                        },
                        children: [],
                      },
                    ],
                  },

                  // Feature 6
                  {
                    id: 'hp_f6',
                    type: 'div',
                    props: {},
                    styles: {
                      padding: '34px',
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 20px #0f172a08',
                    },
                    children: [
                      {
                        id: 'hp_f6i',
                        type: 'icon',
                        props: {
                          icon: 'fa-solid fa-palette',
                          size: '22px',
                        },
                        styles: {
                          color: '#10b981',
                          marginBottom: '22px',
                        },
                        children: [],
                      },
                      {
                        id: 'hp_f6h',
                        type: 'heading',
                        props: {
                          text: 'Made for Creators',
                          tag: 'h3',
                        },
                        styles: {
                          fontSize: '21px',
                          color: '#0f172a',
                          marginBottom: '10px',
                          fontWeight: '700',
                        },
                        children: [],
                      },
                      {
                        id: 'hp_f6p',
                        type: 'text',
                        props: {
                          content: '<p>Build your own visual language and create websites that feel genuinely yours.</p>',
                        },
                        styles: {
                          color: '#64748b',
                          lineHeight: '1.7',
                          fontSize: '15px',
                        },
                        children: [],
                      },
                    ],
                  },

                ],
              },
            ],
          },
        ],
      },

      // =========================
      // SHOWCASE
      // =========================
      {
        id: 'hp_showcase',
        type: 'div', props: { divType: 'section' },
        styles: {
          padding: '110px 20px',
          backgroundColor: '#ffffff',
        },
        children: [
          {
            id: 'hp_showcase_c',
            type: 'div', props: { divType: 'container' },
            styles: {
              maxWidth: '1050px',
              margin: '0 auto',
            },
            children: [

              {
                id: 'hp_showcase_grid',
                type: 'div',
                props: {},
                styles: {
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '70px',
                  alignItems: 'center',
                },
                children: [

                  {
                    id: 'hp_showcase_content',
                    type: 'div',
                    props: {},
                    styles: {},
                    children: [

                      {
                        id: 'hp_showcase_label',
                        type: 'text',
                        props: {
                          content: '<p>DESIGN WITHOUT LIMITS</p>',
                        },
                        styles: {
                          color: '#6366f1',
                          fontSize: '13px',
                          fontWeight: '800',
                          letterSpacing: '1.5px',
                          marginBottom: '14px',
                        },
                        children: [],
                      },

                      {
                        id: 'hp_showcase_h',
                        type: 'heading',
                        props: {
                          text: 'Your Website. Your Rules.',
                          tag: 'h2',
                        },
                        styles: {
                          fontSize: '42px',
                          lineHeight: '1.15',
                          color: '#0f172a',
                          fontWeight: '800',
                          letterSpacing: '-1px',
                          marginBottom: '20px',
                        },
                        children: [],
                      },

                      {
                        id: 'hp_showcase_p',
                        type: 'text',
                        props: {
                          content: '<p>Meshcah gives you the freedom to create layouts the way you actually want them — from simple landing pages to complete WordPress websites.</p>',
                        },
                        styles: {
                          color: '#64748b',
                          fontSize: '17px',
                          lineHeight: '1.8',
                          marginBottom: '28px',
                        },
                        children: [],
                      },

                      {
                        id: 'hp_showcase_list',
                        type: 'div',
                        props: {},
                        styles: {
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                        },
                        children: [
                          {
                            id: 'hp_check1',
                            type: 'text',
                            props: {
                              content: '<p>✓ Visual drag & drop editing</p>',
                            },
                            styles: {
                              color: '#334155',
                              fontSize: '15px',
                              fontWeight: '600',
                              margin: '0',
                            },
                            children: [],
                          },
                          {
                            id: 'hp_check2',
                            type: 'text',
                            props: {
                              content: '<p>✓ Responsive controls</p>',
                            },
                            styles: {
                              color: '#334155',
                              fontSize: '15px',
                              fontWeight: '600',
                              margin: '0',
                            },
                            children: [],
                          },
                          {
                            id: 'hp_check3',
                            type: 'text',
                            props: {
                              content: '<p>✓ Powerful element system</p>',
                            },
                            styles: {
                              color: '#334155',
                              fontSize: '15px',
                              fontWeight: '600',
                              margin: '0',
                            },
                            children: [],
                          },
                          {
                            id: 'hp_check4',
                            type: 'text',
                            props: {
                              content: '<p>✓ Built directly for WordPress</p>',
                            },
                            styles: {
                              color: '#334155',
                              fontSize: '15px',
                              fontWeight: '600',
                              margin: '0',
                            },
                            children: [],
                          },
                        ],
                      },

                    ],
                  },

                  {
                    id: 'hp_showcase_visual',
                    type: 'div',
                    props: {},
                    styles: {
                      minHeight: '380px',
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
                      border: '1px solid #e0e7ff',
                      boxShadow: '0 25px 60px #4f46e51a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '35px',
                    },
                    children: [

                      {
                        id: 'hp_mockup',
                        type: 'div',
                        props: {},
                        styles: {
                          width: '100%',
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          boxShadow: '0 15px 40px #0f172a18',
                          overflow: 'hidden',
                        },
                        children: [

                          {
                            id: 'hp_mockup_top',
                            type: 'div',
                            props: {},
                            styles: {
                              height: '38px',
                              backgroundColor: '#f8fafc',
                              borderBottom: '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0 14px',
                              gap: '6px',
                            },
                            children: [
                              {
                                id: 'hp_dot1',
                                type: 'div',
                                props: {},
                                styles: {
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  backgroundColor: '#cbd5e1',
                                },
                                children: [],
                              },
                              {
                                id: 'hp_dot2',
                                type: 'div',
                                props: {},
                                styles: {
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  backgroundColor: '#cbd5e1',
                                },
                                children: [],
                              },
                              {
                                id: 'hp_dot3',
                                type: 'div',
                                props: {},
                                styles: {
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  backgroundColor: '#cbd5e1',
                                },
                                children: [],
                              },
                            ],
                          },

                          {
                            id: 'hp_mockup_body',
                            type: 'div',
                            props: {},
                            styles: {
                              height: '270px',
                              padding: '30px',
                              backgroundColor: '#ffffff',
                            },
                            children: [
                              {
                                id: 'hp_mockup_title',
                                type: 'div',
                                props: {},
                                styles: {
                                  width: '65%',
                                  height: '18px',
                                  borderRadius: '5px',
                                  backgroundColor: '#e2e8f0',
                                  marginBottom: '14px',
                                },
                                children: [],
                              },
                              {
                                id: 'hp_mockup_line',
                                type: 'div',
                                props: {},
                                styles: {
                                  width: '85%',
                                  height: '10px',
                                  borderRadius: '5px',
                                  backgroundColor: '#f1f5f9',
                                  marginBottom: '30px',
                                },
                                children: [],
                              },
                              {
                                id: 'hp_mockup_cards',
                                type: 'div',
                                props: {},
                                styles: {
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(3, 1fr)',
                                  gap: '12px',
                                },
                                children: [
                                  {
                                    id: 'hp_mock_card1',
                                    type: 'div',
                                    props: {},
                                    styles: {
                                      height: '120px',
                                      borderRadius: '8px',
                                      backgroundColor: '#eef2ff',
                                    },
                                    children: [],
                                  },
                                  {
                                    id: 'hp_mock_card2',
                                    type: 'div',
                                    props: {},
                                    styles: {
                                      height: '120px',
                                      borderRadius: '8px',
                                      backgroundColor: '#f5f3ff',
                                    },
                                    children: [],
                                  },
                                  {
                                    id: 'hp_mock_card3',
                                    type: 'div',
                                    props: {},
                                    styles: {
                                      height: '120px',
                                      borderRadius: '8px',
                                      backgroundColor: '#fdf2f8',
                                    },
                                    children: [],
                                  },
                                ],
                              },
                            ],
                          },

                        ],
                      },

                    ],
                  },

                ],
              },

            ],
          },
        ],
      },

      // =========================
      // CTA
      // =========================
      {
        id: 'hp_cta',
        type: 'div', props: { divType: 'section' },
        styles: {
          padding: '90px 20px',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        },
        children: [
          {
            id: 'hp_ctac',
            type: 'div', props: { divType: 'container' },
            styles: {
              maxWidth: '800px',
              margin: '0 auto',
              textAlign: 'center',
            },
            children: [

              {
                id: 'hp_ctah',
                type: 'heading',
                props: {
                  text: 'Ready to Build Something Great?',
                  tag: 'h2',
                },
                styles: {
                  fontSize: '42px',
                  lineHeight: '1.15',
                  color: '#ffffff',
                  margin: '0 0 18px',
                  fontWeight: '800',
                  letterSpacing: '-1px',
                },
                children: [],
              },

              {
                id: 'hp_ctap',
                type: 'text',
                props: {
                  content: '<p>Start creating beautiful WordPress websites with Meshcah today.</p>',
                },
                styles: {
                  color: '#ede9fe',
                  fontSize: '18px',
                  lineHeight: '1.7',
                  margin: '0 auto 32px',
                },
                children: [],
              },

              {
                id: 'hp_ctab',
                type: 'button',
                props: {
                  text: 'Start Building',
                  url: '#',
                },
                styles: {
                  backgroundColor: '#ffffff',
                  color: '#5b21b6',
                  padding: '16px 34px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '16px',
                  border: 'none',
                  boxShadow: '0 10px 30px #00000025',
                },
                children: [],
              },

              {
                id: 'hp_ctanote',
                type: 'text',
                props: {
                  content: '<p>No credit card required.</p>',
                },
                styles: {
                  color: '#ddd6fe',
                  fontSize: '13px',
                  marginTop: '18px',
                },
                children: [],
              },

            ],
          },
        ],
      },

    ],
  },
  {
    id: 'builtin_blog',
    name: 'Blog',
    category: 'page',
    builtin: true,
    created: 0,
    elements: [
      {
        id: 'blog_hero', type: 'div', props: { divType: 'section' }, children: [
          {
            id: 'blog_hc', type: 'div', props: { divType: 'container' }, styles: { textAlign: 'center' }, children: [
              { id: 'blog_h1', type: 'heading', props: { text: 'Blog', tag: 'h1' }, styles: { fontSize: '42px', marginBottom: '12px' }, children: [] },
              { id: 'blog_p', type: 'text', props: { content: '<p>Latest articles, news, and insights.</p>' }, styles: { color: '#64748b', fontSize: '18px' }, children: [] },
            ]
          },
        ],
        styles: { padding: '60px 20px', backgroundColor: '#f8fafc' },
      },
      {
        id: 'blog_loop', type: 'div', props: { divType: 'section', queryEnabled: true, queryPostType: 'post', queryPerPage: '6', paginationType: 'numeric' }, children: [
          {
            id: 'blog_lc', type: 'div', props: { divType: 'container' }, styles: {}, children: [
              { id: 'blog_fi', type: 'featured-image', props: { size: 'medium_large' }, styles: { marginBottom: '16px', borderRadius: '8px', overflow: 'hidden' }, children: [] },
              { id: 'blog_pt', type: 'post-title', props: { tag: 'h2', linkToPost: true }, styles: { fontSize: '24px', marginBottom: '8px' }, children: [] },
              { id: 'blog_pm', type: 'post-meta', props: { showDate: true, showAuthor: true, showCategory: true }, styles: { marginBottom: '12px' }, children: [] },
              { id: 'blog_pe', type: 'post-excerpt', props: { length: '30' }, styles: { color: '#475569' }, children: [] },
            ]
          },
        ],
        styles: { padding: '60px 20px' },
      },
    ],
  },
  {
    id: 'builtin_single_post',
    name: 'Single Post',
    category: 'page',
    builtin: true,
    created: 0,
    elements: [
      {
        id: 'sp_main', type: 'div', props: { divType: 'section' }, children: [
          {
            id: 'sp_c', type: 'div', props: { divType: 'container' }, styles: { maxWidth: '800px' }, children: [
              { id: 'sp_bc', type: 'breadcrumbs', props: {}, styles: { marginBottom: '20px' }, children: [] },
              { id: 'sp_title', type: 'post-title', props: { tag: 'h1' }, styles: { fontSize: '40px', marginBottom: '12px' }, children: [] },
              { id: 'sp_meta', type: 'post-meta', props: { showDate: true, showAuthor: true, showCategory: true }, styles: { marginBottom: '24px', color: '#64748b' }, children: [] },
              { id: 'sp_img', type: 'featured-image', props: { size: 'large' }, styles: { marginBottom: '30px', borderRadius: '8px', overflow: 'hidden' }, children: [] },
              { id: 'sp_content', type: 'post-content', props: {}, styles: { lineHeight: '1.8', fontSize: '17px' }, children: [] },
            ]
          },
        ],
        styles: { padding: '40px 20px' },
      },
    ],
  },
  {
    id: 'builtin_archive',
    name: 'Archive',
    category: 'page',
    builtin: true,
    created: 0,
    elements: [
      {
        id: 'ar_header', type: 'div', props: { divType: 'section' }, children: [
          {
            id: 'ar_hc', type: 'div', props: { divType: 'container' }, styles: { textAlign: 'center' }, children: [
              { id: 'ar_h1', type: 'heading', props: { text: 'Archive', tag: 'h1' }, styles: { fontSize: '36px', marginBottom: '12px' }, children: [] },
            ]
          },
        ],
        styles: { padding: '50px 20px', backgroundColor: '#f8fafc' },
      },
      {
        id: 'ar_loop', type: 'div', props: { divType: 'section', queryEnabled: true, queryPostType: 'post', queryPerPage: '10', paginationType: 'numeric' }, children: [
          {
            id: 'ar_lc', type: 'div', props: { divType: 'container' }, styles: {}, children: [
              { id: 'ar_pt', type: 'post-title', props: { tag: 'h2', linkToPost: true }, styles: { fontSize: '22px', marginBottom: '6px' }, children: [] },
              { id: 'ar_pm', type: 'post-meta', props: { showDate: true, showAuthor: true }, styles: { marginBottom: '8px' }, children: [] },
              { id: 'ar_pe', type: 'post-excerpt', props: { length: '25' }, styles: { color: '#475569', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }, children: [] },
            ]
          },
        ],
        styles: { padding: '40px 20px' },
      },
    ],
  },
  {
    id: 'builtin_search',
    name: 'Search Results',
    category: 'page',
    builtin: true,
    created: 0,
    elements: [
      {
        id: 'sr_header', type: 'div', props: { divType: 'section' }, children: [
          {
            id: 'sr_hc', type: 'div', props: { divType: 'container' }, styles: { textAlign: 'center' }, children: [
              { id: 'sr_h1', type: 'heading', props: { text: 'Search Results', tag: 'h1' }, styles: { fontSize: '36px', marginBottom: '16px' }, children: [] },
              { id: 'sr_search', type: 'search', props: { placeholder: 'Search...' }, styles: { maxWidth: '500px', margin: '0 auto' }, children: [] },
            ]
          },
        ],
        styles: { padding: '50px 20px', backgroundColor: '#f8fafc' },
      },
      {
        id: 'sr_loop', type: 'div', props: { divType: 'section', queryEnabled: true, queryPostType: 'post', queryPerPage: '10', paginationType: 'standard' }, children: [
          {
            id: 'sr_lc', type: 'div', props: { divType: 'container' }, styles: {}, children: [
              { id: 'sr_pt', type: 'post-title', props: { tag: 'h3', linkToPost: true }, styles: { fontSize: '20px', marginBottom: '6px' }, children: [] },
              { id: 'sr_pe', type: 'post-excerpt', props: { length: '25' }, styles: { color: '#475569', marginBottom: '16px' }, children: [] },
            ]
          },
        ],
        styles: { padding: '40px 20px' },
      },
    ],
  },
  {
    id: 'builtin_404',
    name: '404 Page',
    category: 'page',
    builtin: true,
    created: 0,
    elements: [
      {
        id: 'e404_s', type: 'div', props: { divType: 'section' }, children: [
          {
            id: 'e404_c', type: 'div', props: { divType: 'container' }, styles: { textAlign: 'center' }, children: [
              { id: 'e404_h', type: 'heading', props: { text: '404', tag: 'h1' }, styles: { fontSize: '120px', color: '#2563eb', lineHeight: '1' }, children: [] },
              { id: 'e404_t', type: 'heading', props: { text: 'Page Not Found', tag: 'h2' }, styles: { fontSize: '28px', marginBottom: '16px', color: '#1e293b' }, children: [] },
              { id: 'e404_p', type: 'text', props: { content: '<p>The page you are looking for does not exist or has been moved.</p>' }, styles: { color: '#64748b', fontSize: '18px', marginBottom: '30px' }, children: [] },
              { id: 'e404_b', type: 'button', props: { text: 'Back to Home', url: '/' }, styles: { backgroundColor: '#2563eb', color: '#ffffff', padding: '14px 32px', borderRadius: '8px', fontWeight: '600' }, children: [] },
            ]
          },
        ],
        styles: { padding: '100px 20px', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
      },
    ],
  },
  {
    id: 'builtin_header',
    name: 'Header',
    category: 'section',
    builtin: true,
    created: 0,
    elements: [
      {
        id: 'hdr_s',
        type: 'div', props: { divType: 'section' },
        styles: {
          padding: '16px 24px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
        },
        children: [
          {
            id: 'hdr_c',
            type: 'div', props: { divType: 'container' },
            styles: {
              maxWidth: '1200px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '32px',
            },
            children: [

              // =========================
              // LOGO
              // =========================
              {
                id: 'hdr_logo_wrap',
                type: 'div',
                props: {},
                styles: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flexShrink: '0',
                },
                children: [

                  {
                    id: 'hdr_logo_mark',
                    type: 'div',
                    props: {},
                    styles: {
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 6px 16px rgba(79, 70, 229, 0.25)',
                    },
                    children: [
                      {
                        id: 'hdr_logo_icon',
                        type: 'icon',
                        props: {
                          icon: 'fa-solid fa-layer-group',
                          size: '17px',
                        },
                        styles: {
                          color: '#ffffff',
                        },
                        children: [],
                      },
                    ],
                  },

                  {
                    id: 'hdr_logo',
                    type: 'heading',
                    props: {
                      text: 'Meshcah',
                      tag: 'h3',
                    },
                    styles: {
                      fontSize: '22px',
                      lineHeight: '1',
                      fontWeight: '800',
                      color: '#0f172a',
                      letterSpacing: '-0.5px',
                      margin: '0',
                    },
                    children: [],
                  },

                ],
              },

              // =========================
              // NAVIGATION
              // =========================
              {
                id: 'hdr_nav',
                type: 'div',
                props: {},
                styles: {
                  display: 'flex',
                  gap: '30px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: '1',
                },
                children: [

                  {
                    id: 'hdr_l1',
                    type: 'link',
                    props: {
                      text: 'Home',
                      url: '/',
                    },
                    styles: {
                      color: '#4f46e5',
                      fontWeight: '600',
                      fontSize: '14px',
                      textDecoration: 'none',
                    },
                    children: [],
                  },

                  {
                    id: 'hdr_l2',
                    type: 'link',
                    props: {
                      text: 'Features',
                      url: '#features',
                    },
                    styles: {
                      color: '#475569',
                      fontWeight: '500',
                      fontSize: '14px',
                      textDecoration: 'none',
                    },
                    children: [],
                  },

                  {
                    id: 'hdr_l3',
                    type: 'link',
                    props: {
                      text: 'About',
                      url: '/about',
                    },
                    styles: {
                      color: '#475569',
                      fontWeight: '500',
                      fontSize: '14px',
                      textDecoration: 'none',
                    },
                    children: [],
                  },

                  {
                    id: 'hdr_l4',
                    type: 'link',
                    props: {
                      text: 'Blog',
                      url: '/blog',
                    },
                    styles: {
                      color: '#475569',
                      fontWeight: '500',
                      fontSize: '14px',
                      textDecoration: 'none',
                    },
                    children: [],
                  },

                ],
              },

              // =========================
              // ACTIONS
              // =========================
              {
                id: 'hdr_actions',
                type: 'div',
                props: {},
                styles: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexShrink: '0',
                },
                children: [

                  {
                    id: 'hdr_login',
                    type: 'link',
                    props: {
                      text: 'Log in',
                      url: '/login',
                    },
                    styles: {
                      color: '#334155',
                      fontWeight: '600',
                      fontSize: '14px',
                      padding: '10px 12px',
                      textDecoration: 'none',
                    },
                    children: [],
                  },

                  {
                    id: 'hdr_btn',
                    type: 'button',
                    props: {
                      text: 'Get Started',
                      url: '#',
                    },
                    styles: {
                      backgroundColor: '#4f46e5',
                      color: '#ffffff',
                      padding: '11px 20px',
                      borderRadius: '9px',
                      fontWeight: '700',
                      fontSize: '14px',
                      border: 'none',
                      boxShadow: '0 6px 16px rgba(79, 70, 229, 0.20)',
                    },
                    children: [],
                  },

                ],
              },

            ],
          },
        ],
      },
    ],
  },
  {
    id: 'builtin_footer',
    name: 'Footer',
    category: 'section',
    builtin: true,
    created: 0,
    elements: [
      {
        id: 'ftr_s', type: 'div', props: { divType: 'section' }, children: [
          {
            id: 'ftr_c', type: 'div', props: { divType: 'container' }, styles: { textAlign: 'center' }, children: [
              {
                id: 'ftr_nav', type: 'div', props: {}, styles: { display: 'flex', gap: '24px', justifyContent: 'center', marginBottom: '20px' }, children: [
                  { id: 'ftr_l1', type: 'link', props: { text: 'Home', url: '/' }, styles: { color: 'rgba(255,255,255,.7)' }, children: [] },
                  { id: 'ftr_l2', type: 'link', props: { text: 'About', url: '/about' }, styles: { color: 'rgba(255,255,255,.7)' }, children: [] },
                  { id: 'ftr_l3', type: 'link', props: { text: 'Blog', url: '/blog' }, styles: { color: 'rgba(255,255,255,.7)' }, children: [] },
                  { id: 'ftr_l4', type: 'link', props: { text: 'Contact', url: '/contact' }, styles: { color: 'rgba(255,255,255,.7)' }, children: [] },
                ]
              },
              { id: 'ftr_copy', type: 'text', props: { content: '<p>&copy; 2024 Your Website. All rights reserved.</p>' }, styles: { color: 'rgba(255,255,255,.5)', fontSize: '14px' }, children: [] },
            ]
          },
        ],
        styles: { padding: '40px 20px', backgroundColor: '#1e293b' },
      },
    ],
  },
  {
    id: 'builtin_contact',
    name: 'Contact',
    category: 'page',
    builtin: true,
    created: 0,
    elements: [
      {
        id: 'ct_hero', type: 'div', props: { divType: 'section' }, children: [
          {
            id: 'ct_hc', type: 'div', props: { divType: 'container' }, styles: { textAlign: 'center' }, children: [
              { id: 'ct_h1', type: 'heading', props: { text: 'Contact Us', tag: 'h1' }, styles: { fontSize: '42px', marginBottom: '12px' }, children: [] },
              { id: 'ct_p', type: 'text', props: { content: '<p>We would love to hear from you. Get in touch with us.</p>' }, styles: { color: '#64748b', fontSize: '18px' }, children: [] },
            ]
          },
        ],
        styles: { padding: '60px 20px', backgroundColor: '#f8fafc' },
      },
      {
        id: 'ct_body', type: 'div', props: { divType: 'section' }, children: [
          {
            id: 'ct_bc', type: 'div', props: { divType: 'container' }, styles: { maxWidth: '800px' }, children: [
              {
                id: 'ct_grid', type: 'div', props: {}, styles: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }, children: [
                  {
                    id: 'ct_info', type: 'div', props: {}, styles: {}, children: [
                      { id: 'ct_ih', type: 'heading', props: { text: 'Get in Touch', tag: 'h3' }, styles: { fontSize: '24px', marginBottom: '16px' }, children: [] },
                      { id: 'ct_it1', type: 'text', props: { content: '<p><strong>Email:</strong> hello@example.com</p>' }, styles: { marginBottom: '12px', color: '#475569' }, children: [] },
                      { id: 'ct_it2', type: 'text', props: { content: '<p><strong>Phone:</strong> +1 (555) 000-0000</p>' }, styles: { marginBottom: '12px', color: '#475569' }, children: [] },
                      { id: 'ct_it3', type: 'text', props: { content: '<p><strong>Address:</strong> 123 Main St, City, Country</p>' }, styles: { color: '#475569' }, children: [] },
                    ]
                  },
                  {
                    id: 'ct_form', type: 'div', props: {}, styles: { padding: '30px', backgroundColor: '#f8fafc', borderRadius: '8px' }, children: [
                      { id: 'ct_fh', type: 'heading', props: { text: 'Send a Message', tag: 'h3' }, styles: { fontSize: '24px', marginBottom: '16px' }, children: [] },
                      { id: 'ct_fp', type: 'text', props: { content: '<p>Use a contact form plugin or add your own form shortcode here.</p>' }, styles: { color: '#64748b' }, children: [] },
                    ]
                  },
                ]
              },
            ]
          },
        ],
        styles: { padding: '60px 20px' },
      },
    ],
  },
  {
    id: 'builtin_about',
    name: 'About',
    category: 'page',
    builtin: true,
    created: 0,
    elements: [
      {
        id: 'ab_hero', type: 'div', props: { divType: 'section' }, children: [
          {
            id: 'ab_hc', type: 'div', props: { divType: 'container' }, styles: { textAlign: 'center' }, children: [
              { id: 'ab_h1', type: 'heading', props: { text: 'About Us', tag: 'h1' }, styles: { fontSize: '42px', color: '#ffffff', marginBottom: '16px' }, children: [] },
              { id: 'ab_p', type: 'text', props: { content: '<p>Learn more about our mission, values, and team.</p>' }, styles: { color: '#ffffffcc', fontSize: '18px' }, children: [] },
            ]
          },
        ],
        styles: { padding: '80px 20px', backgroundColor: '#1e293b' },
      },
      {
        id: 'ab_body', type: 'div', props: { divType: 'section' }, children: [
          {
            id: 'ab_bc', type: 'div', props: { divType: 'container' }, styles: { maxWidth: '800px' }, children: [
              { id: 'ab_mh', type: 'heading', props: { text: 'Our Mission', tag: 'h2' }, styles: { fontSize: '32px', marginBottom: '16px' }, children: [] },
              { id: 'ab_mp', type: 'text', props: { content: '<p>We are dedicated to making website building accessible to everyone. Our visual builder empowers you to create professional websites without writing a single line of code.</p>' }, styles: { color: '#475569', lineHeight: '1.8', fontSize: '17px', marginBottom: '40px' }, children: [] },
              { id: 'ab_vh', type: 'heading', props: { text: 'Our Values', tag: 'h2' }, styles: { fontSize: '32px', marginBottom: '16px' }, children: [] },
              {
                id: 'ab_vg', type: 'div', props: {}, styles: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }, children: [
                  {
                    id: 'ab_v1', type: 'div', props: {}, styles: { padding: '24px', backgroundColor: '#f8fafc', borderRadius: '8px' }, children: [
                      { id: 'ab_v1h', type: 'heading', props: { text: 'Simplicity', tag: 'h3' }, styles: { fontSize: '20px', marginBottom: '8px' }, children: [] },
                      { id: 'ab_v1p', type: 'text', props: { content: '<p>We keep things simple and intuitive.</p>' }, styles: { color: '#64748b' }, children: [] },
                    ]
                  },
                  {
                    id: 'ab_v2', type: 'div', props: {}, styles: { padding: '24px', backgroundColor: '#f8fafc', borderRadius: '8px' }, children: [
                      { id: 'ab_v2h', type: 'heading', props: { text: 'Quality', tag: 'h3' }, styles: { fontSize: '20px', marginBottom: '8px' }, children: [] },
                      { id: 'ab_v2p', type: 'text', props: { content: '<p>We craft every detail with care.</p>' }, styles: { color: '#64748b' }, children: [] },
                    ]
                  },
                ]
              },
            ]
          },
        ],
        styles: { padding: '60px 20px' },
      },
    ],
  },
];

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  loading: false,
  pages: [],
  pagesLoading: false,

  async loadTemplates() {
    const config = getConfig();
    if (!config) return;
    set({ loading: true });
    try {
      const res = await fetch(`${config.restUrl}templates`, {
        headers: { 'X-WP-Nonce': config.nonce },
      });
      if (res.ok) {
        const data: Template[] = await res.json();
        const userTemplates = Array.isArray(data) ? data : [];
        const builtinIds = new Set(BUILTIN_TEMPLATES.map((b) => b.id));
        const filtered = userTemplates.filter((t) => !builtinIds.has(t.id));
        set({ templates: [...BUILTIN_TEMPLATES, ...filtered] });
      } else {
        set({ templates: [...BUILTIN_TEMPLATES] });
      }
    } catch {
      set({ templates: [...BUILTIN_TEMPLATES] });
    }
    set({ loading: false });
  },

  async saveTemplate(name, category, elements) {
    const config = getConfig();
    if (!config) return null;
    const template: Template = {
      id: generateId(),
      name,
      category,
      elements: reassignIds(elements),
      created: Date.now(),
    };
    try {
      const res = await fetch(`${config.restUrl}templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': config.nonce },
        body: JSON.stringify(template),
      });
      if (res.ok) {
        set((s) => ({ templates: [...s.templates, template] }));
        return template;
      }
    } catch { /* ignore */ }
    return null;
  },

  async updateTemplate(id, name, elements) {
    const config = getConfig();
    if (!config) return;
    const existing = get().templates.find((t) => t.id === id);
    if (!existing || existing.builtin) return;
    const updated: Template = { ...existing, name, elements: reassignIds(elements), updated: Date.now() };
    try {
      const res = await fetch(`${config.restUrl}templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': config.nonce },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        set((s) => ({ templates: s.templates.map((t) => t.id === id ? updated : t) }));
      }
    } catch { /* ignore */ }
  },

  async deleteTemplate(id) {
    const tpl = get().templates.find((t) => t.id === id);
    if (!tpl || tpl.builtin) return false;
    const config = getConfig();
    if (!config) return false;
    try {
      const res = await fetch(`${config.restUrl}templates/${id}`, {
        method: 'DELETE',
        headers: { 'X-WP-Nonce': config.nonce },
      });
      if (res.ok) {
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }));
        return true;
      }
    } catch { /* ignore */ }
    return false;
  },

  async duplicateTemplate(id) {
    const tpl = get().templates.find((t) => t.id === id);
    if (!tpl) return;
    await get().saveTemplate(`${tpl.name} (copy)`, tpl.category, tpl.elements);
  },

  exportTemplate(tpl) {
    const json: MeshcahTemplateJSON = {
      version: TEMPLATE_VERSION,
      type: 'meshcah-template',
      name: tpl.name,
      category: tpl.category,
      elements: tpl.elements,
      created: tpl.created || Date.now(),
      metadata: {
        meshcahVersion: '1.0.0',
        elementCount: countElements(tpl.elements),
        elementTypes: collectTypes(tpl.elements),
      },
    };
    return json;
  },

  validateTemplateJSON(data: unknown) {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Invalid JSON: not an object'], warnings };
    }

    const obj = data as Record<string, unknown>;

    if (obj.type !== 'meshcah-template') {
      errors.push('Missing or invalid "type" field — expected "meshcah-template"');
    }

    if (typeof obj.version !== 'number' || obj.version < 1) {
      errors.push('Missing or invalid "version" field');
    } else if (obj.version > TEMPLATE_VERSION) {
      warnings.push(`Template version ${obj.version} is newer than supported (${TEMPLATE_VERSION}). Some features may not work.`);
    }

    if (!obj.name || typeof obj.name !== 'string') {
      errors.push('Missing "name" field');
    }

    const validCats = ['page', 'section', 'block'];
    if (!obj.category || !validCats.includes(obj.category as string)) {
      errors.push(`Invalid "category" — expected one of: ${validCats.join(', ')}`);
    }

    if (!Array.isArray(obj.elements)) {
      errors.push('Missing "elements" array');
    } else {
      const tree = validateElementTree(obj.elements);
      errors.push(...tree.errors);

      const types = collectTypes(obj.elements as BuilderElement[]);
      const unsupported = types.filter((t) => !registry.get(t));
      if (unsupported.length > 0) {
        warnings.push(`Unsupported element types: ${unsupported.join(', ')}. They will be skipped.`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  },

  importTemplate(json: string) {
    let data: unknown;
    try {
      data = JSON.parse(json);
    } catch {
      return { success: false, error: 'Invalid JSON format' };
    }

    const validation = get().validateTemplateJSON(data);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join('; ') };
    }

    const obj = data as MeshcahTemplateJSON;

    const supportedTypes = new Set(registry.getAll().map((d) => d.type));
    function filterUnsupported(els: BuilderElement[]): BuilderElement[] {
      return els
        .filter((el) => supportedTypes.has(el.type))
        .map((el) => ({
          ...el,
          id: el.id || generateId(),
          props: el.props || {},
          styles: el.styles || {},
          children: filterUnsupported(el.children || []),
        }));
    }

    const cleanElements = reassignIds(filterUnsupported(obj.elements));

    const template: Template = {
      id: generateId(),
      name: obj.name,
      category: obj.category,
      elements: cleanElements,
      created: Date.now(),
    };

    return { success: true, template };
  },

  async loadPages() {
    const config = getConfig();
    if (!config) return;
    set({ pagesLoading: true });
    try {
      const res = await fetch(`${config.restUrl}pages-list`, {
        headers: { 'X-WP-Nonce': config.nonce },
      });
      if (res.ok) {
        const data = await res.json();
        set({ pages: Array.isArray(data) ? data : [] });
      }
    } catch { /* ignore */ }
    set({ pagesLoading: false });
  },
}));
