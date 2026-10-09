import { useState, useMemo } from 'react';
import { useEditorStore } from '../../store/editor-store';
import { usePostDataStore } from '../../store/post-data-store';
import { registry } from '../../blocks/registry';
import { findElement } from '../../utils/tree';
import { getDeviceValue, isResponsive } from '../../utils/style-engine';
import { hasDynamicTag, resolveDynamicTags } from '../../utils/dynamic-data';
import { DynamicDataPicker } from './DynamicDataPicker';
import { SOCIAL_ICON_MAP } from '../Canvas/ElementRenderer';
import type { InspectorTab, BuilderElement, DevicePreview } from '../../types';

const tabs: { key: InspectorTab; label: string }[] = [
  { key: 'content', label: 'Content' },
  { key: 'style', label: 'Style' },
];

const NON_RESPONSIVE_KEYS = new Set(['cssClass', 'cssId']);

export function Inspector() {
  const selectedId = useEditorStore((s) => s.selectedId);
  const elements = useEditorStore((s) => s.elements);
  const tab = useEditorStore((s) => s.inspectorTab);
  const setTab = useEditorStore((s) => s.setInspectorTab);
  const updateProps = useEditorStore((s) => s.updateElementProps);
  const updateStyles = useEditorStore((s) => s.updateElementStyles);
  const updateResponsive = useEditorStore((s) => s.updateResponsiveStyle);
  const device = useEditorStore((s) => s.devicePreview);

  if (!selectedId) return null;
  const el = findElement(elements, selectedId);
  if (!el) return null;
  const def = registry.get(el.type);

  const commitStyle = useEditorStore((s) => s.commitStyleChange);

  const updateStyle = (k: string, v: string) => {
    if (NON_RESPONSIVE_KEYS.has(k) || device === 'desktop') {
      updateStyles(selectedId, { [k]: v });
    } else {
      updateResponsive(selectedId, k, v);
    }
  };

  return (
    <div className="ab-inspector">
      <div className="ab-inspector__header">
        <span className="ab-inspector__title">{def?.icon} {def?.label || el.type}</span>
        {device !== 'desktop' && <span className="ab-inspector__device-badge">{device === 'tablet' ? '📱' : '📲'}</span>}
      </div>
      <div className="ab-inspector__tabs">
        {tabs.map((t) => (
          <button key={t.key} className={`ab-inspector__tab ${tab === t.key ? 'ab-inspector__tab--active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="ab-inspector__body">
        {tab === 'content' && <ContentTab el={el} update={(k, v) => updateProps(selectedId, { [k]: v })} onCommit={commitStyle} />}
        {tab === 'style' && <StyleTab el={el} update={updateStyle} device={device} onCommit={commitStyle} updateStyles={(obj) => updateStyles(selectedId, obj)} />}
      </div>
    </div>
  );
}

function ContentTab({ el, update, onCommit }: { el: BuilderElement; update: (k: string, v: string) => void; onCommit: () => void }) {
  const p = el.props;
  const postData = usePostDataStore((s) => s.data);
  const dynHint = (val: unknown) => hasDynamicTag(val) ? (
    <span className="ab-dynamic__preview">{resolveDynamicTags(val as string, postData)}</span>
  ) : null;

  switch (el.type) {
    case 'heading':
      return <>
        <Field label="Text" value={p.text as string} onChange={(v) => update('text', v)} onBlur={onCommit} />
        <DynamicDataPicker propType="text" onInsert={(tag) => { update('text', ((p.text as string) || '') + tag); onCommit(); }} />
        {dynHint(p.text)}
        <Select label="Tag" value={p.tag as string} onChange={(v) => update('tag', v)}
          options={[['h1','H1'],['h2','H2'],['h3','H3'],['h4','H4'],['h5','H5'],['h6','H6']]} />
      </>;
    case 'text':
      return <>
        <Textarea label="Content" value={p.content as string} onChange={(v) => update('content', v)} onBlur={onCommit} />
        <DynamicDataPicker propType="html" onInsert={(tag) => { update('content', ((p.content as string) || '') + tag); onCommit(); }} />
        {dynHint(p.content)}
      </>;
    case 'image':
      return <>
        <Field label="Image URL" value={p.src as string} onChange={(v) => update('src', v)} onBlur={onCommit} placeholder="https://..." />
        <DynamicDataPicker propType="url" onInsert={(tag) => { update('src', tag); onCommit(); }} />
        {dynHint(p.src)}
        <Field label="Alt Text" value={p.alt as string} onChange={(v) => update('alt', v)} onBlur={onCommit} />
      </>;
    case 'button':
      return <>
        <Field label="Button Text" value={p.text as string} onChange={(v) => update('text', v)} onBlur={onCommit} />
        <DynamicDataPicker propType="text" onInsert={(tag) => { update('text', ((p.text as string) || '') + tag); onCommit(); }} />
        {dynHint(p.text)}
        <Field label="URL" value={p.url as string} onChange={(v) => update('url', v)} onBlur={onCommit} />
        <DynamicDataPicker propType="url" onInsert={(tag) => { update('url', tag); onCommit(); }} />
      </>;
    case 'section':
    case 'container':
    case 'div':
      return <DivContentTab el={el} update={update} onCommit={onCommit} />;
    case 'spacer':
      return null;
    case 'logo':
      return <>
        <Field label="Image URL" value={p.src as string} onChange={(v) => update('src', v)} onBlur={onCommit} placeholder="https://..." />
        <Field label="Alt Text" value={p.alt as string} onChange={(v) => update('alt', v)} onBlur={onCommit} />
        <Field label="Link URL" value={p.url as string} onChange={(v) => update('url', v)} onBlur={onCommit} placeholder="/" />
      </>;
    case 'nav-menu':
      return <NavMenuContentTab el={el} update={update} onCommit={onCommit} />;
    case 'link':
      return <>
        <Field label="Text" value={p.text as string} onChange={(v) => update('text', v)} onBlur={onCommit} />
        <DynamicDataPicker propType="text" onInsert={(tag) => { update('text', ((p.text as string) || '') + tag); onCommit(); }} />
        <Field label="URL" value={p.url as string} onChange={(v) => update('url', v)} onBlur={onCommit} />
        <DynamicDataPicker propType="url" onInsert={(tag) => { update('url', tag); onCommit(); }} />
        <Select label="Target" value={p.target as string} onChange={(v) => { update('target', v); onCommit(); }}
          options={[['_self','Same Window'],['_blank','New Window']]} />
      </>;
    case 'search':
      return <>
        <Field label="Placeholder" value={p.placeholder as string} onChange={(v) => update('placeholder', v)} onBlur={onCommit} />
      </>;
    case 'icon':
      return <>
        <IconPicker value={p.icon as string || 'fa-solid fa-star'} onChange={(v) => { update('icon', v); onCommit(); }} />
        <Field label="Link URL" value={p.url as string} onChange={(v) => update('url', v)} onBlur={onCommit} />
        <Field label="Aria Label" value={p.ariaLabel as string} onChange={(v) => update('ariaLabel', v)} onBlur={onCommit} />
      </>;
    case 'badge':
      return <>
        <Field label="Text" value={p.text as string} onChange={(v) => update('text', v)} onBlur={onCommit} />
      </>;
    case 'divider':
      return <p className="ab-field__hint">Horizontal divider line</p>;
    case 'video':
      return <>
        <Field label="Video URL" value={p.src as string} onChange={(v) => update('src', v)} onBlur={onCommit} placeholder="https://..." />
        <Field label="Poster Image" value={p.poster as string} onChange={(v) => update('poster', v)} onBlur={onCommit} placeholder="https://..." />
        <Checkbox label="Autoplay" checked={p.autoplay === 'true'} onChange={(v) => { update('autoplay', v ? 'true' : 'false'); onCommit(); }} />
        <Checkbox label="Loop" checked={p.loop === 'true'} onChange={(v) => { update('loop', v ? 'true' : 'false'); onCommit(); }} />
        <Checkbox label="Muted" checked={p.muted === 'true'} onChange={(v) => { update('muted', v ? 'true' : 'false'); onCommit(); }} />
        <Checkbox label="Controls" checked={p.controls !== 'false'} onChange={(v) => { update('controls', v ? 'true' : 'false'); onCommit(); }} />
      </>;
    case 'gallery':
      return <>
        <GalleryEditor images={Array.isArray(p.images) ? p.images as { src: string; alt?: string }[] : []} onChange={(imgs) => { update('images', imgs as unknown as string); onCommit(); }} />
        <Select label="Columns" value={p.columns as string || '3'} onChange={(v) => { update('columns', v); onCommit(); }}
          options={[['2','2'],['3','3'],['4','4'],['5','5'],['6','6']]} />
        <Field label="Gap" value={p.gap as string} onChange={(v) => update('gap', v)} onBlur={onCommit} placeholder="8px" />
      </>;
    case 'accordion':
      return <AccordionEditor items={Array.isArray(p.items) ? p.items as { title: string; content: string; open?: boolean }[] : []} onChange={(items) => { update('items', items as unknown as string); onCommit(); }} allowMultiple={p.allowMultiple === 'true'} onToggleMultiple={(v) => { update('allowMultiple', v ? 'true' : 'false'); onCommit(); }} />;
    case 'tabs':
      return <TabsEditor items={Array.isArray(p.items) ? p.items as { title: string; content: string }[] : []} activeIndex={parseInt(p.activeIndex as string) || 0} onChange={(items) => { update('items', items as unknown as string); onCommit(); }} onActiveChange={(i) => { update('activeIndex', String(i)); onCommit(); }} />;
    case 'post-title':
      return <>
        <Select label="Tag" value={p.tag as string || 'h1'} onChange={(v) => { update('tag', v); onCommit(); }}
          options={[['h1','H1'],['h2','H2'],['h3','H3'],['h4','H4']]} />
        <Checkbox label="Link to Post" checked={p.linkToPost === 'true'} onChange={(v) => { update('linkToPost', v ? 'true' : 'false'); onCommit(); }} />
      </>;
    case 'post-content':
      return <p className="ab-field__hint">Displays the current post content dynamically.</p>;
    case 'post-excerpt':
      return <>
        <Field label="Word Count" value={p.wordCount as string || '30'} onChange={(v) => update('wordCount', v)} onBlur={onCommit} />
      </>;
    case 'post-meta':
      return <>
        <Checkbox label="Show Date" checked={p.showDate !== 'false'} onChange={(v) => { update('showDate', v ? 'true' : 'false'); onCommit(); }} />
        <Checkbox label="Show Author" checked={p.showAuthor !== 'false'} onChange={(v) => { update('showAuthor', v ? 'true' : 'false'); onCommit(); }} />
        <Checkbox label="Show Category" checked={p.showCategory !== 'false'} onChange={(v) => { update('showCategory', v ? 'true' : 'false'); onCommit(); }} />
        <Field label="Separator" value={p.separator as string || ' · '} onChange={(v) => update('separator', v)} onBlur={onCommit} />
      </>;
    case 'featured-image':
      return <>
        <Select label="Size" value={p.size as string || 'large'} onChange={(v) => { update('size', v); onCommit(); }}
          options={[['thumbnail','Thumbnail'],['medium','Medium'],['large','Large'],['full','Full']]} />
        <Checkbox label="Link to Post" checked={p.linkToPost === 'true'} onChange={(v) => { update('linkToPost', v ? 'true' : 'false'); onCommit(); }} />
      </>;
    case 'breadcrumbs':
      return <>
        <Field label="Separator" value={p.separator as string || '/'} onChange={(v) => update('separator', v)} onBlur={onCommit} />
        <Checkbox label="Show Home" checked={p.showHome !== 'false'} onChange={(v) => { update('showHome', v ? 'true' : 'false'); onCommit(); }} />
        <Field label="Home Label" value={p.homeLabel as string || 'Home'} onChange={(v) => update('homeLabel', v)} onBlur={onCommit} />
      </>;
    case 'social-icons':
      return <SocialIconsEditor icons={Array.isArray(p.icons) ? p.icons as { platform: string; icon?: string; url?: string }[] : []} onChange={(icons) => { update('icons', icons as unknown as string); onCommit(); }} />;
    case 'shortcode':
      return <>
        <label className="ab-field__label">Shortcode</label>
        <textarea
          className="ab-field__input"
          rows={4}
          value={p.shortcode as string || ''}
          onChange={(e) => update('shortcode', e.target.value)}
          onBlur={onCommit}
          placeholder='[contact-form-7 id="123"]'
          style={{ fontFamily: 'monospace', fontSize: '13px', resize: 'vertical' }}
        />
        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0' }}>Enter any WordPress shortcode. It will be rendered on the frontend.</p>
      </>;
    default:
      return null;
  }
}

// ── Section Loop ────────────────────────────────────

const DIV_TYPES: [string, string][] = [
  ['div', 'Div'],
  ['section', 'Section'],
  ['container', 'Container'],
  ['wrapper', 'Wrapper'],
  ['header', 'Header'],
  ['footer', 'Footer'],
  ['main', 'Main'],
  ['aside', 'Aside'],
  ['article', 'Article'],
  ['nav', 'Nav'],
];

function DivContentTab({ el, update, onCommit }: { el: BuilderElement; update: (k: string, v: string) => void; onCommit: () => void }) {
  const divType = (el.props.divType as string) || (el.type === 'section' ? 'section' : el.type === 'container' ? 'container' : 'div');
  const loopEnabled = el.props.loopEnabled === 'true' || el.props.loopEnabled === true;
  const loopPostType = (el.props.loopPostType as string) || 'post';
  const loopCount = (el.props.loopCount as string) || '6';

  return <>
    <Select label="Div Type" value={divType} onChange={(v) => { update('divType', v); onCommit(); }} options={DIV_TYPES} />
    <div className="ab-field">
      <label className="ab-field__label">
        <input
          type="checkbox"
          checked={loopEnabled}
          onChange={(e) => { update('loopEnabled', e.target.checked ? 'true' : 'false'); onCommit(); }}
          style={{ marginInlineEnd: 6 }}
        />
        Loop (repeat by posts)
      </label>
    </div>
    {loopEnabled && <>
      <Select label="Post Type" value={loopPostType} onChange={(v) => { update('loopPostType', v); onCommit(); }}
        options={[['post','Post'],['page','Page'],['product','Product'],['alawi_theme_tpl','Theme Template']]} />
      <Field label="Posts Per Page" value={loopCount} onChange={(v) => update('loopCount', v)} onBlur={onCommit} />
      <Select label="Pagination" value={(el.props.paginationType as string) || 'none'} onChange={(v) => { update('paginationType', v); onCommit(); }}
        options={[['none','None'],['standard','Standard'],['prev-next','Previous / Next'],['numeric','Numeric'],['load-more','Load More'],['infinite','Infinite Scroll']]} />
    </>}
  </>;
}

// ── Style Tab (Key-Value) ───────────────────────────

const CSS_PROPERTIES = [
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'display', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-self', 'flex', 'flex-grow', 'flex-shrink',
  'gap', 'row-gap', 'column-gap',
  'grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row',
  'position', 'top', 'right', 'bottom', 'left', 'z-index',
  'overflow', 'overflow-x', 'overflow-y',
  'font-size', 'font-weight', 'font-family', 'font-style',
  'line-height', 'letter-spacing', 'text-align', 'text-decoration', 'text-transform',
  'color', 'background', 'background-color', 'background-image', 'background-size', 'background-position', 'background-repeat',
  'border', 'border-width', 'border-style', 'border-color',
  'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
  'box-shadow', 'text-shadow',
  'opacity', 'visibility', 'cursor', 'pointer-events',
  'transition', 'transform', 'animation',
  'object-fit', 'object-position',
  'white-space', 'word-break', 'word-wrap',
  'list-style', 'list-style-type',
  'outline', 'outline-width', 'outline-style', 'outline-color', 'outline-offset',
  'filter', 'backdrop-filter', 'mix-blend-mode',
  'clip-path', 'aspect-ratio', 'container-type', 
];

const CSS_HINTS: Record<string, string> = {
  'width': '100% | 300px | auto | 50vw',
  'height': '200px | auto | 100vh | fit-content',
  'min-width': '200px | 50%',
  'min-height': '100px | 50vh',
  'max-width': '1200px | 100% | 80ch',
  'max-height': '500px | 100vh | none',
  'padding': '20px | 10px 20px | 10px 20px 30px 40px',
  'padding-top': '10px | 1rem | 5%',
  'padding-right': '10px | 1rem | 5%',
  'padding-bottom': '10px | 1rem | 5%',
  'padding-left': '10px | 1rem | 5%',
  'margin': '0 auto | 20px | 10px 20px',
  'margin-top': '10px | 1rem | auto',
  'margin-right': '10px | auto',
  'margin-bottom': '10px | 1rem',
  'margin-left': '10px | auto',
  'display': 'flex | grid | block | inline-block | none',
  'flex-direction': 'row | column | row-reverse',
  'flex-wrap': 'wrap | nowrap',
  'justify-content': 'center | space-between | flex-start | flex-end',
  'align-items': 'center | flex-start | flex-end | stretch',
  'align-self': 'center | flex-start | auto',
  'flex': '1 | 0 0 auto | 1 1 50%',
  'flex-grow': '0 | 1',
  'flex-shrink': '0 | 1',
  'gap': '10px | 20px | 1rem',
  'row-gap': '10px | 1rem',
  'column-gap': '10px | 1rem',
  'grid-template-columns': 'repeat(3, 1fr) | 1fr 2fr | 200px auto',
  'grid-template-rows': 'auto 1fr auto',
  'grid-column': 'span 2 | 1 / 3',
  'grid-row': 'span 2 | 1 / 3',
  'position': 'relative | absolute | fixed | sticky',
  'top': '0 | 10px | 50%',
  'right': '0 | 10px | auto',
  'bottom': '0 | 10px | auto',
  'left': '0 | 10px | 50%',
  'z-index': '1 | 10 | 100 | -1',
  'overflow': 'hidden | auto | scroll | visible',
  'overflow-x': 'hidden | auto | scroll',
  'overflow-y': 'hidden | auto | scroll',
  'font-size': '16px | 1.5rem | 2em | clamp(14px, 2vw, 18px)',
  'font-weight': '400 | 600 | 700 | bold | normal',
  'font-family': 'Arial, sans-serif | inherit',
  'font-style': 'normal | italic',
  'line-height': '1.5 | 1.7 | 24px | normal',
  'letter-spacing': '0.5px | 1px | -0.5px | normal',
  'text-align': 'center | right | left | justify',
  'text-decoration': 'none | underline | line-through',
  'text-transform': 'uppercase | capitalize | lowercase | none',
  'color': '#333333 | rgb(0,0,0) | inherit',
  'background': '#fff | linear-gradient(to right, #f00, #00f)',
  'background-color': '#ffffff | rgba(0,0,0,0.5) | transparent',
  'background-image': 'url(...) | linear-gradient(135deg, #667eea, #764ba2)',
  'background-size': 'cover | contain | 100% auto',
  'background-position': 'center | top left | 50% 50%',
  'background-repeat': 'no-repeat | repeat | repeat-x',
  'border': '1px solid #e2e8f0 | 2px dashed #ccc | none',
  'border-width': '1px | 2px | 0',
  'border-style': 'solid | dashed | dotted | none',
  'border-color': '#e2e8f0 | transparent',
  'border-top': '1px solid #eee',
  'border-right': '1px solid #eee',
  'border-bottom': '2px solid #2563eb',
  'border-left': '3px solid #2563eb',
  'border-radius': '8px | 50% | 999px | 4px 4px 0 0',
  'border-top-left-radius': '8px',
  'border-top-right-radius': '8px',
  'border-bottom-left-radius': '8px',
  'border-bottom-right-radius': '8px',
  'box-shadow': '0 2px 8px rgba(0,0,0,0.1) | inset 0 1px 3px #ccc',
  'text-shadow': '1px 1px 2px rgba(0,0,0,0.2)',
  'opacity': '1 | 0.5 | 0',
  'visibility': 'visible | hidden',
  'cursor': 'pointer | default | grab | not-allowed',
  'pointer-events': 'auto | none',
  'transition': 'all 0.3s ease | opacity 0.2s | transform 0.3s',
  'transform': 'translateY(-2px) | scale(1.05) | rotate(45deg)',
  'animation': 'fadeIn 0.3s ease-in-out',
  'object-fit': 'cover | contain | fill | none',
  'object-position': 'center | top | 50% 50%',
  'white-space': 'nowrap | normal | pre-wrap',
  'word-break': 'break-word | break-all | normal',
  'word-wrap': 'break-word | normal',
  'list-style': 'none | disc | decimal',
  'list-style-type': 'none | disc | circle | decimal',
  'outline': '2px solid #2563eb | none',
  'outline-width': '2px',
  'outline-style': 'solid | dashed',
  'outline-color': '#2563eb',
  'outline-offset': '2px | -1px',
  'filter': 'blur(4px) | brightness(0.8) | grayscale(1)',
  'backdrop-filter': 'blur(10px) | brightness(0.5)',
  'mix-blend-mode': 'multiply | overlay | screen',
  'clip-path': 'circle(50%) | polygon(0 0, 100% 0, 100% 100%)',
  'aspect-ratio': '16/9 | 1 | 4/3',
  'container-type': 'inline-size | size | normal',
};

function cssToJs(css: string): string {
  return css.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function jsToCss(js: string): string {
  return js.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
}

function StyleTab({ el, update, device, onCommit, updateStyles }: {
  el: BuilderElement; update: (k: string, v: string) => void; device: DevicePreview; onCommit: () => void;
  updateStyles: (obj: Record<string, unknown>) => void;
}) {
  const s = el.styles;
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');

  const existingKeys = Object.keys(s).filter(k => k !== 'cssClass' && k !== 'cssId');

  const filtered = useMemo(() => {
    if (!search) return CSS_PROPERTIES;
    const q = search.toLowerCase();
    return CSS_PROPERTIES.filter(p => p.includes(q));
  }, [search]);

  const addProperty = (cssProp: string) => {
    const jsKey = cssToJs(cssProp);
    if (!s[jsKey] && s[jsKey] !== '') {
      update(jsKey, '');
    }
    setShowPicker(false);
    setSearch('');
  };

  const removeProperty = (jsKey: string) => {
    updateStyles({ [jsKey]: undefined });
    onCommit();
  };

  const clearDeviceOverride = (jsKey: string) => {
    const val = s[jsKey];
    if (!isResponsive(val) || device === 'desktop') return;
    const newVal = { ...val as import('../../utils/style-engine').ResponsiveValue, [device]: undefined };
    updateStyles({ [jsKey]: newVal });
    onCommit();
  };

  return <>
    {device !== 'desktop' && (
      <div className="ab-style-device-bar">
        <i className={`fa-solid ${device === 'tablet' ? 'fa-tablet-screen-button' : 'fa-mobile-screen-button'}`} />
        <span>Editing: <strong>{device === 'tablet' ? 'Tablet' : 'Mobile'}</strong></span>
      </div>
    )}
    {existingKeys.map((jsKey) => {
      const val = s[jsKey];
      const cssName = jsToCss(jsKey);
      const resp = isResponsive(val);
      const currentVal = resp ? getDeviceValue(val, device) : (val as string || '');
      const hasOverride = resp && device !== 'desktop' && !!(val as import('../../utils/style-engine').ResponsiveValue)[device as 'tablet' | 'mobile'];
      const isColor = cssName === 'color' || cssName.includes('background-color') || cssName.includes('border-color') || cssName.includes('outline-color');
      const inheritedVal = resp && device !== 'desktop' && !(val as import('../../utils/style-engine').ResponsiveValue)[device as 'tablet' | 'mobile']
        ? (device === 'mobile' && (val as import('../../utils/style-engine').ResponsiveValue).tablet) || (val as import('../../utils/style-engine').ResponsiveValue).desktop
        : '';

      return (
        <div className={`ab-style-row ${hasOverride ? 'ab-style-row--override' : ''}`} key={jsKey}>
          <div className="ab-style-row__header">
            <span className="ab-style-row__key">{cssName}</span>
            {hasOverride && (
              <button className="ab-style-row__clear" onClick={() => clearDeviceOverride(jsKey)} title={`Clear ${device} override`}>
                <i className="fa-solid fa-rotate-left" />
              </button>
            )}
            <button className="ab-style-row__remove" onClick={() => removeProperty(jsKey)} title="Remove">✕</button>
          </div>
          <div className="ab-style-row__value">
            {isColor ? (
              <div className="ab-field__row">
                <input type="color" className="ab-field__input ab-field__input--color"
                  value={currentVal || '#000000'}
                  onChange={(e) => update(jsKey, e.target.value)} onBlur={onCommit} />
                <input type="text" className="ab-field__input"
                  value={currentVal}
                  onChange={(e) => update(jsKey, e.target.value)} onBlur={onCommit}
                  placeholder={inheritedVal ? `← ${inheritedVal}` : ''} />
              </div>
            ) : (
              <input type="text" className="ab-field__input"
                value={currentVal}
                onChange={(e) => update(jsKey, e.target.value)} onBlur={onCommit}
                placeholder={inheritedVal ? `← ${inheritedVal}` : (CSS_HINTS[cssName] || cssName)} />
            )}
            {hasOverride && <span className="ab-field__responsive-dot" title={`${device} override`}>●</span>}
          </div>
        </div>
      );
    })}

    <div className="ab-style-add">
      <button className="ab-style-add__btn" onClick={() => setShowPicker(!showPicker)}>
        + Add Style
      </button>
      {showPicker && (
        <div className="ab-style-add__picker">
          <input
            type="text"
            className="ab-field__input ab-style-add__search"
            placeholder="Search CSS property..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="ab-style-add__list">
            {filtered.map((prop) => {
              const jsKey = cssToJs(prop);
              const alreadyAdded = jsKey in s;
              return (
                <button
                  key={prop}
                  className="ab-style-add__item"
                  onClick={() => addProperty(prop)}
                  disabled={alreadyAdded}
                >
                  {prop}
                  {alreadyAdded && <span className="ab-style-add__check">✓</span>}
                </button>
              );
            })}
            {filtered.length === 0 && <div className="ab-style-add__empty">No matching property</div>}
          </div>
        </div>
      )}
    </div>

    <div className="ab-style-section" style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--ab-ed-border)' }}>
      <div className="ab-field">
        <label className="ab-field__label">CSS Class</label>
        <input className="ab-field__input" type="text" value={(s.cssClass as string) || ''} onChange={(e) => update('cssClass', e.target.value)} onBlur={onCommit} placeholder="my-class" />
      </div>
      <div className="ab-field">
        <label className="ab-field__label">CSS ID</label>
        <input className="ab-field__input" type="text" value={(s.cssId as string) || ''} onChange={(e) => update('cssId', e.target.value)} onBlur={onCommit} placeholder="my-id" />
      </div>
    </div>
  </>;
}


// ── NavMenu Content Tab ────────────────────────────
const MOBILE_STYLES: [string, string][] = [
  ['drawer', 'Drawer (Slide)'],
  ['dropdown', 'Dropdown'],
  ['fullscreen', 'Fullscreen'],
];
const LAYOUT_OPTIONS: [string, string][] = [
  ['horizontal', 'Horizontal'],
  ['vertical', 'Vertical'],
];

function NavMenuContentTab({ el, update, onCommit }: { el: BuilderElement; update: (k: string, v: string) => void; onCommit: () => void }) {
  const p = el.props;
  const [menus, setMenus] = useState<{ id: number; name: string; slug: string; location: string; locationLabel: string; items: { id: number; title: string; url: string; parent: number }[] }[]>([]);
  const [loading, setLoading] = useState(false);

  useState(() => {
    const config = window.alawiEditorConfig;
    if (!config) return;
    setLoading(true);
    fetch(`${config.restUrl}menus`, { headers: { 'X-WP-Nonce': config.nonce } })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setMenus(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  });

  const selectedMenu = menus.find((m) => String(m.id) === p.menuId || m.slug === p.menuId);

  return <>
    <div className="ab-field-group">
      <div className="ab-field-group__title">Menu Source</div>
      {loading ? (
        <div className="ab-field" style={{ padding: '8px', color: '#94a3b8', fontSize: '12px' }}>
          <i className="fa-solid fa-spinner fa-spin" /> Loading menus...
        </div>
      ) : menus.length > 0 ? (
        <div className="ab-field">
          <label className="ab-field__label">WordPress Menu</label>
          <select className="ab-field__input" value={(p.menuId as string) || ''} onChange={(e) => { update('menuId', e.target.value); const m = menus.find((x) => String(x.id) === e.target.value); if (m) update('menuName', m.name); onCommit(); }}>
            <option value="">— Theme Location (Primary) —</option>
            {menus.map((m) => (
              <option key={m.id} value={String(m.id)}>
                {m.name}{m.locationLabel ? ` (${m.locationLabel})` : ''}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <Field label="Menu ID / Slug" value={p.menuId as string} onChange={(v) => update('menuId', v)} onBlur={onCommit} placeholder="primary" />
      )}
      {selectedMenu && selectedMenu.items.length > 0 && (
        <div className="ab-field" style={{ fontSize: '11px', color: '#94a3b8', padding: '4px 0' }}>
          {selectedMenu.items.filter((i) => !i.parent).map((item) => (
            <span key={item.id} style={{ marginInlineEnd: '12px' }}>{item.title}</span>
          ))}
        </div>
      )}
    </div>

    <div className="ab-field-group">
      <div className="ab-field-group__title">Layout</div>
      <div className="ab-field">
        <label className="ab-field__label">Direction</label>
        <div className="ab-field__btn-group">
          {LAYOUT_OPTIONS.map(([val, label]) => (
            <button key={val} className={`ab-field__btn ${(p.layout as string || 'horizontal') === val ? 'ab-field__btn--active' : ''}`}
              onClick={() => { update('layout', val); onCommit(); }}>{label}</button>
          ))}
        </div>
      </div>
    </div>

    <div className="ab-field-group">
      <div className="ab-field-group__title">Mobile</div>
      <Field label="Breakpoint (px)" value={p.mobileBreakpoint as string} onChange={(v) => update('mobileBreakpoint', v)} onBlur={onCommit} placeholder="768" />
      <div className="ab-field">
        <label className="ab-field__label">Mobile Style</label>
        <div className="ab-field__btn-group">
          {MOBILE_STYLES.map(([val, label]) => (
            <button key={val} className={`ab-field__btn ${(p.mobileStyle as string || 'drawer') === val ? 'ab-field__btn--active' : ''}`}
              onClick={() => { update('mobileStyle', val); onCommit(); }}>{label}</button>
          ))}
        </div>
      </div>
      <Field label="Toggle Icon" value={p.toggleIcon as string} onChange={(v) => update('toggleIcon', v)} onBlur={onCommit} placeholder="fa-solid fa-bars" />
      <Field label="Close Icon" value={p.closeIcon as string} onChange={(v) => update('closeIcon', v)} onBlur={onCommit} placeholder="fa-solid fa-xmark" />
      <Field label="Toggle Size" value={p.toggleSize as string} onChange={(v) => update('toggleSize', v)} onBlur={onCommit} placeholder="24px" />
    </div>

    <div className="ab-field-group">
      <div className="ab-field-group__title">Colors</div>
      <Field label="Link Color" value={p.linkColor as string} onChange={(v) => update('linkColor', v)} onBlur={onCommit} placeholder="inherit" />
      <Field label="Link Hover Color" value={p.linkHoverColor as string} onChange={(v) => update('linkHoverColor', v)} onBlur={onCommit} placeholder="#2563eb" />
      <Field label="Active Color" value={p.activeColor as string} onChange={(v) => update('activeColor', v)} onBlur={onCommit} placeholder="#2563eb" />
      <Field label="Toggle Color" value={p.toggleColor as string} onChange={(v) => update('toggleColor', v)} onBlur={onCommit} placeholder="inherit" />
      <Field label="Dropdown Background" value={p.dropdownBg as string} onChange={(v) => update('dropdownBg', v)} onBlur={onCommit} placeholder="#ffffff" />
    </div>
  </>;
}

// ── Field components ────────────────────────────────

function Field({ label, value, onChange, onBlur, placeholder, responsive, device }: {
  label: string; value: string; onChange: (v: string) => void; onBlur?: () => void; placeholder?: string;
  responsive?: boolean; device?: DevicePreview;
}) {
  return <div className="ab-field">
    <label className="ab-field__label">
      {label}
      {responsive && <span className="ab-field__responsive-dot" title={`Custom value for ${device}`}>●</span>}
    </label>
    <input className="ab-field__input" type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder} />
  </div>;
}

function Textarea({ label, value, onChange, onBlur }: { label: string; value: string; onChange: (v: string) => void; onBlur?: () => void }) {
  return <div className="ab-field">
    <label className="ab-field__label">{label}</label>
    <textarea className="ab-field__input ab-field__input--textarea" value={value || ''} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
  </div>;
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][];
}) {
  return <div className="ab-field">
    <label className="ab-field__label">{label}</label>
    <select className="ab-field__input ab-field__input--select" value={value || ''} onChange={(e) => onChange(e.target.value)}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  </div>;
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <div className="ab-field">
    <label className="ab-field__label" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  </div>;
}

function GalleryEditor({ images, onChange }: { images: { src: string; alt?: string }[]; onChange: (imgs: { src: string; alt?: string }[]) => void }) {
  const [newUrl, setNewUrl] = useState('');
  return <div className="ab-field">
    <label className="ab-field__label">Images ({images.length})</label>
    {images.map((img, i) => (
      <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
        <input className="ab-field__input" style={{ flex: 1 }} value={img.src} onChange={(e) => { const n = [...images]; n[i] = { ...n[i], src: e.target.value }; onChange(n); }} placeholder="Image URL" />
        <button className="ab-style-row__remove" onClick={() => onChange(images.filter((_, j) => j !== i))} title="Remove">✕</button>
      </div>
    ))}
    <div style={{ display: 'flex', gap: 4 }}>
      <input className="ab-field__input" style={{ flex: 1 }} value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="Add image URL" />
      <button className="ab-templates__insert-btn" onClick={() => { if (newUrl.trim()) { onChange([...images, { src: newUrl.trim() }]); setNewUrl(''); } }} disabled={!newUrl.trim()}>+</button>
    </div>
  </div>;
}

function AccordionEditor({ items, onChange, allowMultiple, onToggleMultiple }: {
  items: { title: string; content: string; open?: boolean }[];
  onChange: (items: { title: string; content: string; open?: boolean }[]) => void;
  allowMultiple: boolean;
  onToggleMultiple: (v: boolean) => void;
}) {
  return <div className="ab-field">
    <Checkbox label="Allow Multiple Open" checked={allowMultiple} onChange={onToggleMultiple} />
    <label className="ab-field__label">Items ({items.length})</label>
    {items.map((item, i) => (
      <div key={i} style={{ marginBottom: 8, padding: 8, border: '1px solid var(--ab-ed-border)', borderRadius: 4 }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
          <input className="ab-field__input" style={{ flex: 1 }} value={item.title} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], title: e.target.value }; onChange(n); }} placeholder="Title" />
          <button className="ab-style-row__remove" onClick={() => onChange(items.filter((_, j) => j !== i))} title="Remove">✕</button>
        </div>
        <textarea className="ab-field__input ab-field__input--textarea" value={item.content} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], content: e.target.value }; onChange(n); }} placeholder="Content" style={{ minHeight: 50 }} />
        <Checkbox label="Open by default" checked={!!item.open} onChange={(v) => { const n = [...items]; n[i] = { ...n[i], open: v }; onChange(n); }} />
      </div>
    ))}
    <button className="ab-templates__insert-btn" onClick={() => onChange([...items, { title: `Item ${items.length + 1}`, content: '', open: false }])}>+ Add Item</button>
  </div>;
}

function TabsEditor({ items, activeIndex, onChange, onActiveChange }: {
  items: { title: string; content: string }[];
  activeIndex: number;
  onChange: (items: { title: string; content: string }[]) => void;
  onActiveChange: (i: number) => void;
}) {
  return <div className="ab-field">
    <label className="ab-field__label">Tabs ({items.length})</label>
    {items.map((item, i) => (
      <div key={i} style={{ marginBottom: 8, padding: 8, border: i === activeIndex ? '2px solid var(--ab-ed-primary)' : '1px solid var(--ab-ed-border)', borderRadius: 4, cursor: 'pointer' }} onClick={() => onActiveChange(i)}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
          <input className="ab-field__input" style={{ flex: 1 }} value={item.title} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], title: e.target.value }; onChange(n); }} placeholder="Tab title" onClick={(e) => e.stopPropagation()} />
          <button className="ab-style-row__remove" onClick={(e) => { e.stopPropagation(); onChange(items.filter((_, j) => j !== i)); if (activeIndex >= items.length - 1) onActiveChange(Math.max(0, items.length - 2)); }} title="Remove">✕</button>
        </div>
        {i === activeIndex && (
          <textarea className="ab-field__input ab-field__input--textarea" value={item.content} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], content: e.target.value }; onChange(n); }} placeholder="Tab content" style={{ minHeight: 50 }} onClick={(e) => e.stopPropagation()} />
        )}
      </div>
    ))}
    <button className="ab-templates__insert-btn" onClick={() => onChange([...items, { title: `Tab ${items.length + 1}`, content: '' }])}>+ Add Tab</button>
  </div>;
}

const FA_ICONS: { label: string; icons: string[] }[] = [
  { label: 'Common', icons: [
    'fa-solid fa-star', 'fa-solid fa-heart', 'fa-solid fa-check', 'fa-solid fa-xmark', 'fa-solid fa-plus',
    'fa-solid fa-minus', 'fa-solid fa-circle', 'fa-solid fa-square', 'fa-solid fa-triangle-exclamation',
    'fa-solid fa-circle-info', 'fa-solid fa-circle-check', 'fa-solid fa-circle-xmark',
    'fa-solid fa-bell', 'fa-solid fa-bookmark', 'fa-solid fa-flag', 'fa-solid fa-thumbs-up',
  ]},
  { label: 'Arrows', icons: [
    'fa-solid fa-arrow-right', 'fa-solid fa-arrow-left', 'fa-solid fa-arrow-up', 'fa-solid fa-arrow-down',
    'fa-solid fa-chevron-right', 'fa-solid fa-chevron-left', 'fa-solid fa-chevron-up', 'fa-solid fa-chevron-down',
    'fa-solid fa-angles-right', 'fa-solid fa-angles-left', 'fa-solid fa-arrow-rotate-right',
    'fa-solid fa-arrows-rotate', 'fa-solid fa-right-long', 'fa-solid fa-left-long',
    'fa-solid fa-up-right-from-square', 'fa-solid fa-download',
  ]},
  { label: 'Media', icons: [
    'fa-solid fa-image', 'fa-solid fa-camera', 'fa-solid fa-video', 'fa-solid fa-film',
    'fa-solid fa-music', 'fa-solid fa-play', 'fa-solid fa-pause', 'fa-solid fa-stop',
    'fa-solid fa-volume-high', 'fa-solid fa-microphone', 'fa-solid fa-headphones',
    'fa-solid fa-photo-film', 'fa-solid fa-images', 'fa-solid fa-podcast',
    'fa-solid fa-circle-play', 'fa-solid fa-compact-disc',
  ]},
  { label: 'Communication', icons: [
    'fa-solid fa-envelope', 'fa-solid fa-phone', 'fa-solid fa-comment', 'fa-solid fa-comments',
    'fa-solid fa-paper-plane', 'fa-solid fa-inbox', 'fa-solid fa-at', 'fa-solid fa-share',
    'fa-solid fa-share-nodes', 'fa-solid fa-reply', 'fa-solid fa-message',
    'fa-solid fa-comment-dots', 'fa-solid fa-quote-left', 'fa-solid fa-quote-right',
    'fa-solid fa-bullhorn', 'fa-solid fa-rss',
  ]},
  { label: 'Business', icons: [
    'fa-solid fa-briefcase', 'fa-solid fa-building', 'fa-solid fa-chart-line', 'fa-solid fa-chart-bar',
    'fa-solid fa-chart-pie', 'fa-solid fa-coins', 'fa-solid fa-money-bill', 'fa-solid fa-credit-card',
    'fa-solid fa-wallet', 'fa-solid fa-receipt', 'fa-solid fa-handshake', 'fa-solid fa-award',
    'fa-solid fa-trophy', 'fa-solid fa-medal', 'fa-solid fa-crown', 'fa-solid fa-gem',
  ]},
  { label: 'User', icons: [
    'fa-solid fa-user', 'fa-solid fa-users', 'fa-solid fa-user-plus', 'fa-solid fa-user-gear',
    'fa-solid fa-circle-user', 'fa-solid fa-people-group', 'fa-solid fa-address-card',
    'fa-solid fa-id-badge', 'fa-solid fa-user-shield', 'fa-solid fa-user-tie',
    'fa-solid fa-person', 'fa-solid fa-children', 'fa-solid fa-hand', 'fa-solid fa-fingerprint',
    'fa-solid fa-face-smile', 'fa-solid fa-face-laugh',
  ]},
  { label: 'Interface', icons: [
    'fa-solid fa-gear', 'fa-solid fa-sliders', 'fa-solid fa-bars', 'fa-solid fa-ellipsis',
    'fa-solid fa-ellipsis-vertical', 'fa-solid fa-magnifying-glass', 'fa-solid fa-filter',
    'fa-solid fa-sort', 'fa-solid fa-grip', 'fa-solid fa-list', 'fa-solid fa-table-cells',
    'fa-solid fa-eye', 'fa-solid fa-eye-slash', 'fa-solid fa-pen', 'fa-solid fa-trash',
    'fa-solid fa-copy',
  ]},
  { label: 'Files', icons: [
    'fa-solid fa-file', 'fa-solid fa-folder', 'fa-solid fa-folder-open', 'fa-solid fa-file-lines',
    'fa-solid fa-file-pdf', 'fa-solid fa-file-image', 'fa-solid fa-file-code', 'fa-solid fa-file-zipper',
    'fa-solid fa-clipboard', 'fa-solid fa-paperclip', 'fa-solid fa-floppy-disk',
    'fa-solid fa-database', 'fa-solid fa-hard-drive', 'fa-solid fa-cloud',
    'fa-solid fa-cloud-arrow-up', 'fa-solid fa-cloud-arrow-down',
  ]},
  { label: 'Navigation', icons: [
    'fa-solid fa-house', 'fa-solid fa-location-dot', 'fa-solid fa-map', 'fa-solid fa-map-pin',
    'fa-solid fa-compass', 'fa-solid fa-route', 'fa-solid fa-signs-post', 'fa-solid fa-globe',
    'fa-solid fa-earth-americas', 'fa-solid fa-link', 'fa-solid fa-hashtag',
    'fa-solid fa-sitemap', 'fa-solid fa-diagram-project', 'fa-solid fa-layer-group',
    'fa-solid fa-bars-staggered', 'fa-solid fa-table-columns',
  ]},
  { label: 'Shopping', icons: [
    'fa-solid fa-cart-shopping', 'fa-solid fa-bag-shopping', 'fa-solid fa-basket-shopping',
    'fa-solid fa-store', 'fa-solid fa-shop', 'fa-solid fa-tag', 'fa-solid fa-tags',
    'fa-solid fa-barcode', 'fa-solid fa-qrcode', 'fa-solid fa-gift', 'fa-solid fa-box',
    'fa-solid fa-boxes-stacked', 'fa-solid fa-truck', 'fa-solid fa-truck-fast',
    'fa-solid fa-percent', 'fa-solid fa-fire',
  ]},
  { label: 'Brands', icons: [
    'fa-brands fa-facebook-f', 'fa-brands fa-x-twitter', 'fa-brands fa-instagram',
    'fa-brands fa-youtube', 'fa-brands fa-linkedin-in', 'fa-brands fa-tiktok',
    'fa-brands fa-snapchat', 'fa-brands fa-pinterest-p', 'fa-brands fa-whatsapp',
    'fa-brands fa-telegram', 'fa-brands fa-github', 'fa-brands fa-dribbble',
    'fa-brands fa-behance', 'fa-brands fa-discord', 'fa-brands fa-reddit-alien',
    'fa-brands fa-spotify',
  ]},
];

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return FA_ICONS;
    const q = search.toLowerCase();
    return FA_ICONS.map(group => ({
      label: group.label,
      icons: group.icons.filter(ic => ic.toLowerCase().includes(q)),
    })).filter(g => g.icons.length > 0);
  }, [search]);

  return <div className="ab-field">
    <label className="ab-field__label">Icon</label>
    <div
      style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', padding: '6px 8px', border: '1px solid var(--ab-ed-border)', borderRadius: 4, background: 'var(--ab-ed-bg)' }}
      onClick={() => setOpen(!open)}
    >
      <i className={value} style={{ fontSize: 20, width: 24, textAlign: 'center' }} />
      <span style={{ flex: 1, fontSize: 12, color: 'var(--ab-ed-text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
      <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: 10, color: 'var(--ab-ed-text-dim)' }} />
    </div>
    {open && (
      <div style={{ marginTop: 6, border: '1px solid var(--ab-ed-border)', borderRadius: 4, background: 'var(--ab-ed-surface)', maxHeight: 320, overflow: 'auto' }}>
        <div style={{ padding: '6px', position: 'sticky', top: 0, background: 'var(--ab-ed-surface)', zIndex: 1 }}>
          <input
            className="ab-field__input"
            type="text"
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            style={{ fontSize: 12 }}
          />
        </div>
        {filtered.map((group) => (
          <div key={group.label}>
            <div style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600, color: 'var(--ab-ed-text-dim)', borderBottom: '1px solid var(--ab-ed-border)' }}>{group.label}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2, padding: 4 }}>
              {group.icons.map((ic) => (
                <button
                  key={ic}
                  title={ic.replace(/fa-\w+ fa-/, '')}
                  onClick={() => { onChange(ic); setOpen(false); setSearch(''); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '100%', aspectRatio: '1', border: ic === value ? '2px solid var(--ab-ed-primary)' : '1px solid transparent',
                    borderRadius: 4, background: ic === value ? 'var(--ab-ed-primary-bg, rgba(37,99,235,0.1))' : 'transparent',
                    cursor: 'pointer', fontSize: 16, color: 'var(--ab-ed-text)', padding: 0,
                  }}
                >
                  <i className={ic} />
                </button>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: 12, textAlign: 'center', color: 'var(--ab-ed-text-dim)', fontSize: 12 }}>No icons found</div>}
        <div style={{ padding: '6px 8px', borderTop: '1px solid var(--ab-ed-border)' }}>
          <input
            className="ab-field__input"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Or type FA class manually"
            style={{ fontSize: 11 }}
          />
        </div>
      </div>
    )}
  </div>;
}

function SocialIconsEditor({ icons, onChange }: {
  icons: { platform: string; icon?: string; url?: string }[];
  onChange: (icons: { platform: string; icon?: string; url?: string }[]) => void;
}) {
  const platforms = Object.keys(SOCIAL_ICON_MAP);
  return <div className="ab-field">
    <label className="ab-field__label">Icons ({icons.length})</label>
    {icons.map((ic, i) => (
      <div key={i} style={{ marginBottom: 8, padding: 8, border: '1px solid var(--ab-ed-border)', borderRadius: 4 }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
          <i className={ic.icon || SOCIAL_ICON_MAP[ic.platform] || 'fa-solid fa-link'} style={{ width: 20, textAlign: 'center', color: 'var(--ab-ed-text-dim)' }} />
          <select className="ab-field__input ab-field__input--select" style={{ flex: 1 }} value={ic.platform}
            onChange={(e) => { const n = [...icons]; n[i] = { ...n[i], platform: e.target.value, icon: SOCIAL_ICON_MAP[e.target.value] || '' }; onChange(n); }}>
            {platforms.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
          <button className="ab-style-row__remove" onClick={() => onChange(icons.filter((_, j) => j !== i))} title="Remove">✕</button>
        </div>
        <input className="ab-field__input" value={ic.url || ''} onChange={(e) => { const n = [...icons]; n[i] = { ...n[i], url: e.target.value }; onChange(n); }} placeholder="https://..." style={{ marginBottom: 4 }} />
        <input className="ab-field__input" value={ic.icon || SOCIAL_ICON_MAP[ic.platform] || ''} onChange={(e) => { const n = [...icons]; n[i] = { ...n[i], icon: e.target.value }; onChange(n); }} placeholder="FA icon class (e.g. fa-brands fa-facebook-f)" />
      </div>
    ))}
    <button className="ab-templates__insert-btn" onClick={() => onChange([...icons, { platform: 'facebook', icon: 'fa-brands fa-facebook-f', url: '#' }])}>+ Add Icon</button>
  </div>;
}
