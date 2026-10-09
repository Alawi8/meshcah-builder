import { useState, useRef, useCallback } from 'react';
import { useEditorStore } from '../../store/editor-store';
import { useDragStore } from '../../store/drag-store';
import { registry } from '../../blocks/registry';
import { isDescendant, deepClone, findElement } from '../../utils/tree';
import type { BuilderElement } from '../../types';

type DropPosition = 'before' | 'inside' | 'after';

// ── Multi-select store (local to structure panel) ──
let selectedIds: Set<string> = new Set();
let listeners: (() => void)[] = [];
function useMultiSelect() {
  const [, forceUpdate] = useState(0);
  const rerender = useCallback(() => forceUpdate((n) => n + 1), []);

  useState(() => { listeners.push(rerender); return () => { listeners = listeners.filter((l) => l !== rerender); }; });

  const notify = () => listeners.forEach((l) => l());

  return {
    selected: selectedIds,
    toggle(id: string) { selectedIds.has(id) ? selectedIds.delete(id) : selectedIds.add(id); notify(); },
    add(id: string) { selectedIds.add(id); notify(); },
    clear() { selectedIds.clear(); notify(); },
    isSelected: (id: string) => selectedIds.has(id),
    count: selectedIds.size,
  };
}

// ── Clipboard paste ──
function PasteJson() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const handleClipboardPaste = async () => {
    setStatus('idle');
    setMsg('');
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) { setStatus('error'); setMsg('Clipboard is empty'); return; }
      const parsed = JSON.parse(text);
      const els: BuilderElement[] = Array.isArray(parsed) ? parsed : [parsed];
      for (const el of els) {
        if (!el.id || !el.type) throw new Error('Invalid element: missing id or type');
      }
      const store = useEditorStore.getState();
      store.pushHistory('Paste JSON');
      store.setElements([...store.elements, ...els]);
      useEditorStore.setState({ isDirty: true });
      setStatus('success');
      setMsg(`Imported ${els.length} element(s)`);
      setTimeout(() => { setStatus('idle'); setMsg(''); }, 2000);
    } catch (e: unknown) {
      setStatus('error');
      setMsg((e as Error).message || 'Invalid JSON');
    }
  };

  return (
    <div className="ab-paste-json">
      <button className="ab-paste-json__toggle" onClick={handleClipboardPaste} title="Read JSON from clipboard and import">
        <i className="fa-solid fa-clipboard" /> Paste from Clipboard
      </button>
      {msg && <div className={`ab-paste-json__msg ab-paste-json__msg--${status}`}>{msg}</div>}
    </div>
  );
}

// ── Toolbar for multi-select actions ──
function StructureToolbar() {
  const ms = useMultiSelect();
  const [copyMsg, setCopyMsg] = useState('');

  const handleCopyJson = async () => {
    if (ms.count === 0) return;
    const elements = useEditorStore.getState().elements;
    const collected: BuilderElement[] = [];
    const collectById = (els: BuilderElement[]) => {
      for (const el of els) {
        if (ms.selected.has(el.id)) collected.push(el);
        else collectById(el.children);
      }
    };
    collectById(elements);
    try {
      await navigator.clipboard.writeText(JSON.stringify(collected, null, 2));
      setCopyMsg(`Copied ${collected.length}`);
      setTimeout(() => setCopyMsg(''), 1500);
    } catch {
      setCopyMsg('Failed');
      setTimeout(() => setCopyMsg(''), 1500);
    }
  };

  const handleDuplicate = () => {
    if (ms.count === 0) return;
    const store = useEditorStore.getState();
    store.pushHistory('Duplicate selected');
    const ids = Array.from(ms.selected);
    for (const id of ids) {
      store.duplicateElement(id);
    }
  };

  const handleDelete = () => {
    if (ms.count === 0) return;
    const store = useEditorStore.getState();
    store.pushHistory('Delete selected');
    const ids = Array.from(ms.selected);
    for (const id of ids) {
      store.removeElement(id);
    }
    ms.clear();
  };

  const handleSelectAll = () => {
    const elements = useEditorStore.getState().elements;
    const addAll = (els: BuilderElement[]) => {
      for (const el of els) { ms.add(el.id); addAll(el.children); }
    };
    addAll(elements);
  };

  if (ms.count === 0) return null;

  return (
    <div className="ab-structure__toolbar">
      <span className="ab-structure__toolbar-count">{ms.count} selected</span>
      <button onClick={handleCopyJson} title="Copy JSON"><i className="fa-solid fa-copy" /></button>
      <button onClick={handleDuplicate} title="Duplicate"><i className="fa-solid fa-clone" /></button>
      <button onClick={handleDelete} title="Delete" className="ab-structure__toolbar-del"><i className="fa-solid fa-trash" /></button>
      <button onClick={handleSelectAll} title="Select All"><i className="fa-solid fa-check-double" /></button>
      <button onClick={() => ms.clear()} title="Deselect All"><i className="fa-solid fa-xmark" /></button>
      {copyMsg && <span className="ab-structure__toolbar-msg">{copyMsg}</span>}
    </div>
  );
}

