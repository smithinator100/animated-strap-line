import { useState, useMemo } from "react";
import {
  DEFAULT_SETTINGS,
  makeHeadlineId,
} from "./settings";
import type { AnimationSettings } from "./settings";
import { AnimatedHeadline } from "@ddg-motion/animated-headline";
import { toHeadlines, toAnimationConfig } from "./adapt-settings";
import { SettingsPanel } from "./SettingsPanel";
import { GalleryPage } from "./GalleryPage";
import "./App.css";

type Page = "gallery" | "create";

const PROTOTYPE_STYLE = {
  "--ah-font-family": '"DuckSansDisplay", Inter, system-ui, sans-serif',
  "--ah-font-size": "24.7px",
  "--ah-line-height": "32.9px",
  "--ah-icon-size": "32px",
  "--ah-gap": "6px",
} as React.CSSProperties;

export function App() {
  const [page, setPage] = useState<Page>("gallery");
  const [settings, setSettings] = useState<AnimationSettings>({
    ...DEFAULT_SETTINGS,
    headlines: DEFAULT_SETTINGS.headlines.map((h) => ({ ...h, id: makeHeadlineId() })),
  });

  const headlines = useMemo(() => toHeadlines(settings), [settings]);
  const animationConfig = useMemo(() => toAnimationConfig(settings), [settings]);

  return (
    <div className="page">
      <nav className="page-tabs">
        <button
          className={`page-tab ${page === "gallery" ? "page-tab--active" : ""}`}
          onClick={() => setPage("gallery")}
          type="button"
        >
          Gallery
        </button>
        <button
          className={`page-tab ${page === "create" ? "page-tab--active" : ""}`}
          onClick={() => setPage("create")}
          type="button"
        >
          Create
        </button>
      </nav>

      {page === "gallery" ? (
        <GalleryPage />
      ) : (
        <>
          <div className="preview">
            <AnimatedHeadline
              headlines={headlines}
              settings={animationConfig}
              className="container"
              style={PROTOTYPE_STYLE}
            />
          </div>
          <SettingsPanel settings={settings} onChange={setSettings} />
        </>
      )}
    </div>
  );
}
