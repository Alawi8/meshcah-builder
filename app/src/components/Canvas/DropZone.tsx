import { useState } from 'react';
import { useEditorStore } from '../../store/editor-store';
import { useDragStore } from '../../store/drag-store';
import { registry } from '../../blocks/registry';
import { isDescendant, findElement } from '../../utils/tree';

interface Props {
  parentId: string | null;
  index: number;
}

export function DropZone({ parentId, index }: Props) {
  const [active, setActive] = useState(false);
  const moveElement = useEditorStore((s) => s.moveElement);
  const addElement = useEditorStore((s) => s.addElement);
  const draggingId = useDragStore((s) => s.draggingId);
  const draggingType = useDragStore((s) => s.draggingType);
  const isDragging = draggingId !== null || draggingType !== null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const hasDragId = e.dataTransfer.types.includes('elementid');
    const hasNewType = e.dataTransfer.types.includes('newelementtype');

    if (!hasDragId && !hasNewType) return;

    if (hasDragId && draggingId) {
      if (draggingId === parentId) return;
      const elements = useEditorStore.getState().elements;
      if (parentId && isDescendant(elements, draggingId, parentId)) return;
    }

    if (hasNewType && draggingType && parentId) {
      const elements = useEditorStore.getState().elements;
      const parent = findElement(elements, parentId);
      if (parent) {
        const def = registry.get(parent.type);
        if (def?.allowedChildren && !def.allowedChildren.includes(draggingType)) return;
      }
    }

    e.dataTransfer.dropEffect = hasDragId ? 'move' : 'copy';
    setActive(true);
  };

  return (
    <div
      className={`ab-dropzone ${active ? 'ab-dropzone--active' : ''} ${isDragging ? 'ab-dropzone--visible' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={() => setActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setActive(false);

        const dragId = e.dataTransfer.getData('elementId');
        const newType = e.dataTransfer.getData('newElementType');

        if (dragId) {
          if (dragId === parentId) return;
          const elements = useEditorStore.getState().elements;
          if (parentId && isDescendant(elements, dragId, parentId)) return;
          moveElement(dragId, parentId, index);
        } else if (newType) {
          addElement(newType, parentId, index);
        }
      }}
    />
  );
}
