import { useState } from "react";
import {
  AnimationSettings,
  DEFAULT_SETTINGS,
  EASING_KEYS,
  EASING_LABELS,
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

  async function handleSave() {
    const name = newPresetName.trim();
    if (!name) return;
    await savePreset(name, settings);
    setActivePreset(name);
    setNewPresetName("");
  }

  async function handleLoad(name: string) {
    const loaded = await loadPreset(name);
    if (loaded) {
      onChange(loaded);
      setActivePreset(name);
    }
  }

  async function handleUpdate(name: string) {
    await updatePreset(name, settings);
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
          onClick={() => onChange({ ...DEFAULT_SETTINGS })}
        >
          Reset
        </button>
      </div>

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
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
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
            onClick={() => { if (activePreset) handleUpdate(activePreset); }}
            title={activePreset ? `Overwrite "${activePreset}"` : ""}
          >
            Update
          </button>
          <button
            className="sp-preset-btn sp-preset-btn--del"
            disabled={!activePreset}
            onClick={() => { if (activePreset) handleDelete(activePreset); }}
            title={activePreset ? `Delete "${activePreset}"` : ""}
          >
            Delete
          </button>
        </div>
      </section>

      <section className="sp-section">
        <h3 className="sp-section-title">Text</h3>
        <label className="sp-field">
          <span className="sp-label">Before icon</span>
          <input
            type="text"
            value={settings.preText}
            onChange={(e) => patch({ preText: e.target.value })}
          />
        </label>
        <label className="sp-field">
          <span className="sp-label">After icon</span>
          <input
            type="text"
            value={settings.postText}
            onChange={(e) => patch({ postText: e.target.value })}
          />
        </label>
      </section>

      <section className="sp-section">
        <h3 className="sp-section-title">Text Animation</h3>
        <SliderRow
          label="Intro speed"
          value={settings.textIntroSpeed}
          min={0}
          max={150}
          step={5}
          unit="ms"
          onChange={(v) => patch({ textIntroSpeed: v })}
        />
        <CurveSelect
          label="Intro curve"
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
      </section>

      <section className="sp-section">
        <h3 className="sp-section-title">Icon Animation</h3>
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
          label="Intro speed"
          value={settings.iconIntroSpeed}
          min={0}
          max={1000}
          step={10}
          unit="ms"
          onChange={(v) => patch({ iconIntroSpeed: v })}
        />
        <CurveSelect
          label="Intro curve"
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
      </section>
    </aside>
  );
}
