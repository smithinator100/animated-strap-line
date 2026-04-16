import { EASING_CURVES } from "./easing";
import type {
  AnimationConfig,
  DeepPartial,
  HeadlineConfig,
  HeadlineToken,
  LowMotionConfig,
  LowPerformanceConfig,
  ParsedHeadline,
  TextAnimateBy,
} from "./types";

/* ------------------------------------------------------------------ */
/*  Default configuration                                              */
/* ------------------------------------------------------------------ */

export const DEFAULT_LOW_PERFORMANCE: LowPerformanceConfig = {
  enabled: false,
  intro: {
    speed: 400,
    curve: "easeOutCubic",
    delay: 0,
  },
  outro: {
    speed: 300,
    curve: "easeInCubic",
    delay: 0,
  },
};

export const DEFAULT_LOW_MOTION: LowMotionConfig = {
  enabled: false,
  intro: {
    speed: 400,
    curve: "easeOutCubic",
    delay: 0,
  },
  outro: {
    speed: 300,
    curve: "easeInCubic",
    delay: 0,
  },
};

export const DEFAULT_CONFIG: AnimationConfig = {
  displayDuration: 3,
  text: {
    animateBy: "letter",
    intro: {
      speed: 200,
      curve: "easeInCubic",
      delay: 0,
      blur: 0,
      scale: 0,
      stagger: -30,
    },
    outro: {
      speed: 200,
      curve: "easeOutCubic",
      delay: 0,
      blur: 0,
      scale: 0,
      stagger: -30,
    },
  },
  icon: {
    intro: {
      delay: 30,
      speed: 800,
      curve: "easeOutBack",
      scaleFrom: 0,
      scaleTo: 1,
      opacityFrom: 0,
      opacityTo: 1,
    },
    outro: {
      delay: 0,
      speed: 400,
      curve: "easeInCubic",
      scaleTo: 0,
      opacityTo: 0,
    },
  },
  lowPerformance: DEFAULT_LOW_PERFORMANCE,
  lowMotion: DEFAULT_LOW_MOTION,
};

/* ------------------------------------------------------------------ */
/*  Deep merge                                                         */
/* ------------------------------------------------------------------ */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function deepMerge<T>(base: T, overrides: DeepPartial<T>): T {
  if (!isPlainObject(base) || !isPlainObject(overrides)) {
    return (overrides ?? base) as T;
  }

  const result = { ...base } as Record<string, unknown>;
  for (const key of Object.keys(overrides)) {
    const baseVal = (base as Record<string, unknown>)[key];
    const overVal = (overrides as Record<string, unknown>)[key];
    if (isPlainObject(baseVal) && isPlainObject(overVal)) {
      result[key] = deepMerge(baseVal, overVal);
    } else if (overVal !== undefined) {
      result[key] = overVal;
    }
  }
  return result as T;
}

export function resolveConfig(
  overrides?: DeepPartial<AnimationConfig>,
): AnimationConfig {
  if (!overrides) return DEFAULT_CONFIG;
  return deepMerge(DEFAULT_CONFIG, overrides);
}

/* ------------------------------------------------------------------ */
/*  Headline parsing                                                   */
/* ------------------------------------------------------------------ */

export function parseHeadline(text: string): ParsedHeadline {
  const iconIdx = text.indexOf("{icon}");
  const hasIcon = iconIdx !== -1;
  return {
    hasIcon,
    preText: hasIcon ? text.slice(0, iconIdx).trimEnd() : text,
    postText: hasIcon ? text.slice(iconIdx + 6).trimStart() : "",
  };
}

