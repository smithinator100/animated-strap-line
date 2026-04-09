import { useState } from "react";
import {
  AnimationSettings,
  DEFAULT_SETTINGS,
  EASING_KEYS,
  EASING_LABELS,
  ICON_OPTIONS,
  Headline,
  makeHeadlineId,
} from "./settings";
import { usePresets } from "./usePresets";
import "./SettingsPanel.css";

interface SettingsPanelProps {
  settings: AnimationSettings;
  onChange: (settings: AnimationSettings) => void;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="sp-field">
      <span className="sp-label">
        {label}
        <span className="sp-value">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function CurveSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="sp-field">
      <span className="sp-label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {EASING_KEYS.map((key) => (
          <option key={key} value={key}>
            {EASING_LABELS[key]}
          </option>
        ))}
      </select>
    </label>
  );
}

function Accordion({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="sp-accordion">
      <button
        className="sp-accordion-header"
        onClick={() => setIsOpen((o) => !o)}
        type="button"
      >
        <span className="sp-accordion-title">{title}</span>
        <span className={`sp-accordion-chevron ${isOpen ? "sp-accordion-chevron--open" : ""}`}>
          &#9662;
        </span>
      </button>
      {isOpen && <div className="sp-accordion-body">{children}</div>}
    </section>
  );
}

