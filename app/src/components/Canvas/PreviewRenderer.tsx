import { useComponentStore } from '../../store/component-store';
import { usePostDataStore } from '../../store/post-data-store';
import { hasDynamicTag, resolveDynamicTags } from '../../utils/dynamic-data';
import type { BuilderElement } from '../../types';

export function PreviewRenderer({ element }: { element: BuilderElement }) {
  const { type, id, props: p, styles: s, children } = element;
  const postData = usePostDataStore((s) => s.data);
  const className = `ab-r-${id} ${(s.cssClass as string) || ''}`.trim();
  const idAttr = (s.cssId as string) || undefined;

  const r = (val: unknown) => {
    if (typeof val !== 'string') return val as string;
    return hasDynamicTag(val) ? resolveDynamicTags(val, postData) : val;
  };

  const kids = children.map((c) => <PreviewRenderer key={c.id} element={c} />);

  switch (type) {
    case 'section':
    case 'container':
    case 'div': {
      const divType = (p.divType as string) || (type === 'section' ? 'section' : type === 'container' ? 'container' : 'div');
      const semanticTags = ['section', 'header', 'footer', 'main', 'aside', 'article', 'nav'];
      const DivTag = (semanticTags.includes(divType) ? divType : 'div') as keyof JSX.IntrinsicElements;
      return <DivTag className={`ab-div ab-div--${divType} ${className}`} id={idAttr}>{kids}</DivTag>;
    }
    case 'heading': {
      const Tag = (['h1','h2','h3','h4','h5','h6'].includes(p.tag as string) ? p.tag : 'h2') as keyof JSX.IntrinsicElements;
      return <Tag className={`ab-heading ${className}`} id={idAttr}>{r(p.text) || 'Heading'}</Tag>;
    }
    case 'text':
      return (
        <div className={`ab-text-el ${className}`} id={idAttr}
          dangerouslySetInnerHTML={{ __html: r(p.content) || '' }}
        />
      );
    case 'image': {
      const src = r(p.src);
      return src ? (
        <figure className={`ab-image-el ${className}`} id={idAttr}>
          <img src={src} alt={r(p.alt) || ''} loading="lazy" />
        </figure>
      ) : null;
    }
    case 'button':
      return (
        <div className={`ab-button-wrap ${className}`} id={idAttr}>
          <a href={r(p.url) || '#'} className="ab-button" onClick={(e) => e.preventDefault()}>
            {r(p.text) || 'Button'}
          </a>
        </div>
      );
    case 'spacer':
      return <div className={`ab-spacer-el ${className}`} id={idAttr} />;
    case 'component':
      return <ComponentPreview componentId={p.componentId as string} className={className} idAttr={idAttr} />;
    default:
      return null;
  }
}

function ComponentPreview({ componentId, className, idAttr }: { componentId: string; className: string; idAttr?: string }) {
  const compDef = useComponentStore((s) => s.components.find((c) => c.id === componentId));
  if (!compDef) return null;
  return (
    <div className={`ab-component-el ${className}`} id={idAttr}>
      {compDef.elements.map((el) => (
        <PreviewRenderer key={el.id} element={el} />
      ))}
    </div>
  );
}
