import { useState, useCallback, useEffect } from "react";
import { AnimationSettings, DEFAULT_SETTINGS } from "./settings";

function validatePreset(data: unknown): AnimationSettings | null {
  if (typeof data !== "object" || data === null || Array.isArray(data))
    return null;

  const record = data as Record<string, unknown>;
  const result = { ...DEFAULT_SETTINGS };

  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof AnimationSettings)[]) {
    if (!(key in record)) continue;
    const expected = typeof DEFAULT_SETTINGS[key];
    if (typeof record[key] === expected) {
      (result as Record<string, unknown>)[key] = record[key];
    }
  }

  return result;
}

export function usePresets() {
  const [presetNames, setPresetNames] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/presets");
      if (res.ok) setPresetNames(await res.json());
    } catch {
      console.warn("Failed to list presets");
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const savePreset = useCallback(
    async (name: string, settings: AnimationSettings) => {
      await fetch(`/api/presets/${encodeURIComponent(name)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings, null, 2),
      });
      await refresh();
    },
    [refresh],
  );

  const loadPreset = useCallback(
    async (name: string): Promise<AnimationSettings | null> => {
      try {
        const res = await fetch(`/api/presets/${encodeURIComponent(name)}`);
        if (!res.ok) return null;
        return validatePreset(await res.json());
      } catch {
        console.warn(`Failed to load preset "${name}"`);
        return null;
      }
    },
    [],
  );

  const updatePreset = useCallback(
    async (name: string, settings: AnimationSettings) => {
      await fetch(`/api/presets/${encodeURIComponent(name)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings, null, 2),
      });
    },
    [],
  );

  const deletePreset = useCallback(
    async (name: string) => {
      await fetch(`/api/presets/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      await refresh();
    },
    [refresh],
  );

  return {
    presetNames,
    savePreset,
    loadPreset,
    updatePreset,
    deletePreset,
  };
}
