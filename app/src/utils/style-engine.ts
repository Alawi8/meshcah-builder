import type { BuilderElement, DevicePreview } from '../types';

export interface ResponsiveValue {
  desktop: string;
  tablet?: string;
  mobile?: string;
}

const BREAKPOINTS = {
  tablet: 768,
  mobile: 480,
};

export function isResponsive(val: unknown): val is ResponsiveValue {
  return typeof val === 'object' && val !== null && 'desktop' in val;
}

export function getDeviceValue(val: unknown, device: DevicePreview): string {
  if (isResponsive(val)) {
    if (device === 'mobile' && val.mobile) return val.mobile;
    if (device === 'tablet' && val.tablet) return val.tablet;
    return val.desktop;
  }
  return (val as string) ?? '';
}

export function makeResponsive(val: unknown, device: DevicePreview, newValue: string): ResponsiveValue | string {
  if (isResponsive(val)) {
    return { ...val, [device]: newValue };
  }
  if (device === 'desktop') return newValue;
  return {
    desktop: (val as string) ?? '',
    [device]: newValue,
  };
}

const CSS_PROP_MAP: Record<string, string> = {
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  lineHeight: 'line-height',
  textAlign: 'text-align',
  backgroundColor: 'background-color',
  backgroundImage: 'background-image',
  backgroundSize: 'background-size',
  backgroundPosition: 'background-position',
  borderRadius: 'border-radius',
  maxWidth: 'max-width',
  flexDirection: 'flex-direction',
  objectFit: 'object-fit',
  textDecoration: 'text-decoration',
};

function toCssProp(key: string): string {
  return CSS_PROP_MAP[key] || key.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
}

function buildCssBlock(selector: string, props: Record<string, string>): string {
  const entries = Object.entries(props).filter(([, v]) => v);
  if (entries.length === 0) return '';
  return `${selector}{${entries.map(([k, v]) => `${k}:${v}`).join(';')}}`;
}

export function generateElementCss(el: BuilderElement): string {
  const selector = `.ab-r-${el.id}`;
  const desktopProps: Record<string, string> = {};
  const tabletProps: Record<string, string> = {};
  const mobileProps: Record<string, string> = {};

  const styles = el.styles;
  for (const [key, val] of Object.entries(styles)) {
    if (key === 'cssClass' || key === 'cssId') continue;
    const cssProp = toCssProp(key);
    if (isResponsive(val)) {
      const wrap = (v: string) => cssProp === 'background-image' && v && !v.startsWith('url(') && !v.startsWith('linear-') && !v.startsWith('radial-') ? `url(${v})` : v;
      if (val.desktop) desktopProps[cssProp] = wrap(val.desktop);
      if (val.tablet) tabletProps[cssProp] = wrap(val.tablet);
      if (val.mobile) mobileProps[cssProp] = wrap(val.mobile);
    } else if (typeof val === 'string' && val) {
      desktopProps[cssProp] = cssProp === 'background-image' && !val.startsWith('url(') && !val.startsWith('linear-') && !val.startsWith('radial-')
        ? `url(${val})` : val;
    }
  }

  let css = buildCssBlock(selector, desktopProps);
  const tabletBlock = buildCssBlock(selector, tabletProps);
  if (tabletBlock) css += `@media(max-width:${BREAKPOINTS.tablet}px){${tabletBlock}}`;
  const mobileBlock = buildCssBlock(selector, mobileProps);
  if (mobileBlock) css += `@media(max-width:${BREAKPOINTS.mobile}px){${mobileBlock}}`;

  if (el.type === 'nav-menu') {
    const bp = parseInt(el.props.mobileBreakpoint as string) || 768;
    const lc = (el.props.linkColor as string) || '';
    const lh = (el.props.linkHoverColor as string) || '';
    const ac = (el.props.activeColor as string) || '';
    const tc = (el.props.toggleColor as string) || '';
    const ts = (el.props.toggleSize as string) || '24px';
    const dbg = (el.props.dropdownBg as string) || '#ffffff';
    const vars: string[] = [`--ab-nm-bp:${bp}px`];
    if (lc) vars.push(`--ab-nm-link:${lc}`);
    if (lh) vars.push(`--ab-nm-hover:${lh}`);
    if (ac) vars.push(`--ab-nm-active:${ac}`);
    if (tc) vars.push(`--ab-nm-toggle:${tc}`);
    if (ts) vars.push(`--ab-nm-toggle-size:${ts}`);
    if (dbg) vars.push(`--ab-nm-dropdown-bg:${dbg}`);
    css += `${selector}{${vars.join(';')}}`;
    css += `@media(max-width:${bp}px){${selector} .ab-nm__toggle{display:flex}${selector} .ab-nm__drawer{display:none}${selector}.ab-nm--open .ab-nm__drawer{display:flex}}`;
  }

  for (const child of el.children) {
    css += generateElementCss(child);
  }

  return css;
}

export function generatePageCss(elements: BuilderElement[]): string {
  return elements.map(generateElementCss).join('');
}
