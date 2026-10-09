import { useEffect } from 'react';
import { useGlobalStylesStore } from '../../store/global-styles-store';

const COLOR_LABELS: Record<string, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  text: 'Text',
  background: 'Background',
  muted: 'Muted',
  border: 'Border',
};

const FONT_LABELS: Record<string, string> = {
  heading: 'Headings',
  body: 'Body Text',
};

const SPACING_LABELS: Record<string, string> = {
  xs: 'Extra Small',
  sm: 'Small',
  md: 'Medium',
  lg: 'Large',
  xl: 'Extra Large',
};

export function GlobalStylesPanel() {
  const { styles, loadGlobalStyles, updateColor, updateFont, updateSpacing, saveGlobalStyles } = useGlobalStylesStore();

  useEffect(() => { loadGlobalStyles(); }, []);

  return (
    <div className="ab-globals">
      <div className="ab-globals__section">
        <div className="ab-globals__section-title"><i className="fa-solid fa-palette" /> Colors</div>
        {Object.entries(styles.colors).map(([key, val]) => (
          <div key={key} className="ab-globals__row">
            <label className="ab-globals__label">{COLOR_LABELS[key] || key}</label>
            <div className="ab-globals__color-row">
              <input type="color" value={val} onChange={(e) => updateColor(key, e.target.value)} className="ab-globals__color-input" />
              <input type="text" value={val} onChange={(e) => updateColor(key, e.target.value)} className="ab-field__input ab-globals__text-input" />
              <code className="ab-globals__var">--ab-color-{key}</code>
            </div>
          </div>
        ))}
      </div>

      <div className="ab-globals__section">
        <div className="ab-globals__section-title"><i className="fa-solid fa-font" /> Fonts</div>
        {Object.entries(styles.fonts).map(([key, val]) => (
          <div key={key} className="ab-globals__row">
            <label className="ab-globals__label">{FONT_LABELS[key] || key}</label>
            <input type="text" value={val} onChange={(e) => updateFont(key, e.target.value)} className="ab-field__input" />
            <code className="ab-globals__var">--ab-font-{key}</code>
          </div>
        ))}
      </div>

      <div className="ab-globals__section">
        <div className="ab-globals__section-title"><i className="fa-solid fa-ruler-combined" /> Spacing</div>
        {Object.entries(styles.spacing).map(([key, val]) => (
          <div key={key} className="ab-globals__row">
            <label className="ab-globals__label">{SPACING_LABELS[key] || key}</label>
            <div className="ab-globals__spacing-row">
              <input type="text" value={val} onChange={(e) => updateSpacing(key, e.target.value)} className="ab-field__input ab-globals__text-input" />
              <div className="ab-globals__spacing-preview" style={{ width: val, height: '8px', background: 'var(--ab-ed-primary)', borderRadius: '2px' }} />
              <code className="ab-globals__var">--ab-space-{key}</code>
            </div>
          </div>
        ))}
      </div>

      <button className="ab-globals__save" onClick={saveGlobalStyles}>Save Global Styles</button>
    </div>
  );
}
