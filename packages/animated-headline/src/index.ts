export { AnimatedHeadline } from "./animated-headline";

export type {
  AnimatedHeadlineProps,
  AnimationConfig,
  ClipPhaseConfig,
  DeepPartial,
  HeadlineConfig,
  HeadlineToken,
  FadePhaseConfig,
  IconConfig,
  IconPhaseIntroConfig,
  IconPhaseOutroConfig,
  LowMotionConfig,
  LowPerformanceConfig,
  ParsedHeadline,
  TextAnimateBy,
  TextConfig,
  TextPhaseConfig,
} from "./types";

export {
  EASING_CURVES,
  EASING_KEYS,
  EASING_LABELS,
  type CubicBezier,
  type EasingKey,
} from "./easing";

export {
  computeIntroDuration,
  DEFAULT_CONFIG,
  DEFAULT_LOW_MOTION,
  DEFAULT_LOW_PERFORMANCE,
  deepMerge,
  parseHeadline,
  resolveConfig,
  stripBrackets,
  tokenizeHeadline,
  unitCount,
} from "./utils";
