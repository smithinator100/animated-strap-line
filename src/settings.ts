export interface AnimationSettings {
  preText: string;
  postText: string;
  textIntroSpeed: number;
  textIntroCurve: string;
  textOverlap: number;
  textBlur: number;
  textScale: number;
  textStagger: number;
  iconDelay: number;
  iconIntroSpeed: number;
  iconIntroCurve: string;
  iconScaleIn: number;
  iconScaleOut: number;
  iconOpacityIn: number;
  iconOpacityOut: number;
}

export const DEFAULT_SETTINGS: AnimationSettings = {
  preText: "Create images",
  postText: "privately",
  textIntroSpeed: 30,
  textIntroCurve: "easeInCubic",
  textOverlap: 12,
  textBlur: 0,
  textScale: 0,
  textStagger: -30,
  iconDelay: 30,
  iconIntroSpeed: 800,
  iconIntroCurve: "easeOutBack",
  iconScaleIn: 0,
  iconScaleOut: 1,
  iconOpacityIn: 0,
  iconOpacityOut: 1,
};

export const EASING_CURVES: Record<string, [number, number, number, number]> = {
  linear:          [0,    0, 1,    1],
  easeInCubic:     [0.32, 0, 0.67, 0],
  easeInQuart:     [0.5,  0, 0.75, 0],
  easeInQuint:     [0.64, 0, 0.78, 0],
  easeInExpo:      [0.7,  0, 0.84, 0],
  easeOutCubic:    [0.33, 1, 0.68, 1],
  easeOutQuart:    [0.25, 1, 0.5,  1],
  easeOutQuint:    [0.22, 1, 0.36, 1],
  easeOutExpo:     [0.16, 1, 0.3,  1],
  easeInOutCubic:  [0.65, 0, 0.35, 1],
  easeInOutQuart:  [0.76, 0, 0.24, 1],
  easeInOutQuint:  [0.83, 0, 0.17, 1],
  easeInOutExpo:   [0.87, 0, 0.13, 1],
  easeInBack:      [0.36, 0, 0.66, -0.56],
  easeOutBack:     [0.34, 1.56, 0.64, 1],
  easeInOutBack:   [0.68, -0.6, 0.32, 1.6],
};

export const EASING_LABELS: Record<string, string> = {
  linear:          "Linear",
  easeInCubic:     "Ease In — Cubic",
  easeInQuart:     "Ease In — Quart",
  easeInQuint:     "Ease In — Quint",
  easeInExpo:      "Ease In — Expo",
  easeOutCubic:    "Ease Out — Cubic",
  easeOutQuart:    "Ease Out — Quart",
  easeOutQuint:    "Ease Out — Quint",
  easeOutExpo:     "Ease Out — Expo",
  easeInOutCubic:  "Ease In Out — Cubic",
  easeInOutQuart:  "Ease In Out — Quart",
  easeInOutQuint:  "Ease In Out — Quint",
  easeInOutExpo:   "Ease In Out — Expo",
  easeInBack:      "Ease In — Back",
  easeOutBack:     "Ease Out — Back",
  easeInOutBack:   "Ease In Out — Back",
};

export const EASING_KEYS = Object.keys(EASING_CURVES);
