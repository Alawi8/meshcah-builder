import { create } from 'zustand';
import type { ComponentDefinition, BuilderElement } from '../types';
import { generateId } from '../utils/id';
import { deepClone } from '../utils/tree';

function getConfig() {
  return window.alawiEditorConfig as { restUrl: string; nonce: string } | undefined;
}

interface ComponentState {
  components: ComponentDefinition[];
  loading: boolean;
  loadComponents: () => Promise<void>;
  createComponent: (name: string, elements: BuilderElement[]) => Promise<ComponentDefinition>;
  updateComponent: (id: string, elements: BuilderElement[]) => Promise<void>;
  renameComponent: (id: string, name: string) => Promise<void>;
  deleteComponent: (id: string) => Promise<void>;
  getComponent: (id: string) => ComponentDefinition | undefined;
}

export const useComponentStore = create<ComponentState>((set, get) => ({
  components: [],
  loading: false,

  async loadComponents() {
    set({ loading: true });
    try {
      const res = await fetch(`${getConfig()?.restUrl}components`, {
        headers: { 'X-WP-Nonce': getConfig()?.nonce ?? '' },
      });
      const data = await res.json();
      set({ components: Array.isArray(data) ? data : [], loading: false });
    } catch {
      set({ loading: false });
    }
  },

  async createComponent(name, elements) {
    const comp: ComponentDefinition = {
      id: 'comp_' + generateId(),
      name,
      elements: deepClone({ id: '', type: '', props: {}, styles: {}, children: elements }).children,
      created: Date.now(),
    };
    await fetch(`${getConfig()?.restUrl}components`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': getConfig()?.nonce ?? '' },
      body: JSON.stringify(comp),
    });
    set((s) => ({ components: [...s.components, comp] }));
    return comp;
  },

  async updateComponent(id, elements) {
    const comps = get().components.map((c) =>
      c.id === id ? { ...c, elements: JSON.parse(JSON.stringify(elements)) } : c
    );
    set({ components: comps });
    const comp = comps.find((c) => c.id === id);
    if (comp) {
      await fetch(`${getConfig()?.restUrl}components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': getConfig()?.nonce ?? '' },
        body: JSON.stringify(comp),
      });
    }
  },

  async renameComponent(id, name) {
    const comps = get().components.map((c) =>
      c.id === id ? { ...c, name } : c
    );
    set({ components: comps });
    const comp = comps.find((c) => c.id === id);
    if (comp) {
      await fetch(`${getConfig()?.restUrl}components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': getConfig()?.nonce ?? '' },
        body: JSON.stringify(comp),
      });
    }
  },

  async deleteComponent(id) {
    await fetch(`${getConfig()?.restUrl}components/${id}`, {
      method: 'DELETE',
      headers: { 'X-WP-Nonce': getConfig()?.nonce ?? '' },
    });
    set((s) => ({ components: s.components.filter((c) => c.id !== id) }));
  },

  getComponent(id) {
    return get().components.find((c) => c.id === id);
  },
}));
