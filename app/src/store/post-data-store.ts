import { create } from 'zustand';

function getConfig() {
  return window.alawiEditorConfig as { restUrl: string; nonce: string; postId: number } | undefined;
}

interface PostDataState {
  data: Record<string, string>;
  loaded: boolean;
  loadPostData: () => Promise<void>;
}

export const usePostDataStore = create<PostDataState>((set) => ({
  data: {},
  loaded: false,

  async loadPostData() {
    const config = getConfig();
    if (!config) return;
    try {
      const res = await fetch(`${config.restUrl}post-data/${config.postId}`, {
        headers: { 'X-WP-Nonce': config.nonce },
      });
      const data = await res.json();
      set({ data: data ?? {}, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
}));
