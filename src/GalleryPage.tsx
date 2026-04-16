import { useState, useEffect, useMemo, type CSSProperties } from "react";
import type { AnimationPreset } from "./settings";
import { AnimatedHeadline } from "@ddg-motion/animated-headline";
import { toHeadlines, toAnimationConfig } from "./adapt-settings";
import { usePresets } from "./usePresets";
import "./GalleryPage.css";

const SCENARIO_ORDER = ["Scenario A", "Scenario B"] as const;

const GALLERY_STYLE: CSSProperties = {
  "--ah-font-family": '"DuckSansDisplay", Inter, system-ui, sans-serif',
  "--ah-font-size": "24.7px",
  "--ah-line-height": "32.9px",
  "--ah-icon-size": "32px",
  "--ah-gap": "6px",
} as CSSProperties;

function GalleryPresetRow({ name, preset }: { name: string; preset: AnimationPreset }) {
  const headlines = useMemo(() => toHeadlines(preset), [preset]);
  const config = useMemo(() => toAnimationConfig(preset), [preset]);

  return (
    <li className="gallery-row">
      <span className="gallery-row-label">{name}</span>
      <div className="gallery-row-preview">
        <AnimatedHeadline
          headlines={headlines}
          settings={config}
          className="gallery-row-container"
          style={GALLERY_STYLE}
        />
      </div>
    </li>
  );
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

  const scenarioEntries = SCENARIO_ORDER.map((name) =>
    presets.find((p) => p.name === name),
  ).filter((e): e is { name: string; preset: AnimationPreset } => e !== undefined);

  const scenarioNameSet = new Set<string>(SCENARIO_ORDER);
  const animationExamples = presets.filter((p) => !scenarioNameSet.has(p.name));

  return (
    <div className="gallery">
      <div className="gallery-sections">
        {scenarioEntries.length > 0 ? (
          <section className="gallery-section" aria-labelledby="gallery-scenarios-heading">
            <h2 id="gallery-scenarios-heading" className="gallery-section-heading">
              Scenarios
            </h2>
            <ul className="gallery-list">
              {scenarioEntries.map(({ name, preset }) => (
                <GalleryPresetRow key={name} name={name} preset={preset} />
              ))}
            </ul>
          </section>
        ) : null}

        {animationExamples.length > 0 ? (
          <section
            className="gallery-section"
            aria-labelledby="gallery-animation-examples-heading"
          >
            <h2 id="gallery-animation-examples-heading" className="gallery-section-heading">
              Animation Examples
            </h2>
            <ul className="gallery-list">
              {animationExamples.map(({ name, preset }) => (
                <GalleryPresetRow key={name} name={name} preset={preset} />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
