import { useState, useEffect } from "react";
import { AnimationPreset, AnimationSettings, DEFAULT_SETTINGS } from "./settings";
import { AnimationPreview } from "./AnimationPreview";
import { usePresets } from "./usePresets";
import "./GalleryPage.css";

function presetToSettings(preset: AnimationPreset): AnimationSettings {
  return { ...preset, headlines: DEFAULT_SETTINGS.headlines.map((h) => ({ ...h })) };
}

export function GalleryPage() {
  const { loadAllPresets } = usePresets();
  const [presets, setPresets] = useState<{ name: string; preset: AnimationPreset }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    loadAllPresets().then((all) => {
      if (!cancelled) {
        setPresets(all);
        setIsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [loadAllPresets]);

  if (isLoading) {
    return (
      <div className="gallery-empty">
        <p className="gallery-empty-text">Loading presets...</p>
      </div>
    );
  }

  if (presets.length === 0) {
    return (
      <div className="gallery-empty">
        <p className="gallery-empty-text">No presets saved yet.</p>
        <p className="gallery-empty-hint">Switch to Create and save a preset to see it here.</p>
      </div>
    );
  }

  return (
    <div className="gallery">
      <div className="gallery-grid">
        {presets.map(({ name, preset }) => (
          <div key={name} className="gallery-card">
            <div className="gallery-card-preview">
              <AnimationPreview
                settings={presetToSettings(preset)}
                className="gallery-card-container"
              />
            </div>
            <span className="gallery-card-label">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
