import type { ElementDefinition } from '../types';

class ElementRegistry {
  private defs = new Map<string, ElementDefinition>();

  register(def: ElementDefinition) { this.defs.set(def.type, def); }
  get(type: string) { return this.defs.get(type); }
  getAll() { return Array.from(this.defs.values()); }
  getByCategory(cat: ElementDefinition['category']) {
    return this.getAll().filter((d) => d.category === cat);
  }
  categories(): ElementDefinition['category'][] {
    return Array.from(new Set(this.getAll().map((d) => d.category)));
  }
}

export const registry = new ElementRegistry();

// ── Layout ────────────────────────────────────────────

registry.register({
  type: 'div',
  label: 'Div',
  icon: 'fa-solid fa-square',
  category: 'layout',
  canContain: true,
  allowedChildren: ['div', 'heading', 'text', 'image', 'button', 'spacer', 'logo', 'nav-menu', 'link', 'search', 'icon', 'social-icons', 'badge', 'divider', 'video', 'gallery', 'accordion', 'tabs', 'post-title', 'post-content', 'post-excerpt', 'post-meta', 'featured-image', 'breadcrumbs', 'shortcode'],
  defaultProps: {
    divType: 'div',
  },
  defaultStyles: {
    display: 'flex',
    gap: '20px',
    padding: '10px',
  },
});

// ── Basic ─────────────────────────────────────────────

registry.register({
  type: 'heading',
  label: 'Heading',
  icon: 'fa-solid fa-heading',
  category: 'basic',
  canContain: false,
  defaultProps: {
    text: 'New Heading',
    tag: 'h2',
  },
  defaultStyles: {
    color: '#1e293b',
    fontSize: '32px',
    fontWeight: '700',
    textAlign: 'left',
    margin: '0',
  },
});

registry.register({
  type: 'text',
  label: 'Paragraph',
  icon: 'fa-solid fa-paragraph',

  category: 'basic',
  canContain: false,
  defaultProps: {
    content: 'Enter your text here...',
  },
  defaultStyles: {
    color: '#475569',
    fontSize: '16px',
    lineHeight: '1.7',
    textAlign: 'left',
    margin: '0',
  },
});

registry.register({
  type: 'image',
  label: 'Image',
  icon: 'fa-solid fa-image',
  category: 'basic',
  canContain: false,
  defaultProps: {
    src: '',
    alt: '',
  },
  defaultStyles: {
    width: '100%',
    borderRadius: '8px',
    objectFit: 'cover',
  },
});

registry.register({
  type: 'button',
  label: 'Button',
  icon: 'fa-solid fa-hand-pointer',
  category: 'basic',
  canContain: false,
  defaultProps: {
    text: 'Click Here',
    url: '#',
  },
  defaultStyles: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '12px 30px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-block',
    textAlign: 'center',
  },
});

registry.register({
  type: 'spacer',
  label: 'Spacer',
  icon: 'fa-solid fa-arrows-up-down',
  category: 'basic',
  canContain: false,
  defaultProps: {},
  defaultStyles: {
    height: '40px',
  },
});

registry.register({
  type: 'logo',
  label: 'Logo',
  icon: 'fa-solid fa-circle-dot',
  category: 'basic',
  canContain: false,
  defaultProps: {
    src: '',
    alt: 'Site Logo',
    url: '/',
  },
  defaultStyles: {
    width: '160px',
    height: 'auto',
    display: 'block',
  },
});

registry.register({
  type: 'nav-menu',
  label: 'Nav Menu',
  icon: 'fa-solid fa-bars',
  category: 'basic',
  canContain: false,
  defaultProps: {
    menuId: '',
    menuName: 'Main Menu',
    mobileBreakpoint: '768',
    layout: 'horizontal',
    toggleIcon: 'fa-solid fa-bars',
    closeIcon: 'fa-solid fa-xmark',
    mobileStyle: 'drawer',
    linkColor: '',
    linkHoverColor: '',
    activeColor: '',
    toggleColor: '',
    toggleSize: '24px',
    dropdownBg: '#ffffff',
    dropdownShadow: 'true',
  },
  defaultStyles: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '24px',
    fontSize: '16px',
    fontWeight: '500',
  },
});

registry.register({
  type: 'link',
  label: 'Link',
  icon: 'fa-solid fa-link',
  category: 'basic',
  canContain: false,
  defaultProps: {
    text: 'New Link',
    url: '#',
    target: '_self',
  },
  defaultStyles: {
    color: '#2563eb',
    fontSize: '16px',
    textDecoration: 'none',
    display: 'inline-block',
  },
});

registry.register({
  type: 'search',
  label: 'Search',
  icon: 'fa-solid fa-magnifying-glass',
  category: 'basic',
  canContain: false,
  defaultProps: {
    placeholder: 'Search...',
    action: '/?s=',
  },
  defaultStyles: {
    width: '280px',
    height: '42px',
    padding: '0 14px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    fontSize: '14px',
  },
});

