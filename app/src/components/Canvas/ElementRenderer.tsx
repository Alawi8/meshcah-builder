import { useEditorStore } from '../../store/editor-store';
import { useDragStore } from '../../store/drag-store';
import { useComponentStore } from '../../store/component-store';
import { usePostDataStore } from '../../store/post-data-store';
import { registry } from '../../blocks/registry';
import { DropZone } from './DropZone';
import { hasDynamicTag, resolveDynamicTags } from '../../utils/dynamic-data';
import type { BuilderElement } from '../../types';

export function ElementRenderer({ element }: { element: BuilderElement }) {
  const selectedId = useEditorStore((s) => s.selectedId);
  const select = useEditorStore((s) => s.selectElement);
  const remove = useEditorStore((s) => s.removeElement);
  const duplicate = useEditorStore((s) => s.duplicateElement);
  const setDragging = useDragStore((s) => s.setDragging);

  const device = useEditorStore((s) => s.devicePreview);
  const isSelected = selectedId === element.id;
  const def = registry.get(element.type);
  const compDef = useComponentStore((s) =>
    element.type === 'component'
      ? s.components.find((c) => c.id === element.props.componentId)
      : undefined
  );
  const postData = usePostDataStore((s) => s.data);
  const canContain = element.type === 'component' ? false : (def?.canContain ?? (element.type === 'section' || element.type === 'container'));

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    select(element.id);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('elementId', element.id);
    e.dataTransfer.effectAllowed = 'move';
    setDragging(element.id);
  };

  const handleDragEnd = () => {
    setDragging(null);
  };

  return (
    <div
      className={`ab-el ab-el--${element.type} ab-r-${element.id}${isSelected ? ' ab-el--selected' : ''}`}
      data-loop={(element.props.loopEnabled === 'true' || element.props.loopEnabled === true) ? 'true' : undefined}
      onClick={handleClick}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={element.type === 'component' ? {} : undefined}
    >
      <span className="ab-el__label">{element.type === 'component' ? <><i className="fa-solid fa-puzzle-piece" /> {compDef?.name || 'Component'}</> : (def?.label || element.type)}</span>

      {isSelected && (
        <div className="ab-el__actions">
          {element.type !== 'component' && (
            <button className="ab-el__action" onClick={(e) => {
              e.stopPropagation();
              const name = prompt('Component name:');
              if (!name?.trim()) return;
              const store = useEditorStore.getState();
              const el = store.elements.find((x) => x.id === element.id) ||
                (function findDeep(els: BuilderElement[]): BuilderElement | undefined {
                  for (const x of els) { if (x.id === element.id) return x; const f = findDeep(x.children); if (f) return f; } return undefined;
                })(store.elements);
              if (!el) return;
              useComponentStore.getState().createComponent(name.trim(), [el]).then((comp) => {
                store.pushHistory('Create component');
                const newEl: BuilderElement = { id: element.id, type: 'component', props: { componentId: comp.id }, styles: {}, children: [] };
                store.setElements(
                  (function replaceEl(els: BuilderElement[]): BuilderElement[] {
                    return els.map((x) => x.id === element.id ? newEl : { ...x, children: replaceEl(x.children) });
                  })(store.elements)
                );
                useEditorStore.setState({ isDirty: true });
              });
            }} title="Create Component"><i className="fa-solid fa-puzzle-piece" /></button>
          )}
          <button className="ab-el__action" onClick={(e) => { e.stopPropagation(); duplicate(element.id); }} title="Duplicate"><i className="fa-solid fa-copy" /></button>
          <button className="ab-el__action ab-el__action--delete" onClick={(e) => { e.stopPropagation(); remove(element.id); }} title="Delete"><i className="fa-solid fa-xmark" /></button>
        </div>
      )}

      {element.type === 'component' && compDef ? (
        <div className="ab-el__component-content">
          {compDef.elements.map((child) => (
            <ElementRenderer key={child.id} element={child} />
          ))}
        </div>
      ) : element.type === 'component' ? (
        <div className="ab-el--image-placeholder"><i className="fa-solid fa-puzzle-piece" /> Component not found</div>
      ) : renderContent(element, device, postData)}

      {canContain && (
        <div className="ab-el__children">
          {element.children.length === 0 ? (
            <DropZone parentId={element.id} index={0} />
          ) : (
            <>
              <DropZone parentId={element.id} index={0} />
              {element.children.map((child, i) => (
                <div key={child.id} style={{ display: 'contents' }}>
                  <ElementRenderer element={child} />
                  <DropZone parentId={element.id} index={i + 1} />
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function renderContent(el: BuilderElement, _device: import('../../types').DevicePreview, postData: Record<string, string>) {
  const p = el.props;
  const r = (val: unknown) => {
    if (typeof val !== 'string') return val as string;
    return hasDynamicTag(val) ? resolveDynamicTags(val, postData) : val;
  };

  switch (el.type) {
    case 'heading': {
      const Tag = (p.tag as keyof JSX.IntrinsicElements) || 'h2';
      return <Tag>{r(p.text) || 'Heading'}</Tag>;
    }
    case 'text':
      return <p>{r(p.content) || 'Text'}</p>;
    case 'image': {
      const src = r(p.src);
      return src
        ? <img src={src} alt={r(p.alt) || ''} />
        : <div className="ab-el--image-placeholder"><i className="fa-solid fa-image" /> Select Image</div>;
    }
    case 'button':
      return <a href="#" onClick={(e) => e.preventDefault()}>{r(p.text) || 'Button'}</a>;
    case 'spacer':
      return null;
    case 'logo': {
      const logoSrc = r(p.src);
      return logoSrc
        ? <a href="#" onClick={(e) => e.preventDefault()}><img src={logoSrc} alt={r(p.alt) || 'Logo'} /></a>
        : <div className="ab-el--image-placeholder">◉ Logo</div>;
    }
    case 'nav-menu': {
      const layout = (p.layout as string) || 'horizontal';
      return <nav className="ab-nav-menu-preview">
        <div className={`ab-nav-menu-preview__links ab-nav-menu-preview__links--${layout}`}>
          <span className="ab-nav-menu-preview__link">Home</span>
          <span className="ab-nav-menu-preview__link">About</span>
          <span className="ab-nav-menu-preview__link">Services</span>
          <span className="ab-nav-menu-preview__link">Contact</span>
        </div>
        <div className="ab-nav-menu-preview__toggle">
          <i className={(p.toggleIcon as string) || 'fa-solid fa-bars'} />
        </div>
      </nav>;
    }
    case 'link':
      return <a href="#" onClick={(e) => e.preventDefault()}>{r(p.text) || 'Link'}</a>;
    case 'search':
      return <form onSubmit={(e) => e.preventDefault()}>
        <input type="text" readOnly placeholder={r(p.placeholder) || 'Search...'} />
      </form>;
    case 'icon':
      return <i className={r(p.icon) || 'fa-solid fa-star'} />;
    case 'social-icons':
      return <div className="ab-social-icons">
        {(Array.isArray(p.icons) ? p.icons : []).map((ic: { platform: string; icon?: string; url?: string }, i: number) => (
          <a key={i} href="#" onClick={(e) => e.preventDefault()} className="ab-social-icon">
            <i className={ic.icon || socialIconClass(ic.platform)} />
          </a>
        ))}
      </div>;
    case 'badge':
      return <span>{r(p.text) || 'Badge'}</span>;
    case 'divider':
      return <hr />;
    case 'video': {
      const videoSrc = r(p.src);
      return videoSrc ? (
        <video
          src={videoSrc}
          poster={r(p.poster) || undefined}
          controls={p.controls !== 'false'}
          muted={p.muted === 'true'}
          loop={p.loop === 'true'}
        />
      ) : (
        <div className="ab-el--image-placeholder"><i className="fa-solid fa-video" /> Add Video URL</div>
      );
    }
    case 'gallery': {
      const images = Array.isArray(p.images) ? p.images as { src: string; alt?: string }[] : [];
      const cols = parseInt(p.columns as string) || 3;
      return images.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: p.gap as string || '8px' }}>
          {images.map((img, i) => (
            <img key={i} src={img.src} alt={img.alt || ''} style={{ width: '100%', borderRadius: '4px', objectFit: 'cover', aspectRatio: '1' }} />
          ))}
        </div>
      ) : (
        <div className="ab-el--image-placeholder"><i className="fa-solid fa-images" /> Add Gallery Images</div>
      );
    }
    case 'accordion': {
      const items = Array.isArray(p.items) ? p.items as { title: string; content: string; open?: boolean }[] : [];
      return (
        <div className="ab-accordion">
          {items.map((item, i) => (
            <div key={i} className="ab-accordion__item">
              <div className="ab-accordion__header">
                <span>{item.title}</span>
                <i className={item.open ? (p.iconOpen as string || 'fa-solid fa-chevron-up') : (p.iconClosed as string || 'fa-solid fa-chevron-down')} />
              </div>
              {item.open && (
                <div className="ab-accordion__content">{item.content}</div>
              )}
            </div>
          ))}
        </div>
      );
    }
    case 'tabs': {
      const tabItems = Array.isArray(p.items) ? p.items as { title: string; content: string }[] : [];
      const activeIdx = parseInt(p.activeIndex as string) || 0;
      return (
        <div className="ab-tabs">
          <div className="ab-tabs__nav">
            {tabItems.map((t, i) => (
              <div key={i} className={`ab-tabs__tab ${i === activeIdx ? 'ab-tabs__tab--active' : ''}`}>{t.title}</div>
            ))}
          </div>
          {tabItems[activeIdx] && (
            <div className="ab-tabs__panel">{tabItems[activeIdx].content}</div>
          )}
        </div>
      );
    }
    case 'post-title': {
      const TitleTag = (['h1','h2','h3','h4','h5','h6'].includes(p.tag as string) ? p.tag : 'h1') as keyof JSX.IntrinsicElements;
      return <TitleTag>{postData.post_title || 'Post Title'}</TitleTag>;
    }
    case 'post-content':
      return <div dangerouslySetInnerHTML={{ __html: postData.post_content || '<p>Post content will appear here.</p>' }} />;
    case 'post-excerpt':
      return <p>{postData.post_excerpt || 'Post excerpt will appear here.'}</p>;
    case 'post-meta': {
      const parts: string[] = [];
      if (p.showDate !== 'false' && postData.post_date) parts.push(postData.post_date);
      if (p.showAuthor !== 'false' && postData.post_author) parts.push(postData.post_author);
      if (p.showCategory !== 'false' && postData.post_category) parts.push(postData.post_category);
      const sep = (p.separator as string) || ' · ';
      return <div>{parts.length > 0 ? parts.join(sep) : 'Post Meta'}</div>;
    }
    case 'featured-image': {
      const featSrc = postData.featured_image;
      return featSrc ? (
        <img src={featSrc} alt="" />
      ) : (
        <div className="ab-el--image-placeholder"><i className="fa-solid fa-image" /> Featured Image</div>
      );
    }
    case 'breadcrumbs': {
      const sep = (p.separator as string) || '/';
      const home = p.homeLabel as string || 'Home';
      return <nav>
        <span style={{ color: '#2563eb' }}>{home}</span>
        <span> {sep} </span>
        <span>{postData.post_category || 'Category'}</span>
        <span> {sep} </span>
        <span>{postData.post_title || 'Page Title'}</span>
      </nav>;
    }
    case 'shortcode': {
      const sc = (p.shortcode as string) || '';
      if (!sc) return <div className="ab-shortcode-placeholder"><i className="fa-solid fa-code" /> Enter a shortcode</div>;
      return <div className="ab-shortcode-placeholder"><i className="fa-solid fa-code" /> {sc}</div>;
    }
    default:
      return null;
  }
}

const SOCIAL_ICON_MAP: Record<string, string> = {
  facebook: 'fa-brands fa-facebook-f',
  twitter: 'fa-brands fa-x-twitter',
  instagram: 'fa-brands fa-instagram',
  youtube: 'fa-brands fa-youtube',
  linkedin: 'fa-brands fa-linkedin-in',
  tiktok: 'fa-brands fa-tiktok',
  snapchat: 'fa-brands fa-snapchat',
  pinterest: 'fa-brands fa-pinterest-p',
  whatsapp: 'fa-brands fa-whatsapp',
  telegram: 'fa-brands fa-telegram',
  github: 'fa-brands fa-github',
  dribbble: 'fa-brands fa-dribbble',
  behance: 'fa-brands fa-behance',
  discord: 'fa-brands fa-discord',
  reddit: 'fa-brands fa-reddit-alien',
  email: 'fa-solid fa-envelope',
  website: 'fa-solid fa-globe',
};

function socialIconClass(platform: string): string {
  return SOCIAL_ICON_MAP[platform] || 'fa-solid fa-link';
}

export { SOCIAL_ICON_MAP, socialIconClass };
