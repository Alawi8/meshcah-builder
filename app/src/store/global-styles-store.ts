import { create } from 'zustand';
import type { GlobalStyles } from '../types';
import { DEFAULT_GLOBAL_STYLES } from '../types';

interface GlobalStylesState {
  styles: GlobalStyles;
  loading: boolean;
  loadGlobalStyles: () => Promise<void>;
  updateColor: (key: string, value: string) => void;
  updateFont: (key: string, value: string) => void;
  updateSpacing: (key: string, value: string) => void;
  saveGlobalStyles: () => Promise<void>;
  applyCssVars: () => void;
}

function getConfig() {
  return window.alawiEditorConfig as { restUrl: string; nonce: string } | undefined;
}

export const useGlobalStylesStore = create<GlobalStylesState>((set, get) => ({
  styles: DEFAULT_GLOBAL_STYLES,
  loading: false,

  async loadGlobalStyles() {
    const config = getConfig();
    if (!config) return;
    set({ loading: true });
    try {
      const res = await fetch(`${config.restUrl}global-styles`, {
        headers: { 'X-WP-Nonce': config.nonce },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.colors) {
          set({ styles: { ...DEFAULT_GLOBAL_STYLES, ...data } });
        }
      }
    } catch { /* ignore */ }
    set({ loading: false });
    get().applyCssVars();
  },

  updateColor(key, value) {
    set((s) => ({
      styles: { ...s.styles, colors: { ...s.styles.colors, [key]: value } },
    }));
    get().applyCssVars();
  },

  updateFont(key, value) {
    set((s) => ({
      styles: { ...s.styles, fonts: { ...s.styles.fonts, [key]: value } },
    }));
    get().applyCssVars();
  },

  updateSpacing(key, value) {
    set((s) => ({
      styles: { ...s.styles, spacing: { ...s.styles.spacing, [key]: value } },
    }));
    get().applyCssVars();
  },

  async saveGlobalStyles() {
    const config = getConfig();
    if (!config) return;
    try {
      await fetch(`${config.restUrl}global-styles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': config.nonce },
        body: JSON.stringify(get().styles),
      });
    } catch { /* ignore */ }
  },

  applyCssVars() {
    const { colors, fonts, spacing } = get().styles;
    const root = document.documentElement;
    for (const [k, v] of Object.entries(colors)) root.style.setProperty(`--ab-color-${k}`, v);
    for (const [k, v] of Object.entries(fonts)) root.style.setProperty(`--ab-font-${k}`, v);
    for (const [k, v] of Object.entries(spacing)) root.style.setProperty(`--ab-space-${k}`, v);
  },
}));