export function StructurePanel() {
  const elements = useEditorStore((s) => s.elements);
  return (
    <div className="ab-structure">
      <div className="ab-structure__header">
        <PasteJson />
      </div>
      <StructureToolbar />
      {elements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--ab-ed-text-dim)' }}>No elements yet</div>
      ) : (
        elements.map((el, i) => (
          <TreeItem key={el.id} element={el} depth={0} parentId={null} index={i} />
        ))
      )}
    </div>
  );
}

function TreeItem({ element, depth, parentId, index }: { element: BuilderElement; depth: number; parentId: string | null; index: number }) {
  const selectedId = useEditorStore((s) => s.selectedId);
  const select = useEditorStore((s) => s.selectElement);
  const moveElement = useEditorStore((s) => s.moveElement);
  const updateProps = useEditorStore((s) => s.updateElementProps);
  const setDragging = useDragStore((s) => s.setDragging);
  const draggingId = useDragStore((s) => s.draggingId);
  const def = registry.get(element.type);
  const canContain = def?.canContain ?? (element.type === 'section' || element.type === 'container');
  const ms = useMultiSelect();

  const [collapsed, setCollapsed] = useState(false);
  const [dropPos, setDropPos] = useState<DropPosition | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState('');
  const itemRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('elementId', element.id);
    e.dataTransfer.effectAllowed = 'move';
    setDragging(element.id);
  };

  const handleDragEnd = () => {
    setDragging(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggingId || draggingId === element.id) return;
    const elements = useEditorStore.getState().elements;
    if (isDescendant(elements, draggingId, element.id)) return;

    const rect = itemRef.current?.getBoundingClientRect();
    if (!rect) return;
    const y = e.clientY - rect.top;
    const h = rect.height;

    if (canContain && y > h * 0.25 && y < h * 0.75) {
      setDropPos('inside');
    } else if (y <= h * 0.25) {
      setDropPos('before');
    } else {
      setDropPos('after');
    }
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = () => setDropPos(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const dragId = e.dataTransfer.getData('elementId');
    if (!dragId || dragId === element.id) { setDropPos(null); return; }
    const elements = useEditorStore.getState().elements;
    if (isDescendant(elements, dragId, element.id)) { setDropPos(null); return; }

    if (dropPos === 'inside') {
      moveElement(dragId, element.id, element.children.length);
    } else if (dropPos === 'before') {
      moveElement(dragId, parentId, index);
    } else if (dropPos === 'after') {
      moveElement(dragId, parentId, index + 1);
    }
    setDropPos(null);
  };

  const startRename = () => {
    setRenameVal((element.props.label as string) || def?.label || element.type);
    setRenaming(true);
  };

  const commitRename = () => {
    const val = renameVal.trim();
    if (val && val !== (def?.label || element.type)) {
      updateProps(element.id, { label: val });
    }
    setRenaming(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.stopPropagation();
      ms.toggle(element.id);
      return;
    }
    if (ms.count > 0) {
      ms.clear();
    }
    select(element.id);
  };

  const handleCopySingle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const elements = useEditorStore.getState().elements;
    const el = findElement(elements, element.id);
    if (el) {
      await navigator.clipboard.writeText(JSON.stringify(el, null, 2));
    }
  };

  const displayLabel = (element.props.label as string) || def?.label || element.type;
  const hasChildren = element.children.length > 0;
  const isMultiSelected = ms.isSelected(element.id);

  return (
    <div className="ab-structure__node">
      <div
        ref={itemRef}
        className={`ab-structure__item ${selectedId === element.id ? 'ab-structure__item--selected' : ''} ${isMultiSelected ? 'ab-structure__item--multi' : ''} ${dropPos ? `ab-structure__item--drop-${dropPos}` : ''}`}
        onClick={handleClick}
        onDoubleClick={startRename}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ paddingInlineStart: 8 + depth * 16 }}
      >
        {hasChildren ? (
          <button
            className="ab-structure__toggle"
            onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
          >
            <i className={`fa-solid fa-chevron-${collapsed ? 'right' : 'down'}`} />
          </button>
        ) : (
          <span className="ab-structure__toggle-spacer" />
        )}
        <i className={`ab-structure__icon ${def?.icon || 'fa-solid fa-question'}`} />
        {renaming ? (
          <input
            className="ab-structure__rename"
            value={renameVal}
            onChange={(e) => setRenameVal(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(false); }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="ab-structure__label">{displayLabel}</span>
        )}
        {selectedId === element.id && !renaming && (
          <span className="ab-structure__item-actions">
            <button onClick={handleCopySingle} title="Copy JSON"><i className="fa-solid fa-copy" /></button>
            <button onClick={(e) => { e.stopPropagation(); useEditorStore.getState().duplicateElement(element.id); }} title="Duplicate"><i className="fa-solid fa-clone" /></button>
            <button onClick={(e) => { e.stopPropagation(); useEditorStore.getState().removeElement(element.id); }} title="Delete" className="ab-structure__action-del"><i className="fa-solid fa-trash" /></button>
          </span>
        )}
        {hasChildren && !selectedId && (
          <span className="ab-structure__count">{element.children.length}</span>
        )}
      </div>
      {hasChildren && !collapsed && (
        <div className="ab-structure__children">
          {element.children.map((c, i) => (
            <TreeItem key={c.id} element={c} depth={depth + 1} parentId={element.id} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
