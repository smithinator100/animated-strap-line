import { useState, useCallback, useEffect } from "react";
import { AnimationPreset, DEFAULT_PRESET } from "./settings";
import { supabase } from "./supabase";

interface PresetBundle {
  version: 1;
  presets: { name: string; preset: AnimationPreset }[];
}

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
    const { data } = await supabase
      .from("presets")
      .select("name")
      .order("name");
    if (data) setPresetNames(data.map((r) => r.name));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const savePreset = useCallback(
    async (name: string, preset: AnimationPreset) => {
      await supabase
        .from("presets")
        .upsert({ name, data: preset, updated_at: new Date().toISOString() });
      await refresh();
    },
    [refresh],
  );

  const loadPreset = useCallback(
    async (name: string): Promise<AnimationPreset | null> => {
      const { data } = await supabase
        .from("presets")
        .select("data")
        .eq("name", name)
        .single();
      return data ? validatePreset(data.data) : null;
    },
    [],
  );

  const updatePreset = useCallback(
    async (name: string, preset: AnimationPreset) => {
      await supabase
        .from("presets")
        .upsert({ name, data: preset, updated_at: new Date().toISOString() });
    },
    [],
  );

  const deletePreset = useCallback(
    async (name: string) => {
      await supabase.from("presets").delete().eq("name", name);
      await refresh();
    },
    [refresh],
  );

  const loadAllPresets = useCallback(
    async (): Promise<{ name: string; preset: AnimationPreset }[]> => {
      const { data } = await supabase
        .from("presets")
        .select("name, data")
        .order("name");
      if (!data) return [];
      return data
        .map((r) => {
          const preset = validatePreset(r.data);
          return preset ? { name: r.name, preset } : null;
        })
        .filter((r): r is { name: string; preset: AnimationPreset } => r !== null);
    },
    [],
  );

  const exportPresets = useCallback(async () => {
    const all = await loadAllPresets();
    if (all.length === 0) return;
    const bundle: PresetBundle = { version: 1, presets: all };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "animation-presets.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [loadAllPresets]);

  const importPresets = useCallback(
    async (file: File): Promise<{ imported: number; skipped: string[] }> => {
      const text = await file.text();
      const data: unknown = JSON.parse(text);

      let entries: { name: unknown; preset: unknown }[];
      if (
        typeof data === "object" &&
        data !== null &&
        "presets" in data &&
        Array.isArray((data as PresetBundle).presets)
      ) {
        entries = (data as PresetBundle).presets;
      } else if (Array.isArray(data)) {
        entries = data;
      } else {
        throw new Error("Unrecognized preset file format");
      }

      let imported = 0;
      const skipped: string[] = [];

      for (const entry of entries) {
        const name = typeof entry.name === "string" ? entry.name.trim() : "";
        if (!name) { skipped.push("(unnamed)"); continue; }
        const validated = validatePreset(entry.preset);
        if (!validated) { skipped.push(name); continue; }
        await savePreset(name, validated);
        imported++;
      }

      return { imported, skipped };
    },
    [savePreset],
  );

  return {
    presetNames,
    savePreset,
    loadPreset,
    updatePreset,
    deletePreset,
    loadAllPresets,
    exportPresets,
    importPresets,
  };
}
