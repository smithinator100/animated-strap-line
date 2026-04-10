import { useState } from "react";
import {
  AnimationSettings,
  DEFAULT_SETTINGS,
  makeHeadlineId,
} from "./settings";
import { AnimationPreview } from "./AnimationPreview";
import { SettingsPanel } from "./SettingsPanel";
import { GalleryPage } from "./GalleryPage";
import "./App.css";

type Page = "gallery" | "create";

export function App() {
  const [page, setPage] = useState<Page>("gallery");
  const [settings, setSettings] = useState<AnimationSettings>({
    ...DEFAULT_SETTINGS,
    headlines: DEFAULT_SETTINGS.headlines.map((h) => ({ ...h, id: makeHeadlineId() })),
  });

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
            <AnimationPreview settings={settings} className="container" />
          </div>
          <SettingsPanel settings={settings} onChange={setSettings} />
        </>
      )}
    </div>
  );
}
