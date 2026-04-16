import type {
  AnimationConfig,
  HeadlineConfig,
} from "@ddg-motion/animated-headline";
import type { AnimationSettings } from "./settings";
import { ICON_OPTIONS, ICON_TEXT_COLORS } from "./settings";
import type { EasingKey } from "@ddg-motion/animated-headline";

function resolveIconSrc(iconKey: string): string {
  return ICON_OPTIONS.find((o) => o.key === iconKey)?.src ?? "";
}

export function toHeadlines(settings: AnimationSettings): HeadlineConfig[] {
  return settings.headlines.map((h) => ({
    text: h.text,
    iconSrc: resolveIconSrc(h.iconSrc),
    iconTextColor: ICON_TEXT_COLORS[h.iconSrc],
  }));
}

export function toAnimationConfig(s: AnimationSettings): AnimationConfig {
  const noBlurScale = s.lowPerformance || s.lowMotion;
  return {
    displayDuration: s.displayDuration,
    lowPerformance: {
      enabled: s.lowPerformance && !s.lowMotion,
      intro: {
        speed: s.clipIntroSpeed,
        curve: s.clipIntroCurve as EasingKey,
        delay: s.clipIntroDelay,
      },
      outro: {
        speed: s.clipOutroSpeed,
        curve: s.clipOutroCurve as EasingKey,
        delay: s.clipOutroDelay,
      },
    },
    lowMotion: {
      enabled: s.lowMotion,
      intro: {
        speed: s.fadeIntroSpeed,
        curve: s.fadeIntroCurve as EasingKey,
        delay: s.fadeIntroDelay,
      },
      outro: {
        speed: s.fadeOutroSpeed,
        curve: s.fadeOutroCurve as EasingKey,
        delay: s.fadeOutroDelay,
      },
    },
    text: {
      animateBy: s.textAnimateBy,
      intro: {
        speed: s.textIntroSpeed,
        curve: s.textIntroCurve as EasingKey,
        delay: s.textDelay,
        blur: noBlurScale ? 0 : s.textBlur,
        scale: noBlurScale ? 0 : s.textScale,
        stagger: s.textStagger,
      },
      outro: {
        animateBy: s.textOutroAnimateBy,
        speed: s.textOutroSpeed,
        curve: s.textOutroCurve as EasingKey,
        delay: s.textOutroDelay,
        blur: noBlurScale ? 0 : s.textOutroBlur,
        scale: noBlurScale ? 0 : s.textOutroScale,
        stagger: s.textOutroStagger,
      },
    },
    icon: {
      intro: {
        delay: s.iconDelay,
        speed: s.iconIntroSpeed,
        curve: s.iconIntroCurve as EasingKey,
        scaleFrom: s.iconScaleIn,
        scaleTo: s.iconScaleOut,
        opacityFrom: s.iconOpacityIn,
        opacityTo: s.iconOpacityOut,
      },
      outro: {
        delay: s.iconOutroDelay,
        speed: s.iconOutroSpeed,
        curve: s.iconOutroCurve as EasingKey,
        scaleTo: s.iconOutroScaleTo,
        opacityTo: s.iconOutroOpacityTo,
      },
    },
  };
}
