import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store/editor-store';
import { useSettingsStore } from '../store/settings-store';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutosave(onStatusChange?: (status: AutosaveStatus) => void) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    function clearTimer() {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    function startTimer() {
      clearTimer();
      const { autosaveEnabled, autosaveInterval } = useSettingsStore.getState();
      if (!autosaveEnabled) return;
      const ms = Math.max(autosaveInterval, 10) * 1000;

      timerRef.current = setInterval(async () => {
        const editor = useEditorStore.getState();
        if (!editor.isDirty || editor.isSaving || savingRef.current) return;

        const config = window.alawiEditorConfig;
        if (!config?.postId) return;

        savingRef.current = true;
        onStatusChange?.('saving');
        editor.setSaving(true);

        try {
          const res = await fetch(`${config.restUrl}save/${config.postId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': config.nonce },
            body: JSON.stringify(editor.elements),
          });
          if (res.ok) {
            useEditorStore.getState().markClean();
            onStatusChange?.('saved');
          } else {
            onStatusChange?.('error');
          }
        } catch {
          onStatusChange?.('error');
        } finally {
          useEditorStore.getState().setSaving(false);
          savingRef.current = false;
        }
      }, ms);
    }

    const unsubSettings = useSettingsStore.subscribe((s) => {
      startTimer();
    });

    startTimer();
    return () => {
      clearTimer();
      unsubSettings();
    };
  }, [onStatusChange]);
}
