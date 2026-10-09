import { useEditorStore } from '../../store/editor-store';
import { ElementsPanel } from './ElementsPanel';
import { StructurePanel } from './StructurePanel';
import { TemplatesPanel } from './TemplatesPanel';
import { ComponentsPanel } from './ComponentsPanel';
import type { PanelView } from '../../types';

const tabs: { key: PanelView; label: string; icon: string }[] = [
  { key: 'elements', label: 'Elements', icon: 'fa-solid fa-cube' },
  { key: 'structure', label: 'Structure', icon: 'fa-solid fa-sitemap' },
  { key: 'templates', label: 'Templates', icon: 'fa-solid fa-clone' },
  { key: 'components', label: 'Components', icon: 'fa-solid fa-puzzle-piece' },
];

export function Sidebar({ style }: { style?: React.CSSProperties }) {
  const activePanel = useEditorStore((s) => s.activePanel);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);

  return (
    <div className="ab-sidebar" style={style}>
      <div className="ab-sidebar__tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`ab-sidebar__tab ${activePanel === t.key ? 'ab-sidebar__tab--active' : ''}`}
            onClick={() => setActivePanel(t.key)}
            title={t.label}
          ><i className={t.icon} /></button>
        ))}
      </div>
      <div className="ab-sidebar__content">
        {activePanel === 'elements' && <ElementsPanel />}
        {activePanel === 'structure' && <StructurePanel />}
        {activePanel === 'templates' && <TemplatesPanel />}
        {activePanel === 'components' && <ComponentsPanel />}
      </div>
    </div>
  );
}
