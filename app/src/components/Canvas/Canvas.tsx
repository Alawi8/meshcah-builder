import { useEffect, useRef, useState, useMemo } from 'react';
import { useEditorStore } from '../../store/editor-store';
import { ElementRenderer } from './ElementRenderer';
import { DropZone } from './DropZone';
import { generatePageCss } from '../../utils/style-engine';

export function Canvas() {
  const elements = useEditorStore((s) => s.elements);
  const device = useEditorStore((s) => s.devicePreview);
  const previewMode = useEditorStore((s) => s.previewMode);
  const select = useEditorStore((s) => s.selectElement);

  const elementCss = useMemo(() => generatePageCss(elements), [elements]);
  const frameClass = `ab-canvas__frame ${device !== 'desktop' ? `ab-canvas__frame--${device}` : ''}`;

  if (previewMode) {
    return (
      <div className="ab-canvas ab-canvas--preview">
        <div className={frameClass}>
          <LivePreview elements={elements} />
        </div>
      </div>
    );
  }

  return (
    <div className="ab-canvas" onClick={(e) => { if (e.target === e.currentTarget) select(null); }}>
      <style>{elementCss}</style>
      <div className={frameClass} onClick={(e) => { if (e.target === e.currentTarget) select(null); }}>
        {elements.length === 0 ? (
          <div className="ab-canvas__empty">
            <div className="ab-canvas__empty-icon"><i className="fa-solid fa-plus" /></div>
            <div className="ab-canvas__empty-text">Start building your page</div>
            <div className="ab-canvas__empty-hint">Choose an element from the sidebar</div>
          </div>
        ) : (
          <>
            <DropZone parentId={null} index={0} />
            {elements.map((el, i) => (
              <div key={el.id}>
                <ElementRenderer element={el} />
                <DropZone parentId={null} index={i + 1} />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function LivePreview({ elements }: { elements: import('../../types').BuilderElement[] }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(false);
  const [html, setHtml] = useState('');
  const config = window.alawiEditorConfig;
  const elementCss = useMemo(() => generatePageCss(elements), [elements]);

  useEffect(() => {
    if (!config?.postId || elements.length === 0) {
      setHtml('');
      return;
    }
    setLoading(true);
    fetch(`${config.restUrl}preview/${config.postId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': config.nonce },
      body: JSON.stringify(elements),
    })
      .then((r) => r.json())
      .then((data) => {
        setHtml(data.html || '');
      })
      .catch(() => setHtml('<p style="padding:40px;text-align:center;color:#94a3b8">Preview unavailable</p>'))
      .finally(() => setLoading(false));
  }, [elements, config?.postId]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !html) return;
    const siteUrl = config?.restUrl?.replace('/wp-json/alawi/v1/', '') || '';
    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(`<!doctype html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="${siteUrl}/wp-content/themes/alawi-builder/assets/css/main.css">
<style>body{margin:0;font-family:'Segoe UI',Tahoma,sans-serif;line-height:1.7;color:#1e293b;direction:rtl}img{max-width:100%;height:auto}*{box-sizing:border-box}</style>
<style>${elementCss}</style>
</head><body>${html}
<script src="${siteUrl}/wp-content/themes/alawi-builder/assets/js/builder.js"><\/script>
</body></html>`);
    doc.close();
    const resize = () => {
      try {
        const h = doc.documentElement.scrollHeight;
        if (h > 0) iframe.style.height = h + 'px';
      } catch {}
    };
    iframe.onload = resize;
    setTimeout(resize, 200);
    setTimeout(resize, 1000);
  }, [html, elementCss]);

  if (elements.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No elements to preview</div>;
  }

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: 400 }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.8)', zIndex: 10 }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24, color: '#3b82f6' }} />
        </div>
      )}
      <iframe
        ref={iframeRef}
        style={{ width: '100%', minHeight: 400, border: 'none', display: 'block' }}
        title="Page Preview"
      />
    </div>
  );
}
