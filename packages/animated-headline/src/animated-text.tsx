import { useMemo } from "react";
import { motion } from "motion/react";
import type { CubicBezier } from "./easing";
import type { LowMotionConfig, LowPerformanceConfig, TextAnimateBy } from "./types";
import { buildWordIndices, resolveEasing } from "./utils";
import styles from "./styles.module.css";

const CLIP_HIDDEN = "inset(0% 100% 0% 0%)";
const CLIP_VISIBLE = "inset(0% 0% 0% 0%)";

interface AnimatedTextProps {
  text: string;
  animateBy: TextAnimateBy;
  outroAnimateBy?: TextAnimateBy;
  className?: string;
  style?: React.CSSProperties;
  introDelay?: number;
  introStagger: number;
  introDuration: number;
  introBlur: number;
  introScale: number;
  introEase: CubicBezier;
  outroDelay?: number;
  outroStagger: number;
  outroDuration: number;
  outroBlur: number;
  outroScale: number;
  outroEase: CubicBezier;
  lowPerformance: false | LowPerformanceConfig;
  lowMotion: false | LowMotionConfig;
}

function ClipAnimatedText({
  text,
  className,
  style,
  introDelay = 0,
  config,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  introDelay?: number;
  config: LowPerformanceConfig;
}) {
  const introEase = resolveEasing(config.intro.curve);
  const outroEase = resolveEasing(config.outro.curve);

  return (
    <motion.p
      className={className}
      style={{ ...style, willChange: "clip-path, opacity" }}
      variants={{
        hidden: {
          clipPath: CLIP_HIDDEN,
          opacity: 0,
        },
        visible: {
          clipPath: CLIP_VISIBLE,
          opacity: 1,
          transition: {
            duration: config.intro.speed / 1000,
            ease: introEase,
            delay: introDelay + config.intro.delay / 1000,
          },
        },
        exit: {
          clipPath: CLIP_HIDDEN,
          opacity: 0,
          transition: {
            duration: config.outro.speed / 1000,
            ease: outroEase,
            delay: config.outro.delay / 1000,
          },
        },
      }}
    >
      {text}
    </motion.p>
  );
}

function FadeAnimatedText({
  text,
  className,
  style,
  introDelay = 0,
  config,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  introDelay?: number;
  config: LowMotionConfig;
}) {
  const introEase = resolveEasing(config.intro.curve);
  const outroEase = resolveEasing(config.outro.curve);

  return (
    <motion.p
      className={className}
      style={style}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            duration: config.intro.speed / 1000,
            ease: introEase,
            delay: introDelay + config.intro.delay / 1000,
          },
        },
        exit: {
          opacity: 0,
          transition: {
            duration: config.outro.speed / 1000,
            ease: outroEase,
            delay: config.outro.delay / 1000,
          },
        },
      }}
    >
      {text}
    </motion.p>
  );
}

export function AnimatedText({
  text,
  animateBy,
  outroAnimateBy: outroAnimateByProp,
  className,
  style,
  introDelay = 0,
  introStagger,
  introDuration,
  introBlur,
  introScale,
  introEase,
  outroDelay = 0,
  outroStagger,
  outroDuration,
  outroBlur,
  outroScale,
  outroEase,
  lowPerformance,
  lowMotion,
}: AnimatedTextProps) {
  if (lowMotion && lowMotion.enabled) {
    return (
      <FadeAnimatedText
        text={text}
        className={className}
        style={style}
        introDelay={introDelay}
        config={lowMotion}
      />
    );
  }

  if (lowPerformance && lowPerformance.enabled) {
    return (
      <ClipAnimatedText
        text={text}
        className={className}
        style={style}
        introDelay={introDelay}
        config={lowPerformance}
      />
    );
  }

  const outroAnimateBy = outroAnimateByProp ?? animateBy;

  const wordIndices = useMemo(() => buildWordIndices(text), [text]);
  const chars = useMemo(() => text.split(""), [text]);

  const introUnitFade = Math.max(introDuration, 0.01);
  const outroUnitFade = Math.max(outroDuration, 0.01);

  const { hiddenStyle, visibleStyle, exitStyle } = useMemo(() => {
    const hidden: Record<string, number | string> = { opacity: 0 };
    const visible: Record<string, number | string> = { opacity: 1 };
    const exit: Record<string, number | string> = { opacity: 0 };

    if (introBlur > 0) {
      hidden.filter = `blur(${introBlur}px)`;
      visible.filter = "blur(0px)";
    }
    if (introScale > 0) {
      hidden.scale = introScale;
      visible.scale = 1;
    }
    if (outroBlur > 0) {
      exit.filter = `blur(${outroBlur}px)`;
      if (!visible.filter) visible.filter = "blur(0px)";
    }
    if (outroScale > 0) {
      exit.scale = outroScale;
      if (visible.scale === undefined) visible.scale = 1;
    }

    return { hiddenStyle: hidden, visibleStyle: visible, exitStyle: exit };
  }, [introBlur, introScale, outroBlur, outroScale]);

  return (
    <motion.p
      className={className}
      style={style}
      variants={{ hidden: {}, visible: {}, exit: {} }}
    >
      {chars.map((char, i) => {
        const introD =
          animateBy === "word"
            ? introDelay + wordIndices[i] * introStagger
            : introDelay + i * introStagger;

        const outroD =
          outroAnimateBy === "word"
            ? outroDelay + wordIndices[i] * outroStagger
            : outroDelay + i * outroStagger;

        return (
          <motion.span
            key={i}
            className={styles.letter}
            variants={{
              hidden: hiddenStyle,
              visible: {
                ...visibleStyle,
                transition: {
                  duration: introUnitFade,
                  ease: introEase,
                  delay: introD,
                },
              },
              exit: {
                ...exitStyle,
                transition: {
                  duration: outroUnitFade,
                  ease: outroEase,
                  delay: outroD,
                },
              },
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        );
      })}
    </motion.p>
  );
}