registry.register({
  type: 'icon',
  label: 'Icon',
  icon: 'fa-solid fa-star',
  category: 'basic',
  canContain: false,
  defaultProps: {
    icon: 'fa-solid fa-star',
    url: '',
    ariaLabel: '',
  },
  defaultStyles: {
    fontSize: '24px',
    color: '#1e293b',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

registry.register({
  type: 'social-icons',
  label: 'Social Icons',
  icon: 'fa-solid fa-share-nodes',
  category: 'basic',
  canContain: false,
  defaultProps: {
    icons: [
      {
        platform: 'facebook',
        url: '#',
      },
      {
        platform: 'twitter',
        url: '#',
      },
      {
        platform: 'instagram',
        url: '#',
      },
    ],
  },
  defaultStyles: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '20px',
  },
});

registry.register({
  type: 'badge',
  label: 'Badge',
  icon: 'fa-solid fa-certificate',
  category: 'basic',
  canContain: false,
  defaultProps: {
    text: 'New',
  },
  defaultStyles: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '999px',
    backgroundColor: '#9333ea',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '600',
  },
});

registry.register({
  type: 'divider',
  label: 'Divider',
  icon: 'fa-solid fa-minus',
  category: 'basic',
  canContain: false,
  defaultProps: {},
  defaultStyles: {
    width: '100%',
    height: '1px',
    backgroundColor: '#e2e8f0',
    margin: '20px 0',
  },
});

// ── Media ────────────────────────────────────────────

registry.register({
  type: 'video',
  label: 'Video',
  icon: 'fa-solid fa-video',
  category: 'media',
  canContain: false,
  defaultProps: {
    src: '',
    poster: '',
    autoplay: 'false',
    loop: 'false',
    muted: 'false',
    controls: 'true',
  },
  defaultStyles: {
    width: '100%',
    borderRadius: '8px',
    aspectRatio: '16/9',
  },
});

registry.register({
  type: 'gallery',
  label: 'Gallery',
  icon: 'fa-solid fa-images',
  category: 'media',
  canContain: false,
  defaultProps: {
    images: [],
    columns: '3',
    gap: '8px',
  },
  defaultStyles: {
    width: '100%',
  },
});

// ── Interactive ──────────────────────────────────────

registry.register({
  type: 'accordion',
  label: 'Accordion',
  icon: 'fa-solid fa-bars-staggered',
  category: 'interactive',
  canContain: false,
  defaultProps: {
    items: [
      { title: 'Accordion Item 1', content: 'Content for item 1', open: true },
      { title: 'Accordion Item 2', content: 'Content for item 2', open: false },
      { title: 'Accordion Item 3', content: 'Content for item 3', open: false },
    ],
    allowMultiple: 'false',
    iconOpen: 'fa-solid fa-chevron-up',
    iconClosed: 'fa-solid fa-chevron-down',
  },
  defaultStyles: {
    width: '100%',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    overflow: 'hidden',
  },
});

registry.register({
  type: 'tabs',
  label: 'Tabs',
  icon: 'fa-solid fa-folder',
  category: 'interactive',
  canContain: false,
  defaultProps: {
    items: [
      { title: 'Tab 1', content: 'Content for tab 1' },
      { title: 'Tab 2', content: 'Content for tab 2' },
      { title: 'Tab 3', content: 'Content for tab 3' },
    ],
    activeIndex: '0',
  },
  defaultStyles: {
    width: '100%',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    overflow: 'hidden',
  },
});

// ── WordPress ────────────────────────────────────────

registry.register({
  type: 'post-title',
  label: 'Post Title',
  icon: 'fa-solid fa-font',
  category: 'wordpress',
  canContain: false,
  defaultProps: {
    tag: 'h1',
    linkToPost: 'false',
  },
  defaultStyles: {
    color: '#1e293b',
    fontSize: '36px',
    fontWeight: '700',
    textAlign: 'left',
    margin: '0',
  },
});

registry.register({
  type: 'post-content',
  label: 'Post Content',
  icon: 'fa-solid fa-file-lines',
  category: 'wordpress',
  canContain: false,
  defaultProps: {},
  defaultStyles: {
    color: '#475569',
    fontSize: '16px',
    lineHeight: '1.7',
  },
});

registry.register({
  type: 'post-excerpt',
  label: 'Post Excerpt',
  icon: 'fa-solid fa-align-left',
  category: 'wordpress',
  canContain: false,
  defaultProps: {
    wordCount: '30',
  },
  defaultStyles: {
    color: '#64748b',
    fontSize: '16px',
    lineHeight: '1.6',
  },
});

registry.register({
  type: 'post-meta',
  label: 'Post Meta',
  icon: 'fa-solid fa-circle-info',
  category: 'wordpress',
  canContain: false,
  defaultProps: {
    showDate: 'true',
    showAuthor: 'true',
    showCategory: 'true',
    separator: ' · ',
  },
  defaultStyles: {
    color: '#94a3b8',
    fontSize: '14px',
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
});

registry.register({
  type: 'featured-image',
  label: 'Featured Image',
  icon: 'fa-solid fa-image',
  category: 'wordpress',
  canContain: false,
  defaultProps: {
    linkToPost: 'false',
    size: 'large',
  },
  defaultStyles: {
    width: '100%',
    borderRadius: '8px',
    objectFit: 'cover',
  },
});

registry.register({
  type: 'breadcrumbs',
  label: 'Breadcrumbs',
  icon: 'fa-solid fa-angles-right',
  category: 'wordpress',
  canContain: false,
  defaultProps: {
    separator: '/',
    showHome: 'true',
    homeLabel: 'Home',
  },
  defaultStyles: {
    fontSize: '14px',
    color: '#64748b',
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
});

registry.register({
  type: 'shortcode',
  label: 'Shortcode',
  icon: 'fa-solid fa-code',
  category: 'wordpress',
  canContain: false,
  defaultProps: {
    shortcode: '',
  },
  defaultStyles: {
    width: '100%',
  },
});

export const CATEGORY_LABELS: Record<string, string> = {
  layout: 'Layout',
  basic: 'Basic',
  media: 'Media',
  interactive: 'Interactive',
  wordpress: 'WordPress',
};
