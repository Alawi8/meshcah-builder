import { useEffect, useState } from 'react';
import { useComponentStore } from '../../store/component-store';
import { useEditorStore } from '../../store/editor-store';
import { deepClone } from '../../utils/tree';
import { generateId } from '../../utils/id';
import type { BuilderElement } from '../../types';

export function ComponentsPanel() {
  const { components, loading, loadComponents, deleteComponent } = useComponentStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => { loadComponents(); }, []);

  const handleInsert = (compId: string) => {
    const store = useEditorStore.getState();
    const el: BuilderElement = {
      id: generateId(),
      type: 'component',
      props: { componentId: compId },
      styles: {},
      children: [],
    };
    store.pushHistory('Insert component');
    store.setElements([...store.elements, el]);
    useEditorStore.setState({ isDirty: true, selectedId: el.id });
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      useComponentStore.getState().renameComponent(id, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="ab-components">
      <div className="ab-components__header">
        <span className="ab-globals__section-title"><i className="fa-solid fa-puzzle-piece" /> Components</span>
      </div>

      {loading ? (
        <p className="ab-field__hint">Loading...</p>
      ) : components.length === 0 ? (
        <p className="ab-field__hint">No components. Select an element and click "Create Component" from element actions.</p>
      ) : (
        <div className="ab-components__list">
          {components.map((comp) => (
            <div key={comp.id} className="ab-templates__item">
              <div className="ab-templates__item-info">
                {editingId === comp.id ? (
                  <input
                    className="ab-field__input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleRename(comp.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRename(comp.id); }}
                    autoFocus
                  />
                ) : (
                  <span className="ab-templates__item-name">{comp.name}</span>
                )}
                <span className="ab-templates__item-cat">{comp.elements.length} element(s)</span>
              </div>
              <div className="ab-templates__item-actions">
                <button onClick={() => handleInsert(comp.id)} title="Insert">+</button>
                <button onClick={() => { setEditingId(comp.id); setEditName(comp.name); }} title="Rename">✎</button>
                <button onClick={() => deleteComponent(comp.id)} title="Delete">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
