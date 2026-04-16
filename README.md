# @ddg-motion/animated-headline

A standalone React component for staggered text and icon reveal animations. Headlines cycle automatically with per-character or per-word entrance/exit effects, optional blur and scale transforms, and support for static segments that persist across transitions.

## Installation

```bash
npm install @ddg-motion/animated-headline
```

### Peer dependencies

The package requires these to be installed in your project:

| Package     | Version |
| ----------- | ------- |
| `react`     | >= 18   |
| `react-dom` | >= 18   |
| `motion`    | >= 12   |

## Quick start

```tsx
import { AnimatedHeadline } from "@ddg-motion/animated-headline";

function Hero() {
  return (
    <AnimatedHeadline
      headlines={[
        { text: "Search {icon} privately", iconSrc: "/icons/search.svg", iconTextColor: "#B66A1F" },
        { text: "Browse {icon} safely", iconSrc: "/icons/shield.svg", iconTextColor: "#11604D" },
      ]}
    />
  );
}
```

All animation parameters have sensible defaults. Override only what you need via `settings`.

## Props

### `AnimatedHeadlineProps`

| Prop        | Type                          | Default | Description                                                   |
| ----------- | ----------------------------- | ------- | ------------------------------------------------------------- |
| `headlines` | `HeadlineConfig[]`            | —       | **Required.** One or more headlines to cycle through.         |
| `settings`  | `DeepPartial<AnimationConfig>` | —      | Animation timing/easing overrides. Deep-merged with defaults. |
| `autoPlay`  | `boolean`                     | `true`  | Auto-cycle through headlines on a timer.                      |
| `onClick`   | `() => void`                  | —       | Override the default press-to-advance behavior.               |
| `onAdvance` | `(index: number) => void`     | —       | Fires when the active headline changes, with the new index.   |
| `className` | `string`                      | —       | CSS class applied to the outermost container.                 |
| `style`     | `CSSProperties`               | —       | Inline styles applied to the outermost container.             |

### `HeadlineConfig`

| Field           | Type     | Description                                              |
| --------------- | -------- | -------------------------------------------------------- |
| `text`          | `string` | Headline copy. Supports `{icon}` and `[bracket]` syntax. |
| `iconSrc`       | `string` | URL or import path to an icon image.                     |
| `iconTextColor` | `string` | Color for the text segment following the icon.           |

## Headline syntax

### Icon placeholder

Use `{icon}` in the headline text to position an icon inline:

```
"Search {icon} privately"
```

The icon splits the text into a **pre-text** segment and a **post-text** segment. The `iconTextColor` is applied to the post-text.

### Static bracket segments

Wrap parts of the text in `[square brackets]` to mark them as **static**. Static segments animate in on the first cycle and then stay visible while other parts transition between headlines:

```
"[Search] {icon} privately"   →  "Search" stays, icon + "privately" swap
"[Search] {icon} safely"
```

This enables smooth partial transitions where a common prefix or suffix persists.

## Animation settings

Pass a `settings` object to override any timing, easing, or transform value. Only the fields you provide are overridden; the rest keep their defaults.

### Structure

```ts
interface AnimationConfig {
  displayDuration: number;      // Hold time (seconds) before next headline

  text: {
    animateBy: "letter" | "word";
    intro: TextPhaseConfig;
    outro: TextPhaseConfig & { animateBy?: "letter" | "word" };
  };

  icon: {
    intro: IconPhaseIntroConfig;
    outro: IconPhaseOutroConfig;
  };

  lowPerformance: LowPerformanceConfig;
  lowMotion: LowMotionConfig;
}
```

### `TextPhaseConfig`

| Field     | Type        | Default (intro)  | Default (outro)  | Description                                      |
| --------- | ----------- | ---------------- | ---------------- | ------------------------------------------------ |
| `speed`   | `number`    | `200`            | `200`            | Duration per unit (ms).                          |
| `curve`   | `EasingKey` | `"easeInCubic"`  | `"easeOutCubic"` | Easing curve name.                               |
| `delay`   | `number`    | `0`              | `0`              | Extra delay between staggered units (ms).        |
| `blur`    | `number`    | `0`              | `0`              | Blur radius at start/end (px). `0` = disabled.   |
| `scale`   | `number`    | `0`              | `0`              | Scale at start/end. `0` = disabled, `0.5` = 50%. |
| `stagger` | `number`    | `-30`            | `-30`            | Delay between pre-icon and post-icon text (ms).  |

