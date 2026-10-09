import { useEffect, useState, useRef } from 'react';
import { useTemplateStore } from '../../store/template-store';
import { useEditorStore } from '../../store/editor-store';
import { deepClone } from '../../utils/tree';
import type { Template } from '../../types';

const CATEGORY_LABELS: Record<string, string> = {
  page: 'Pages',
  section: 'Sections',
  block: 'Blocks',
};

export function TemplatesPanel() {
  const { templates, loading, loadTemplates, saveTemplate, deleteTemplate, duplicateTemplate, exportTemplate, importTemplate } = useTemplateStore();
  const elements = useEditorStore((s) => s.elements);
  const [showSave, setShowSave] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Template['category']>('section');
  const [filter, setFilter] = useState<string>('all');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadTemplates(); }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    await saveTemplate(name.trim(), category, elements);
    setName('');
    setShowSave(false);
  };

  const handleInsert = (tpl: Template) => {
    const store = useEditorStore.getState();
    const cloned = deepClone({ id: '', type: '', props: {}, styles: {}, children: tpl.elements }).children;
    store.pushHistory('Insert template');
    useEditorStore.setState((s) => ({
      elements: [...s.elements, ...cloned],
      isDirty: true,
    }));
  };

  const handleReplace = (tpl: Template) => {
    if (!confirm('This will replace all current content. Continue?')) return;
    const cloned = deepClone({ id: '', type: '', props: {}, styles: {}, children: tpl.elements }).children;
    const store = useEditorStore.getState();
    store.pushHistory('Apply template');
    useEditorStore.setState({ elements: cloned, isDirty: true });
  };

  const handleExport = (tpl: Template) => {
    const json = exportTemplate(tpl);
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tpl.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.meshcah.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    setImportError('');
    setImportSuccess('');
    fileRef.current?.click();
  };

  const handleClipboardImport = async () => {
    setImportError('');
    setImportSuccess('');
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) { setImportError('Clipboard is empty'); return; }
      const result = importTemplate(text);
      if (!result.success) { setImportError(result.error || 'Import failed'); return; }
      if (result.template) {
        const config = window.alawiEditorConfig;
        if (config) {
          const res = await fetch(`${config.restUrl}templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': config.nonce },
            body: JSON.stringify(result.template),
          });
          if (res.ok) {
            useTemplateStore.setState((s) => ({ templates: [...s.templates, result.template!] }));
            setImportSuccess(`Imported "${result.template.name}" from clipboard`);
          } else {
            setImportError('Failed to save imported template');
          }
        }
      }
    } catch {
      setImportError('Failed to read clipboard or invalid format');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    setImportSuccess('');
    try {
      const text = await file.text();
      const result = importTemplate(text);
      if (!result.success) {
        setImportError(result.error || 'Import failed');
        return;
      }
      if (result.template) {
        const config = window.alawiEditorConfig;
        if (config) {
          const res = await fetch(`${config.restUrl}templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': config.nonce },
            body: JSON.stringify(result.template),
          });
          if (res.ok) {
            useTemplateStore.setState((s) => ({ templates: [...s.templates, result.template!] }));
            setImportSuccess(`Imported "${result.template.name}" successfully`);
          } else {
            setImportError('Failed to save imported template');
          }
        }
      }
    } catch {
      setImportError('Failed to read file');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleExportCurrent = () => {
    const pageName = document.title.replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'page';
    const tpl: Template = {
      id: 'export',
      name: pageName,
      category: 'page',
      elements,
      created: Date.now(),
    };
    handleExport(tpl);
  };

  const filtered = filter === 'all' ? templates : templates.filter((t) => t.category === filter);
  const builtinTemplates = filtered.filter((t) => t.builtin);
  const userTemplates = filtered.filter((t) => !t.builtin);

  return (
    <div className="ab-templates">
      <input ref={fileRef} type="file" accept=".json,.meshcah.json" style={{ display: 'none' }} onChange={handleFileChange} />

      <div className="ab-templates__actions">
        <button className="ab-templates__save-btn" onClick={() => setShowSave(!showSave)}>
          <i className="fa-solid fa-floppy-disk" /> {showSave ? 'Cancel' : 'Save Template'}
        </button>
        <button className="ab-templates__save-btn" onClick={handleImportClick}>
          <i className="fa-solid fa-file-import" /> Import
        </button>
        <button className="ab-templates__save-btn" onClick={handleClipboardImport}>
          <i className="fa-solid fa-clipboard" /> Paste
        </button>
        <button className="ab-templates__save-btn" onClick={handleExportCurrent}>
          <i className="fa-solid fa-file-export" /> Export Page
        </button>
      </div>

      {importError && <div className="ab-templates__msg ab-templates__msg--error"><i className="fa-solid fa-circle-exclamation" /> {importError}</div>}
      {importSuccess && <div className="ab-templates__msg ab-templates__msg--success"><i className="fa-solid fa-circle-check" /> {importSuccess}</div>}

      {showSave && (
        <div className="ab-templates__form">
          <input className="ab-field__input" type="text" placeholder="Template name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <select className="ab-field__input ab-field__input--select" value={category} onChange={(e) => setCategory(e.target.value as Template['category'])}>
            <option value="page">Full Page</option>
            <option value="section">Section</option>
            <option value="block">Block</option>
          </select>
          <button className="ab-templates__insert-btn" onClick={handleSave} disabled={!name.trim()}>Save</button>
        </div>
      )}

      <div className="ab-templates__filter">
        {['all', 'page', 'section', 'block'].map((f) => (
          <button key={f} className={`ab-templates__filter-btn ${filter === f ? 'ab-templates__filter-btn--active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : CATEGORY_LABELS[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="ab-field__hint">Loading...</p>
      ) : (
        <>
          {builtinTemplates.length > 0 && (
            <>
              <div className="ab-templates__section-header">
                <i className="fa-solid fa-shield" /> Built-in Templates
              </div>
              <div className="ab-templates__list">
                {builtinTemplates.map((tpl) => (
                  <div key={tpl.id} className="ab-templates__item ab-templates__item--builtin">
                    <div className="ab-templates__item-info">
                      <span className="ab-templates__item-name">{tpl.name}</span>
                      <span className="ab-templates__item-cat">{CATEGORY_LABELS[tpl.category]}</span>
                    </div>
                    <div className="ab-templates__item-actions">
                      <button onClick={() => handleReplace(tpl)} title="Apply (replace all)"><i className="fa-solid fa-file-circle-plus" /></button>
                      <button onClick={() => handleInsert(tpl)} title="Insert (append)"><i className="fa-solid fa-plus" /></button>
                      <button onClick={() => duplicateTemplate(tpl.id)} title="Duplicate to My Templates"><i className="fa-solid fa-copy" /></button>
                      <button onClick={() => handleExport(tpl)} title="Export"><i className="fa-solid fa-download" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {userTemplates.length > 0 && (
            <>
              <div className="ab-templates__section-header">
                <i className="fa-solid fa-user" /> My Templates
              </div>
              <div className="ab-templates__list">
                {userTemplates.map((tpl) => (
                  <div key={tpl.id} className="ab-templates__item">
                    <div className="ab-templates__item-info">
                      <span className="ab-templates__item-name">{tpl.name}</span>
                      <span className="ab-templates__item-cat">{CATEGORY_LABELS[tpl.category]}</span>
                    </div>
                    <div className="ab-templates__item-actions">
                      <button onClick={() => handleReplace(tpl)} title="Apply (replace all)"><i className="fa-solid fa-file-circle-plus" /></button>
                      <button onClick={() => handleInsert(tpl)} title="Insert (append)"><i className="fa-solid fa-plus" /></button>
                      <button onClick={() => duplicateTemplate(tpl.id)} title="Duplicate"><i className="fa-solid fa-copy" /></button>
                      <button onClick={() => handleExport(tpl)} title="Export"><i className="fa-solid fa-download" /></button>
                      <button onClick={() => { if (confirm(`Delete "${tpl.name}"?`)) deleteTemplate(tpl.id); }} title="Delete"><i className="fa-solid fa-trash" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {builtinTemplates.length === 0 && userTemplates.length === 0 && (
            <p className="ab-field__hint">No templates in this category</p>
          )}
        </>
      )}
    </div>
  );
}
