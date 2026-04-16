import type { CSSProperties } from "react";
import type { EasingKey } from "./easing";

/* ------------------------------------------------------------------ */
/*  Deep-partial utility                                               */
/* ------------------------------------------------------------------ */

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/* ------------------------------------------------------------------ */
/*  Headline                                                           */
/* ------------------------------------------------------------------ */

export type TextAnimateBy = "letter" | "word";

export interface HeadlineConfig {
  /** Headline copy. Use `{icon}` for icon placement, `[brackets]` for static segments. */
  text: string;
  /** URL or import path to an icon image. Only used when `{icon}` appears in `text`. */
  iconSrc?: string;
  /** Color applied to the text segment that follows the icon. */
  iconTextColor?: string;
}

/* ------------------------------------------------------------------ */
/*  Animation configuration                                            */
/* ------------------------------------------------------------------ */

export interface ClipPhaseConfig {
  speed: number;
  curve: EasingKey;
  delay: number;
}

export interface LowPerformanceConfig {
  enabled: boolean;
  intro: ClipPhaseConfig;
  outro: ClipPhaseConfig;
}

export type FadePhaseConfig = ClipPhaseConfig;

export interface LowMotionConfig {
  enabled: boolean;
  intro: FadePhaseConfig;
  outro: FadePhaseConfig;
}

export interface TextPhaseConfig {
  speed: number;
  curve: EasingKey;
  delay: number;
  blur: number;
  scale: number;
  stagger: number;
}

export interface TextConfig {
  animateBy: TextAnimateBy;
  intro: TextPhaseConfig;
  outro: TextPhaseConfig & { animateBy?: TextAnimateBy };
}

export interface IconPhaseIntroConfig {
  delay: number;
  speed: number;
  curve: EasingKey;
  scaleFrom: number;
  scaleTo: number;
  opacityFrom: number;
  opacityTo: number;
}

export interface IconPhaseOutroConfig {
  delay: number;
  speed: number;
  curve: EasingKey;
  scaleTo: number;
  opacityTo: number;
}

export interface IconConfig {
  intro: IconPhaseIntroConfig;
  outro: IconPhaseOutroConfig;
}

export interface AnimationConfig {
  displayDuration: number;
  text: TextConfig;
  icon: IconConfig;
  lowPerformance: LowPerformanceConfig;
  lowMotion: LowMotionConfig;
}

/* ------------------------------------------------------------------ */
/*  Component props                                                    */
/* ------------------------------------------------------------------ */

export interface AnimatedHeadlineProps {
  /** One or more headlines to cycle through. */
  headlines: HeadlineConfig[];
  /** Animation timing and easing overrides. Deep-merged with defaults. */
  settings?: DeepPartial<AnimationConfig>;
  /** Whether to auto-cycle through headlines. @default true */
  autoPlay?: boolean;
  /** Override the default click/press behavior. */
  onClick?: () => void;
  /** Fires each time the active headline advances, with the new index. */
  onAdvance?: (index: number) => void;
  /** CSS class applied to the outermost container. */
  className?: string;
  /** Inline styles applied to the outermost container. */
  style?: CSSProperties;
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

export interface HeadlineToken {
  kind: "text" | "icon";
  content: string;
  isStatic: boolean;
}

export interface ParsedHeadline {
  hasIcon: boolean;
  preText: string;
  postText: string;
}