### `IconPhaseIntroConfig`

| Field         | Type        | Default         |
| ------------- | ----------- | --------------- |
| `delay`       | `number`    | `30`            |
| `speed`       | `number`    | `800`           |
| `curve`       | `EasingKey` | `"easeOutBack"` |
| `scaleFrom`   | `number`    | `0`             |
| `scaleTo`     | `number`    | `1`             |
| `opacityFrom` | `number`    | `0`             |
| `opacityTo`   | `number`    | `1`             |

### `IconPhaseOutroConfig`

| Field       | Type        | Default         |
| ----------- | ----------- | --------------- |
| `delay`     | `number`    | `0`             |
| `speed`     | `number`    | `400`           |
| `curve`     | `EasingKey` | `"easeInCubic"` |
| `scaleTo`   | `number`    | `0`             |
| `opacityTo` | `number`    | `0`             |

### `LowPerformanceConfig`

When `lowPerformance.enabled` is `true`, per-letter/word animation is replaced with a left-to-right `clipPath` reveal on each text segment. Blur and scale are disabled. This is useful for devices or contexts where per-character animation is too expensive.

```ts
interface LowPerformanceConfig {
  enabled: boolean;      // default: false
  intro: ClipPhaseConfig;
  outro: ClipPhaseConfig;
}
```

| Field   | Type        | Default (intro)  | Default (outro)  | Description                            |
| ------- | ----------- | ---------------- | ---------------- | -------------------------------------- |
| `speed` | `number`    | `400`            | `300`            | Clip reveal duration (ms).             |
| `curve` | `EasingKey` | `"easeOutCubic"` | `"easeInCubic"`  | Easing curve for the clip transition.  |
| `delay` | `number`    | `0`              | `0`              | Delay before clip animation starts (ms). |

### `LowMotionConfig`

When `lowMotion.enabled` is `true`, text simply fades in and out as a whole line. No per-character animation, no clip mask, no blur, and no scale. This is the simplest animation mode.

```ts
interface LowMotionConfig {
  enabled: boolean;      // default: false
  intro: FadePhaseConfig;
  outro: FadePhaseConfig;
}
```

| Field   | Type        | Default (intro)  | Default (outro)  | Description                            |
| ------- | ----------- | ---------------- | ---------------- | -------------------------------------- |
| `speed` | `number`    | `400`            | `300`            | Fade duration (ms).                    |
| `curve` | `EasingKey` | `"easeOutCubic"` | `"easeInCubic"`  | Easing curve for the fade.             |
| `delay` | `number`    | `0`              | `0`              | Delay before fade starts (ms).         |

> `lowMotion` takes priority over `lowPerformance` if both are enabled.

### Available easing curves

`linear`, `easeInCubic`, `easeInQuart`, `easeInQuint`, `easeInExpo`, `easeOutCubic`, `easeOutQuart`, `easeOutQuint`, `easeOutExpo`, `easeInOutCubic`, `easeInOutQuart`, `easeInOutQuint`, `easeInOutExpo`, `easeInBack`, `easeOutBack`, `easeInOutBack`

Import `EASING_CURVES` or `EASING_LABELS` for programmatic access.

## Customising typography

The component uses CSS custom properties for all visual defaults. Set them on the container or any ancestor:

```css
.my-headline {
  --ah-font-family: "YourTypeface", system-ui, sans-serif;
  --ah-font-size: clamp(1.25rem, 3vw + 0.5rem, 2.5rem);
  --ah-font-weight: 600;
  --ah-line-height: 1.3;
  --ah-text-color: #1a1a1a;
  --ah-icon-size: 1.5em;
  --ah-gap: 0.3em;
}
```

| Variable           | Default                                  | Description                         |
| ------------------ | ---------------------------------------- | ----------------------------------- |
| `--ah-font-family` | `inherit`                                | Font family for headline text.      |
| `--ah-font-size`   | `clamp(1rem, 2.5vw + 0.5rem, 1.75rem)`  | Fluid font size.                    |
| `--ah-font-weight` | `500`                                    | Font weight.                        |
| `--ah-line-height` | `1.35`                                   | Line height.                        |
| `--ah-text-color`  | `rgba(0, 0, 0, 0.96)`                   | Default text color (pre-icon text). |
| `--ah-icon-size`   | `1.3em`                                  | Icon dimensions (scales with font). |
| `--ah-gap`         | `0.25em`                                 | Gap between text and icon.          |