export function tokenizeHeadline(text: string): HeadlineToken[] {
  const tokens: HeadlineToken[] = [];
  let i = 0;
  let inBracket = false;
  let buffer = "";

  while (i < text.length) {
    if (text[i] === "[") {
      if (buffer)
        tokens.push({ kind: "text", content: buffer, isStatic: inBracket });
      buffer = "";
      inBracket = true;
      i++;
    } else if (text[i] === "]") {
      if (buffer)
        tokens.push({ kind: "text", content: buffer, isStatic: inBracket });
      buffer = "";
      inBracket = false;
      i++;
    } else if (text.startsWith("{icon}", i)) {
      if (buffer)
        tokens.push({ kind: "text", content: buffer, isStatic: inBracket });
      buffer = "";
      tokens.push({ kind: "icon", content: "", isStatic: inBracket });
      i += 6;
    } else {
      buffer += text[i];
      i++;
    }
  }

  if (buffer)
    tokens.push({ kind: "text", content: buffer, isStatic: inBracket });
  return tokens;
}

export function stripBrackets(text: string): string {
  return text.replace(/\[([^\]]*)\]/g, "$1");
}

export function stripStaticContent(text: string): string {
  return text.replace(/\[[^\]]*\]/g, "");
}

/* ------------------------------------------------------------------ */
/*  Animation math                                                     */
/* ------------------------------------------------------------------ */

export function unitCount(text: string, animateBy: TextAnimateBy): number {
  if (animateBy === "word") return text.split(/\s+/).filter(Boolean).length;
  return text.length;
}

export function buildWordIndices(text: string): number[] {
  const indices: number[] = [];
  let wordIdx = 0;
  let seenWord = false;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === " ") {
      indices.push(seenWord ? wordIdx : 0);
    } else {
      if (seenWord && i > 0 && text[i - 1] === " ") wordIdx++;
      seenWord = true;
      indices.push(wordIdx);
    }
  }

  return indices;
}

export function computeIntroDuration(
  headline: HeadlineConfig,
  config: AnimationConfig,
): number {
  const { hasIcon, preText, postText } = parseHeadline(headline.text);

  if (config.lowMotion.enabled) {
    const fadeDur = config.lowMotion.intro.speed / 1000;
    const fadeDelay = config.lowMotion.intro.delay / 1000;
    const textEnd = fadeDelay + fadeDur;
    const iconEnd = hasIcon
      ? config.icon.intro.delay / 1000 + config.icon.intro.speed / 1000
      : 0;
    return Math.max(textEnd, iconEnd, 0);
  }

  if (config.lowPerformance.enabled) {
    const clipDur = config.lowPerformance.intro.speed / 1000;
    const clipDelay = config.lowPerformance.intro.delay / 1000;
    const textEnd = clipDelay + clipDur;
    const iconEnd = hasIcon
      ? config.icon.intro.delay / 1000 + config.icon.intro.speed / 1000
      : 0;
    return Math.max(textEnd, iconEnd, 0);
  }

  const durationSec = config.text.intro.speed / 1000;
  const staggerSec = Math.max(
    (config.text.intro.speed + config.text.intro.delay) / 1000,
    0,
  );
  const preUnits = Math.max(
    unitCount(preText, config.text.animateBy) - 1,
    0,
  );
  const preBase = preUnits * staggerSec;
  const preEnd = preBase + durationSec;

  const iconEnd = hasIcon
    ? preBase + config.icon.intro.delay / 1000 + config.icon.intro.speed / 1000
    : 0;

  const postStart = preBase + config.text.intro.stagger / 1000;
  const postUnits = Math.max(
    unitCount(postText, config.text.animateBy) - 1,
    0,
  );
  const postEnd = postText
    ? postStart + postUnits * staggerSec + durationSec
    : 0;

  return Math.max(preEnd, iconEnd, postEnd, 0);
}

/* ------------------------------------------------------------------ */
/*  Reduced motion                                                     */
/* ------------------------------------------------------------------ */

export function queryReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ------------------------------------------------------------------ */
/*  Resolve easing key → cubic bezier tuple                            */
/* ------------------------------------------------------------------ */

export function resolveEasing(
  key: string,
): [number, number, number, number] {
  return (
    EASING_CURVES[key as keyof typeof EASING_CURVES] ?? EASING_CURVES.linear
  );
}
