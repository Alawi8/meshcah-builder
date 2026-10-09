import { useEffect, useState, useCallback, useRef } from 'react';
import { Toolbar } from './components/Toolbar/Toolbar';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Canvas } from './components/Canvas/Canvas';
import { Inspector } from './components/Inspector/Inspector';
import { useEditorStore } from './store/editor-store';
import { useComponentStore } from './store/component-store';
import { usePostDataStore } from './store/post-data-store';
import { useSettingsStore } from './store/settings-store';
import { useAutosave, type AutosaveStatus } from './hooks/useAutosave';
import './App.css';

export function App() {
  const sidebarOpen = useEditorStore((s) => s.sidebarOpen);
  const inspectorOpen = useEditorStore((s) => s.inspectorOpen);
  const selectedId = useEditorStore((s) => s.selectedId);
  const previewMode = useEditorStore((s) => s.previewMode);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle');
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const resizing = useRef(false);

  const onAutosaveStatus = useCallback((status: AutosaveStatus) => {
    setAutosaveStatus(status);
    if (status === 'saved' || status === 'error') {
      setTimeout(() => setAutosaveStatus('idle'), 3000);
    }
  }, []);

  useAutosave(onAutosaveStatus);

  useEffect(() => {
    useComponentStore.getState().loadComponents();
    usePostDataStore.getState().loadPostData();
    useSettingsStore.getState().loadSettings();
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = true;
    const startX = e.clientX;
    const startW = sidebarWidth;
    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const newW = Math.min(500, Math.max(180, startW + (ev.clientX - startX)));
      setSidebarWidth(newW);
    };
    const onUp = () => {
      resizing.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [sidebarWidth]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (previewMode) return;
      if (e.key === 'Delete' && selectedId) {
        useEditorStore.getState().removeElement(selectedId);
      }
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useEditorStore.getState().undo();
      }
      if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey) || (e.key === 'Z' && e.shiftKey))) {
        e.preventDefault();
        useEditorStore.getState().redo();
      }
      if (e.ctrlKey && e.key === 'd' && selectedId) {
        e.preventDefault();
        useEditorStore.getState().duplicateElement(selectedId);
      }
      if (e.key === 'Escape') {
        useEditorStore.getState().selectElement(null);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedId, previewMode]);

  const showSidebar = !previewMode && sidebarOpen;
  const showInspector = !previewMode && inspectorOpen && !!selectedId;
  const bodyClass = `ab-editor__body${!showSidebar && !showInspector ? ' ab-editor__body--full' : ''}`;

  return (
    <div className="ab-editor">
      <Toolbar autosaveStatus={autosaveStatus} />
      <div className={bodyClass}>
        {showSidebar && (
          <>
            <Sidebar style={{ width: sidebarWidth }} />
            <div className="ab-sidebar__resize" onMouseDown={handleResizeStart} />
          </>
        )}
        <Canvas />
        {showInspector && <Inspector />}
      </div>
    </div>
  );
}
