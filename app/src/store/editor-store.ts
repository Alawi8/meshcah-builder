import { create } from 'zustand';
import type { BuilderElement, DevicePreview, PanelView, InspectorTab } from '../types';
import { removeElement, insertElement, updateElement, deepClone, findElement, findParent } from '../utils/tree';
import { generateId } from '../utils/id';
import { registry } from '../blocks/registry';
import { makeResponsive } from '../utils/style-engine';

interface HistoryEntry {
  elements: BuilderElement[];
  label: string;
}

interface EditorState {
  elements: BuilderElement[];
  isDirty: boolean;
  isSaving: boolean;

  selectedId: string | null;
  hoveredId: string | null;

  activePanel: PanelView;
  devicePreview: DevicePreview;
  inspectorTab: InspectorTab;
  previewMode: boolean;
  sidebarOpen: boolean;
  inspectorOpen: boolean;

  history: HistoryEntry[];
  historyIndex: number;

  addElement: (type: string, parentId: string | null, position: number) => void;
  removeElement: (id: string) => void;
  moveElement: (id: string, newParentId: string | null, position: number) => void;
  updateElementProps: (id: string, props: Record<string, unknown>) => void;
  updateElementStyles: (id: string, styles: Record<string, unknown>) => void;
  updateResponsiveStyle: (id: string, key: string, value: string) => void;
  duplicateElement: (id: string) => void;
  commitStyleChange: () => void;
  setElements: (elements: BuilderElement[]) => void;

  selectElement: (id: string | null) => void;
  hoverElement: (id: string | null) => void;

  setActivePanel: (panel: PanelView) => void;
  setDevicePreview: (device: DevicePreview) => void;
  setInspectorTab: (tab: InspectorTab) => void;
  setPreviewMode: (on: boolean) => void;
  toggleSidebar: () => void;
  toggleInspector: () => void;

  undo: () => void;
  redo: () => void;
  pushHistory: (label: string) => void;

  setSaving: (saving: boolean) => void;
  markClean: () => void;
}

const MAX_HISTORY = 50;

const config = window.alawiEditorConfig;

export const useEditorStore = create<EditorState>((set, get) => ({
  elements: config?.elements ?? [],
  isDirty: false,
  isSaving: false,
  selectedId: null,
  hoveredId: null,
  activePanel: 'elements',
  devicePreview: 'desktop',
  inspectorTab: 'content',
  previewMode: false,
  sidebarOpen: true,
  inspectorOpen: true,
  history: [],
  historyIndex: -1,

  addElement(type, parentId, position) {
    const def = registry.get(type);
    if (!def) return;
    const el: BuilderElement = {
      id: generateId(),
      type,
      props: { ...def.defaultProps },
      styles: { ...def.defaultStyles },
      children: [],
    };
    get().pushHistory(`Add ${def.label}`);
    set((s) => ({
      elements: insertElement(s.elements, parentId, el, position),
      isDirty: true,
      selectedId: el.id,
    }));
  },

  removeElement(id) {
    get().pushHistory('Remove element');
    set((s) => ({
      elements: removeElement(s.elements, id),
      isDirty: true,
      selectedId: s.selectedId === id ? null : s.selectedId,
    }));
  },

  moveElement(id, newParentId, position) {
    const { elements } = get();
    const el = findElement(elements, id);
    if (!el) return;
    get().pushHistory('Move element');
    const without = removeElement(elements, id);
    set({
      elements: insertElement(without, newParentId, el, position),
      isDirty: true,
    });
  },

  updateElementProps(id, props) {
    set((s) => ({
      elements: updateElement(s.elements, id, { props }),
      isDirty: true,
    }));
  },

  updateElementStyles(id, styles) {
    set((s) => ({
      elements: updateElement(s.elements, id, { styles }),
      isDirty: true,
    }));
  },

  updateResponsiveStyle(id, key, value) {
    const el = findElement(get().elements, id);
    if (!el) return;
    const currentVal = el.styles[key];
    const newVal = makeResponsive(currentVal, get().devicePreview, value);
    set((s) => ({
      elements: updateElement(s.elements, id, { styles: { [key]: newVal } }),
      isDirty: true,
    }));
  },

  commitStyleChange() {
    get().pushHistory('Update style');
  },

  duplicateElement(id) {
    const { elements } = get();
    const el = findElement(elements, id);
    if (!el) return;
    const clone = deepClone(el);
    const loc = findParent(elements, id);
    const parentId = loc?.parent?.id ?? null;
    const position = (loc?.index ?? elements.length - 1) + 1;
    get().pushHistory('Duplicate element');
    set((s) => ({
      elements: insertElement(s.elements, parentId, clone, position),
      isDirty: true,
      selectedId: clone.id,
    }));
  },

  setElements(elements) {
    set({ elements, isDirty: false });
  },

  selectElement(id) {
    set({ selectedId: id, inspectorTab: 'content' });
  },
  hoverElement(id) {
    set({ hoveredId: id });
  },

  setPreviewMode(on) { set({ previewMode: on }); },
  setActivePanel(panel) { set({ activePanel: panel, sidebarOpen: true }); },
  setDevicePreview(device) { set({ devicePreview: device }); },
  setInspectorTab(tab) { set({ inspectorTab: tab }); },
  toggleSidebar() { set((s) => ({ sidebarOpen: !s.sidebarOpen })); },
  toggleInspector() { set((s) => ({ inspectorOpen: !s.inspectorOpen })); },

  pushHistory(label) {
    set((s) => {
      const entry: HistoryEntry = {
        elements: JSON.parse(JSON.stringify(s.elements)),
        label,
      };
      const history = s.history.slice(0, s.historyIndex + 1);
      history.push(entry);
      if (history.length > MAX_HISTORY) history.shift();
      return { history, historyIndex: history.length - 1 };
    });
  },

  undo() {
    set((s) => {
      if (s.historyIndex < 0) return s;
      const entry = s.history[s.historyIndex];
      return {
        elements: JSON.parse(JSON.stringify(entry.elements)),
        historyIndex: s.historyIndex - 1,
        isDirty: true,
      };
    });
  },

  redo() {
    set((s) => {
      if (s.historyIndex >= s.history.length - 1) return s;
      const entry = s.history[s.historyIndex + 1];
      return {
        elements: JSON.parse(JSON.stringify(entry.elements)),
        historyIndex: s.historyIndex + 1,
        isDirty: true,
      };
    });
  },

  setSaving(saving) { set({ isSaving: saving }); },
  markClean() { set({ isDirty: false }); },
}));
