import { useEditorStore } from '../../store/editor-store';
import { useDragStore } from '../../store/drag-store';
import { registry, CATEGORY_LABELS } from '../../blocks/registry';
import { findElement } from '../../utils/tree';

export function ElementsPanel() {
  const addElement = useEditorStore((s) => s.addElement);
  const elements = useEditorStore((s) => s.elements);
  const setDragging = useDragStore((s) => s.setDragging);
  const categories = registry.categories();

  const handleClick = (type: string) => {
    const { selectedId } = useEditorStore.getState();
    if (selectedId) {
      const el = findElement(elements, selectedId);
      if (el) {
        const def = registry.get(el.type);
        if (def?.canContain) {
          if (!def.allowedChildren || def.allowedChildren.includes(type)) {
            addElement(type, selectedId, el.children.length);
            return;
          }
        }
      }
    }
    addElement(type, null, elements.length);
  };

  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('newElementType', type);
    e.dataTransfer.effectAllowed = 'copy';
    setDragging(null, type);
  };

  const handleDragEnd = () => {
    setDragging(null);
  };

  return (
    <div className="ab-elements">
      {categories.map((cat) => (
        <div key={cat} className="ab-elements__cat">
          <div className="ab-elements__cat-label">{CATEGORY_LABELS[cat] || cat}</div>
          <div className="ab-elements__grid">
            {registry.getByCategory(cat).map((def) => (
              <button
                key={def.type}
                className="ab-elements__item"
                onClick={() => handleClick(def.type)}
                draggable
                onDragStart={(e) => handleDragStart(e, def.type)}
                onDragEnd={handleDragEnd}
                title={def.label}
              >
                <i className={`ab-elements__icon ${def.icon}`} />
                <span>{def.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
