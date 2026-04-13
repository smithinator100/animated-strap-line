export { AnimatedHeadline } from "./animated-headline";

export type {
  AnimatedHeadlineProps,
  AnimationConfig,
  DeepPartial,
  HeadlineConfig,
  HeadlineToken,
  IconConfig,
  IconPhaseIntroConfig,
  IconPhaseOutroConfig,
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
  deepMerge,
  parseHeadline,
  resolveConfig,
  stripBrackets,
  tokenizeHeadline,
  unitCount,
} from "./utils";
