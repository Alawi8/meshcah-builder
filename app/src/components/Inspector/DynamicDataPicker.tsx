import { useState } from 'react';
import { DYNAMIC_TAGS, getTagsForProp } from '../../utils/dynamic-data';
import type { DynamicTag } from '../../utils/dynamic-data';

interface Props {
  propType: 'text' | 'url' | 'html';
  onInsert: (tag: string) => void;
}

export function DynamicDataPicker({ propType, onInsert }: Props) {
  const [open, setOpen] = useState(false);
  const [cfName, setCfName] = useState('');
  const tags = getTagsForProp(propType);

  const groups = new Map<string, DynamicTag[]>();
  for (const t of tags) {
    if (!groups.has(t.group)) groups.set(t.group, []);
    groups.get(t.group)!.push(t);
  }

  return (
    <div className="ab-dynamic">
      <button
        className="ab-dynamic__toggle"
        onClick={() => setOpen(!open)}
        title="Dynamic Data"
        type="button"
      >
        {open ? '✕' : '⚡'} Dynamic
      </button>

      {open && (
        <div className="ab-dynamic__dropdown">
          {Array.from(groups).map(([group, items]) => (
            <div key={group} className="ab-dynamic__group">
              <div className="ab-dynamic__group-label">{group}</div>
              {items.map((t) => (
                <button
                  key={t.tag}
                  className="ab-dynamic__item"
                  onClick={() => { onInsert(`{{${t.tag}}}`); setOpen(false); }}
                  type="button"
                >
                  {t.label}
                  <code className="ab-dynamic__tag-code">{`{{${t.tag}}}`}</code>
                </button>
              ))}
            </div>
          ))}

          {propType !== 'url' && (
            <div className="ab-dynamic__group">
              <div className="ab-dynamic__group-label">Custom Field</div>
              <div className="ab-dynamic__cf-row">
                <input
                  className="ab-field__input"
                  type="text"
                  placeholder="Field name"
                  value={cfName}
                  onChange={(e) => setCfName(e.target.value)}
                />
                <button
                  className="ab-dynamic__item"
                  onClick={() => {
                    if (cfName.trim()) {
                      onInsert(`{{custom_field:${cfName.trim()}}}`);
                      setCfName('');
                      setOpen(false);
                    }
                  }}
                  type="button"
                  disabled={!cfName.trim()}
                >
                  Insert
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
