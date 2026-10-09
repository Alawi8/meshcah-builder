import { create } from 'zustand';

export interface BuilderSettings {
  autosaveEnabled: boolean;
  autosaveInterval: number; // seconds
  headerTemplateId: number;
  footerTemplateId: number;
}

const DEFAULTS: BuilderSettings = {
  autosaveEnabled: true,
  autosaveInterval: 30,
  headerTemplateId: 0,
  footerTemplateId: 0,
};

interface SettingsState extends BuilderSettings {
  loaded: boolean;
  saving: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<BuilderSettings>) => Promise<void>;
}

function getConfig() {
  return window.alawiEditorConfig as { restUrl: string; nonce: string } | undefined;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  loaded: false,
  saving: false,

  async loadSettings() {
    const config = getConfig();
    if (!config) return;
    try {
      const res = await fetch(`${config.restUrl}settings`, {
        headers: { 'X-WP-Nonce': config.nonce },
      });
      if (res.ok) {
        const data = await res.json();
        set({ ...DEFAULTS, ...data, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  async updateSettings(partial) {
    const config = getConfig();
    if (!config) return;
    const prev = get();
    const merged: BuilderSettings = {
      autosaveEnabled: partial.autosaveEnabled ?? prev.autosaveEnabled,
      autosaveInterval: partial.autosaveInterval ?? prev.autosaveInterval,
      headerTemplateId: partial.headerTemplateId ?? prev.headerTemplateId,
      footerTemplateId: partial.footerTemplateId ?? prev.footerTemplateId,
    };
    set({ ...merged, saving: true });
    try {
      await fetch(`${config.restUrl}settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': config.nonce },
        body: JSON.stringify(merged),
      });
    } catch {
      // silent
    } finally {
      set({ saving: false });
    }
  },
}));