Because `--ah-font-size` uses `clamp()` by default, text is responsive out of the box. Override it for tighter control over the fluid range.

## Accessibility

- **Keyboard support**: The container is focusable and responds to press (Enter/Space) to advance headlines, powered by `react-aria`'s `usePress`.
- **Screen readers**: A `VisuallyHidden` `aria-live="polite"` region announces headline text on each transition.
- **Reduced motion**: When `prefers-reduced-motion: reduce` is active, all staggered character animation is skipped and text renders immediately.
- **Semantics**: The root element uses `role="region"` with `aria-roledescription="animated headline"`.

## Examples

### Minimal (single headline, replay on click)

```tsx
<AnimatedHeadline headlines={[{ text: "Welcome to our site" }]} />
```

### With blur and word-based animation

```tsx
<AnimatedHeadline
  headlines={[
    { text: "Fast {icon} search", iconSrc: "/search.svg", iconTextColor: "#0066cc" },
    { text: "Fast {icon} answers", iconSrc: "/ai.svg", iconTextColor: "#6b21a8" },
  ]}
  settings={{
    text: {
      animateBy: "word",
      intro: { blur: 4, speed: 300, curve: "easeOutQuart" },
      outro: { blur: 4, speed: 200 },
    },
  }}
/>
```

### Static prefix with bracket syntax

```tsx
<AnimatedHeadline
  headlines={[
    { text: "[Your data is] {icon} private", iconSrc: "/lock.svg", iconTextColor: "#11604d" },
    { text: "[Your data is] {icon} encrypted", iconSrc: "/shield.svg", iconTextColor: "#045eb2" },
    { text: "[Your data is] {icon} yours", iconSrc: "/heart.svg", iconTextColor: "#9e2b08" },
  ]}
  settings={{ displayDuration: 4 }}
/>
```

### Custom font and sizing

```tsx
<AnimatedHeadline
  headlines={[{ text: "Big bold headline" }]}
  className="hero-headline"
  style={{
    "--ah-font-family": '"Playfair Display", serif',
    "--ah-font-size": "clamp(2rem, 5vw, 4rem)",
    "--ah-font-weight": "700",
  } as React.CSSProperties}
/>
```

### Low performance (clip reveal)

```tsx
<AnimatedHeadline
  headlines={[
    { text: "Search {icon} privately", iconSrc: "/search.svg" },
    { text: "Browse {icon} safely", iconSrc: "/shield.svg" },
  ]}
  settings={{
    lowPerformance: {
      enabled: true,
      intro: { speed: 500, curve: "easeOutQuart" },
    },
  }}
/>
```

### Low motion (simple fade)

```tsx
<AnimatedHeadline
  headlines={[
    { text: "Search {icon} privately", iconSrc: "/search.svg" },
    { text: "Browse {icon} safely", iconSrc: "/shield.svg" },
  ]}
  settings={{
    lowMotion: {
      enabled: true,
      intro: { speed: 600 },
      outro: { speed: 400 },
    },
  }}
/>
```

### Controlled advance (no auto-play)

```tsx
function Controlled() {
  const [index, setIndex] = useState(0);

  return (
    <>
      <AnimatedHeadline
        headlines={headlines}
        autoPlay={false}
        onAdvance={setIndex}
      />
      <p>Currently showing headline {index + 1}</p>
    </>
  );
}
```

## Exports

```ts
// Component
export { AnimatedHeadline } from "./animated-headline";

// Types
export type {
  AnimatedHeadlineProps,
  AnimationConfig,
  ClipPhaseConfig,
  DeepPartial,
  FadePhaseConfig,
  HeadlineConfig,
  LowMotionConfig,
  LowPerformanceConfig,
  TextAnimateBy,
  TextConfig,
  TextPhaseConfig,
  IconConfig,
  IconPhaseIntroConfig,
  IconPhaseOutroConfig,
} from "./types";

// Easing
export { EASING_CURVES, EASING_KEYS, EASING_LABELS } from "./easing";
export type { CubicBezier, EasingKey } from "./easing";

// Utilities
export {
  DEFAULT_CONFIG,
  DEFAULT_LOW_MOTION,
  DEFAULT_LOW_PERFORMANCE,
  deepMerge,
  resolveConfig,
  parseHeadline,
  tokenizeHeadline,
  stripBrackets,
  unitCount,
  computeIntroDuration,
} from "./utils";
```
