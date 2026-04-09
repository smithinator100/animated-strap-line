import { useState, useCallback, useEffect } from "react";
import { AnimationPreset, DEFAULT_PRESET } from "./settings";

function validatePreset(data: unknown): AnimationPreset | null {
  if (typeof data !== "object" || data === null || Array.isArray(data))
    return null;

  const record = data as Record<string, unknown>;
  const result = { ...DEFAULT_PRESET };

  for (const key of Object.keys(DEFAULT_PRESET) as (keyof AnimationPreset)[]) {
    if (!(key in record)) continue;
    const expected = typeof DEFAULT_PRESET[key];
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
    async (name: string, preset: AnimationPreset) => {
      await fetch(`/api/presets/${encodeURIComponent(name)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preset, null, 2),
      });
      await refresh();
    },
    [refresh],
  );

  const loadPreset = useCallback(
    async (name: string): Promise<AnimationPreset | null> => {
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
    async (name: string, preset: AnimationPreset) => {
      await fetch(`/api/presets/${encodeURIComponent(name)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preset, null, 2),
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