function HeadlineRow({
  headline,
  index,
  total,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  headline: Headline;
  index: number;
  total: number;
  onUpdate: (h: Headline) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="sp-headline-row">
      <div className="sp-headline-order">
        <button
          className="sp-headline-move"
          disabled={index === 0}
          onClick={onMoveUp}
          title="Move up"
          type="button"
        >
          &#9650;
        </button>
        <button
          className="sp-headline-move"
          disabled={index === total - 1}
          onClick={onMoveDown}
          title="Move down"
          type="button"
        >
          &#9660;
        </button>
      </div>

      <div className="sp-headline-fields">
        <input
          type="text"
          className="sp-headline-text"
          value={headline.text}
          onChange={(e) => onUpdate({ ...headline, text: e.target.value })}
          placeholder='e.g. Browse the web {icon} privately'
        />
        {!headline.text.includes("{icon}") && (
          <span className="sp-hint">
            Use <code>{"{icon}"}</code> to place the icon
          </span>
        )}
        <div className="sp-icon-select-wrapper">
          {headline.iconSrc && (
            <img
              className="sp-icon-preview"
              src={ICON_OPTIONS.find((o) => o.key === headline.iconSrc)?.src}
              alt=""
            />
          )}
          <select
            className="sp-icon-select"
            value={headline.iconSrc}
            onChange={(e) => onUpdate({ ...headline, iconSrc: e.target.value })}
          >
            {ICON_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        className="sp-headline-remove"
        disabled={total <= 1}
        onClick={onRemove}
        title="Remove headline"
        type="button"
      >
        &times;
      </button>
    </div>
  );
}

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const {
    presetNames,
    savePreset,
    loadPreset,
    updatePreset,
    deletePreset,
  } = usePresets();

  const [newPresetName, setNewPresetName] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);

  function patch(partial: Partial<AnimationSettings>) {
    onChange({ ...settings, ...partial });
  }

  function updateHeadline(index: number, updated: Headline) {
    const headlines = settings.headlines.map((h, i) => (i === index ? updated : h));
    patch({ headlines });
  }

  function removeHeadline(index: number) {
    if (settings.headlines.length <= 1) return;
    patch({ headlines: settings.headlines.filter((_, i) => i !== index) });
  }

  function moveHeadline(from: number, to: number) {
    if (to < 0 || to >= settings.headlines.length) return;
    const headlines = [...settings.headlines];
    const [moved] = headlines.splice(from, 1);
    headlines.splice(to, 0, moved);
    patch({ headlines });
  }

  function addHeadline() {
    const defaultIcon =
      ICON_OPTIONS.find((o) => o.key.includes("Shield"))?.key ??
      ICON_OPTIONS[0]?.key ??
      "";
    patch({
      headlines: [
        ...settings.headlines,
        { id: makeHeadlineId(), text: "{icon}", iconSrc: defaultIcon },
      ],
    });
  }

  async function handleSave() {
    const name = newPresetName.trim();
    if (!name) return;
    const { headlines: _, ...preset } = settings;
    await savePreset(name, preset);
    setActivePreset(name);
    setNewPresetName("");
  }

  async function handleLoad(name: string) {
    const loaded = await loadPreset(name);
    if (loaded) {
      onChange({ ...loaded, headlines: settings.headlines });
      setActivePreset(name);
    }
  }

  async function handleUpdate(name: string) {
    const { headlines: _, ...preset } = settings;
    await updatePreset(name, preset);
    setActivePreset(name);
  }

  async function handleDelete(name: string) {
    await deletePreset(name);
    if (activePreset === name) setActivePreset(null);
  }

  return (
    <aside className="sp-panel">
      <div className="sp-header">
        <h2 className="sp-title">Settings</h2>
        <button
          className="sp-reset"
          onClick={() =>
            onChange({
              ...DEFAULT_SETTINGS,
              headlines: DEFAULT_SETTINGS.headlines.map((h) => ({
                ...h,
                id: makeHeadlineId(),
              })),
            })
          }
        >
          Reset
        </button>
      </div>

      {/* Headlines */}
      <section className="sp-section">
        <h3 className="sp-section-title">Headlines</h3>
        {settings.headlines.map((h, i) => (
          <HeadlineRow
            key={h.id}
            headline={h}
            index={i}
            total={settings.headlines.length}
            onUpdate={(updated) => updateHeadline(i, updated)}
            onRemove={() => removeHeadline(i)}
            onMoveUp={() => moveHeadline(i, i - 1)}
            onMoveDown={() => moveHeadline(i, i + 1)}
          />
        ))}
        <button className="sp-headline-add" onClick={addHeadline} type="button">
          + Add headline
        </button>
      </section>

      {/* Presets */}
      <section className="sp-section">
        <h3 className="sp-section-title">Presets</h3>

        <select
          className="sp-preset-select"
          value={activePreset ?? ""}
          onChange={(e) => {
            const name = e.target.value;
            if (name) handleLoad(name);
            else setActivePreset(null);
          }}
        >
          <option value="">-- Select preset --</option>
          {presetNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <div className="sp-preset-save">
          <input
            type="text"
            placeholder="Preset name"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
          />
        </div>

        <div className="sp-preset-actions">
          <button
            className="sp-preset-btn"
            disabled={!newPresetName.trim()}
            onClick={handleSave}
          >
            Save
          </button>
          <button
            className="sp-preset-btn"
            disabled={!activePreset}
            onClick={() => {
              if (activePreset) handleUpdate(activePreset);
            }}
            title={activePreset ? `Overwrite "${activePreset}"` : ""}
          >
            Update
          </button>
          <button
            className="sp-preset-btn sp-preset-btn--del"
            disabled={!activePreset}
            onClick={() => {
              if (activePreset) handleDelete(activePreset);
            }}
            title={activePreset ? `Delete "${activePreset}"` : ""}
          >
            Delete
          </button>
        </div>
      </section>

      {/* Display Duration */}
      <section className="sp-section">
        <SliderRow
          label="Display duration"
          value={settings.displayDuration}
          min={0.5}
          max={10}
          step={0.5}
          unit="s"
          onChange={(v) => patch({ displayDuration: v })}
        />
      </section>

      {/* Intro Accordion */}
      <Accordion title="Intro" defaultOpen>
        <div className="sp-accordion-group">
          <h4 className="sp-group-title">Text</h4>
          <SliderRow
            label="Speed"
            value={settings.textIntroSpeed}
            min={0}
            max={150}
            step={5}
            unit="ms"
            onChange={(v) => patch({ textIntroSpeed: v })}
          />
          <CurveSelect
            label="Curve"
            value={settings.textIntroCurve}
            onChange={(v) => patch({ textIntroCurve: v })}
          />
          <SliderRow
            label="Letter overlap"
            value={settings.textOverlap}
            min={1}
            max={30}
            step={1}
            unit="x"
            onChange={(v) => patch({ textOverlap: v })}
          />
          <label className="sp-field sp-toggle">
            <span className="sp-label">Blur</span>
            <input
              type="checkbox"
              checked={settings.textBlur > 0}
              onChange={(e) => patch({ textBlur: e.target.checked ? 8 : 0 })}
            />
          </label>
          {settings.textBlur > 0 && (
            <SliderRow
              label="Blur amount"
              value={settings.textBlur}
              min={1}
              max={20}
              step={1}
              unit="px"
              onChange={(v) => patch({ textBlur: v })}
            />
          )}
          <label className="sp-field sp-toggle">
            <span className="sp-label">Scale</span>
            <input
              type="checkbox"
              checked={settings.textScale > 0}
              onChange={(e) => patch({ textScale: e.target.checked ? 0.6 : 0 })}
            />
          </label>
          {settings.textScale > 0 && (
            <SliderRow
              label="Scale from"
              value={settings.textScale}
              min={0.1}
              max={2}
              step={0.05}
              unit=""
              onChange={(v) => patch({ textScale: v })}
            />
          )}
          <SliderRow
            label="Pre / post stagger"
            value={settings.textStagger}
            min={-500}
            max={500}
            step={10}
            unit="ms"
            onChange={(v) => patch({ textStagger: v })}
          />
        </div>

        <div className="sp-accordion-group">
          <h4 className="sp-group-title">Icon</h4>
          <SliderRow
            label="Delay"
            value={settings.iconDelay}
            min={-500}
            max={500}
            step={10}
            unit="ms"
            onChange={(v) => patch({ iconDelay: v })}
          />
          <SliderRow
            label="Speed"
            value={settings.iconIntroSpeed}
            min={0}
            max={1000}
            step={10}
            unit="ms"
            onChange={(v) => patch({ iconIntroSpeed: v })}
          />
          <CurveSelect
            label="Curve"
            value={settings.iconIntroCurve}
            onChange={(v) => patch({ iconIntroCurve: v })}
          />
          <SliderRow
            label="Scale in"
            value={settings.iconScaleIn}
            min={0}
            max={2}
            step={0.05}
            unit=""
            onChange={(v) => patch({ iconScaleIn: v })}
          />
          <SliderRow
            label="Scale out"
            value={settings.iconScaleOut}
            min={0.5}
            max={2}
            step={0.05}
            unit=""
            onChange={(v) => patch({ iconScaleOut: v })}
          />
          <SliderRow
            label="Opacity in"
            value={settings.iconOpacityIn}
            min={0}
            max={1}
            step={0.05}
            unit=""
            onChange={(v) => patch({ iconOpacityIn: v })}
          />
          <SliderRow
            label="Opacity out"
            value={settings.iconOpacityOut}
            min={0}
            max={1}
            step={0.05}
            unit=""
            onChange={(v) => patch({ iconOpacityOut: v })}
          />
        </div>
      </Accordion>

      {/* Outro Accordion */}
      <Accordion title="Outro">
        <div className="sp-accordion-group">
          <h4 className="sp-group-title">Text</h4>
          <SliderRow
            label="Speed"
            value={settings.textOutroSpeed}
            min={0}
            max={150}
            step={5}
            unit="ms"
            onChange={(v) => patch({ textOutroSpeed: v })}
          />
          <CurveSelect
            label="Curve"
            value={settings.textOutroCurve}
            onChange={(v) => patch({ textOutroCurve: v })}
          />
          <SliderRow
            label="Letter overlap"
            value={settings.textOutroOverlap}
            min={1}
            max={30}
            step={1}
            unit="x"
            onChange={(v) => patch({ textOutroOverlap: v })}
          />
          <label className="sp-field sp-toggle">
            <span className="sp-label">Blur</span>
            <input
              type="checkbox"
              checked={settings.textOutroBlur > 0}
              onChange={(e) => patch({ textOutroBlur: e.target.checked ? 8 : 0 })}
            />
          </label>
          {settings.textOutroBlur > 0 && (
            <SliderRow
              label="Blur amount"
              value={settings.textOutroBlur}
              min={1}
              max={20}
              step={1}
              unit="px"
              onChange={(v) => patch({ textOutroBlur: v })}
            />
          )}
          <label className="sp-field sp-toggle">
            <span className="sp-label">Scale</span>
            <input
              type="checkbox"
              checked={settings.textOutroScale > 0}
              onChange={(e) => patch({ textOutroScale: e.target.checked ? 0.6 : 0 })}
            />
          </label>
          {settings.textOutroScale > 0 && (
            <SliderRow
              label="Scale to"
              value={settings.textOutroScale}
              min={0.1}
              max={2}
              step={0.05}
              unit=""
              onChange={(v) => patch({ textOutroScale: v })}
            />
          )}
          <SliderRow
            label="Pre / post stagger"
            value={settings.textOutroStagger}
            min={-500}
            max={500}
            step={10}
            unit="ms"
            onChange={(v) => patch({ textOutroStagger: v })}
          />
        </div>

        <div className="sp-accordion-group">
          <h4 className="sp-group-title">Icon</h4>
          <SliderRow
            label="Delay"
            value={settings.iconOutroDelay}
            min={-500}
            max={500}
            step={10}
            unit="ms"
            onChange={(v) => patch({ iconOutroDelay: v })}
          />
          <SliderRow
            label="Speed"
            value={settings.iconOutroSpeed}
            min={0}
            max={1000}
            step={10}
            unit="ms"
            onChange={(v) => patch({ iconOutroSpeed: v })}
          />
          <CurveSelect
            label="Curve"
            value={settings.iconOutroCurve}
            onChange={(v) => patch({ iconOutroCurve: v })}
          />
          <SliderRow
            label="Scale from"
            value={settings.iconOutroScaleFrom}
            min={0}
            max={2}
            step={0.05}
            unit=""
            onChange={(v) => patch({ iconOutroScaleFrom: v })}
          />
          <SliderRow
            label="Scale to"
            value={settings.iconOutroScaleTo}
            min={0}
            max={2}
            step={0.05}
            unit=""
            onChange={(v) => patch({ iconOutroScaleTo: v })}
          />
          <SliderRow
            label="Opacity from"
            value={settings.iconOutroOpacityFrom}
            min={0}
            max={1}
            step={0.05}
            unit=""
            onChange={(v) => patch({ iconOutroOpacityFrom: v })}
          />
          <SliderRow
            label="Opacity to"
            value={settings.iconOutroOpacityTo}
            min={0}
            max={1}
            step={0.05}
            unit=""
            onChange={(v) => patch({ iconOutroOpacityTo: v })}
          />
        </div>
      </Accordion>
    </aside>
  );
}
