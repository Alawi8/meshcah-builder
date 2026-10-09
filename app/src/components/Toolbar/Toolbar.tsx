import { useEffect, useState, useRef } from 'react';
import { useEditorStore } from '../../store/editor-store';
import { useTemplateStore } from '../../store/template-store';
import { usePostDataStore } from '../../store/post-data-store';
import type { DevicePreview } from '../../types';
import type { AutosaveStatus } from '../../hooks/useAutosave';

const devices: { key: DevicePreview; icon: string; label: string }[] = [
  { key: 'desktop', icon: 'fa-solid fa-desktop', label: 'Desktop' },
  { key: 'tablet', icon: 'fa-solid fa-tablet-screen-button', label: 'Tablet' },
  { key: 'mobile', icon: 'fa-solid fa-mobile-screen-button', label: 'Mobile' },
];

export function Toolbar({ autosaveStatus }: { autosaveStatus?: AutosaveStatus }) {
  const device = useEditorStore((s) => s.devicePreview);
  const setDevice = useEditorStore((s) => s.setDevicePreview);
  const isDirty = useEditorStore((s) => s.isDirty);
  const isSaving = useEditorStore((s) => s.isSaving);
  const historyIndex = useEditorStore((s) => s.historyIndex);
  const historyLen = useEditorStore((s) => s.history.length);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const toggleSidebar = useEditorStore((s) => s.toggleSidebar);
  const toggleInspector = useEditorStore((s) => s.toggleInspector);
  const previewMode = useEditorStore((s) => s.previewMode);
  const setPreviewMode = useEditorStore((s) => s.setPreviewMode);

  const pageTitle = usePostDataStore((s) => s.data.post_title);
  const [pageNavOpen, setPageNavOpen] = useState(false);
  const pages = useTemplateStore((s) => s.pages);
  const pagesLoading = useTemplateStore((s) => s.pagesLoading);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (useEditorStore.getState().isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setPageNavOpen(false);
      }
    };
    if (pageNavOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pageNavOpen]);

  const handlePageNavToggle = () => {
    if (!pageNavOpen) {
      useTemplateStore.getState().loadPages();
    }
    setPageNavOpen(!pageNavOpen);
  };

  const navigateToPage = (editUrl: string) => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Leave without saving?')) return;
    }
    window.location.href = editUrl;
  };

  const handleSave = async () => {
    const { elements, setSaving, markClean } = useEditorStore.getState();
    const config = window.alawiEditorConfig;
    setSaving(true);
    try {
      if (config?.postId) {
        await fetch(`${config.restUrl}save/${config.postId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': config.nonce },
          body: JSON.stringify(elements),
        });
      }
      markClean();
    } catch (e) {
      console.error('[Meshcah] Save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  const currentPostId = window.alawiEditorConfig?.postId;
  const permalink = usePostDataStore((s) => s.data.permalink);

  return (
    <div className="ab-toolbar">
      <button className="ab-btn-icon" onClick={toggleSidebar} disabled={previewMode} title="Sidebar"><i className="fa-solid fa-bars" /></button>

      <div className="ab-toolbar__group">
        <button className="ab-btn-icon" onClick={undo} disabled={previewMode || historyIndex < 0} title="Undo (Ctrl+Z)"><i className="fa-solid fa-rotate-left" /></button>
        <button className="ab-btn-icon" onClick={redo} disabled={previewMode || historyIndex >= historyLen - 1} title="Redo (Ctrl+Shift+Z)"><i className="fa-solid fa-rotate-right" /></button>
      </div>

      <div className="ab-toolbar__sep" />

      <div className="ab-toolbar__mode">
        <button className={`ab-btn-icon ${!previewMode ? 'ab-toolbar__mode-btn--active' : ''}`} onClick={() => setPreviewMode(false)} title="Edit"><i className="fa-solid fa-pen" /></button>
        <button className={`ab-btn-icon ${previewMode ? 'ab-toolbar__mode-btn--active' : ''}`} onClick={() => setPreviewMode(true)} title="Preview"><i className="fa-solid fa-eye" /></button>
      </div>

      <div className="ab-toolbar__sep" />

      <div className="ab-toolbar__devices">
        {devices.map((d) => (
          <button
            key={d.key}
            className={`ab-toolbar__device ${device === d.key ? 'ab-toolbar__device--active' : ''}`}
            onClick={() => setDevice(d.key)}
            title={d.label}
          ><i className={d.icon} /></button>
        ))}
      </div>

      <div className="ab-toolbar__spacer" />

      {pageTitle && <span className="ab-toolbar__page-title">{pageTitle}</span>}

      <div className="ab-toolbar__spacer" />

      <div className="ab-status">
        <span className={`ab-status__dot ${isSaving ? 'ab-status__dot--saving' : isDirty ? 'ab-status__dot--dirty' : ''}`} />
        {isSaving ? 'Saving...' : isDirty ? 'Unsaved' : 'Saved'}
        {autosaveStatus === 'saved' && <span className="ab-status__autosave">Auto-saved</span>}
        {autosaveStatus === 'error' && <span className="ab-status__autosave ab-status__autosave--error">Autosave failed</span>}
      </div>

      <div className="ab-toolbar__sep" />

      {/* Page Navigation */}
      <div className="ab-page-nav" ref={navRef}>
        <button className="ab-btn-icon" onClick={handlePageNavToggle} title="Navigate Pages">
          <i className="fa-solid fa-file-lines" />
          <i className={`fa-solid fa-chevron-${pageNavOpen ? 'up' : 'down'}`} style={{ fontSize: '8px', marginLeft: '4px' }} />
        </button>
        {pageNavOpen && (
          <div className="ab-page-nav__dropdown">
            <div className="ab-page-nav__header">Pages & Templates</div>
            {pagesLoading ? (
              <div className="ab-page-nav__item ab-page-nav__item--loading">Loading...</div>
            ) : pages.length === 0 ? (
              <div className="ab-page-nav__item ab-page-nav__item--empty">No pages found</div>
            ) : (
              <div className="ab-page-nav__list">
                {pages.map((p) => (
                  <button
                    key={p.id}
                    className={`ab-page-nav__item ${p.id === currentPostId ? 'ab-page-nav__item--active' : ''}`}
                    onClick={() => navigateToPage(p.editUrl)}
                  >
                    <i className={`fa-solid ${p.type === 'post' ? 'fa-file-pen' : p.type === 'alawi_theme_tpl' ? 'fa-palette' : 'fa-file'}`} />
                    <span className="ab-page-nav__title">{p.title || '(no title)'}</span>
                    <span className="ab-page-nav__meta">
                      {p.type === 'alawi_theme_tpl' ? 'Template' : p.type}
                      {p.status !== 'publish' ? ` · ${p.status}` : ''}
                    </span>
                    {p.id === currentPostId && <i className="fa-solid fa-circle" style={{ fontSize: '6px', color: '#22c55e' }} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <button className="ab-btn-icon" onClick={toggleInspector} disabled={previewMode} title="Inspector"><i className="fa-solid fa-gear" /></button>
      <button className="ab-btn-icon" onClick={() => { const url = permalink || (currentPostId ? '/?p=' + currentPostId : ''); if (url) window.open(url, '_blank'); }} title="View Page"><i className="fa-solid fa-arrow-up-right-from-square" /></button>
      <button className="ab-btn-icon ab-btn-icon--save" onClick={handleSave} disabled={isSaving || !isDirty} title={isSaving ? 'Saving...' : 'Save'}><i className={`fa-solid ${isSaving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`} /></button>
    </div>
  );
}
