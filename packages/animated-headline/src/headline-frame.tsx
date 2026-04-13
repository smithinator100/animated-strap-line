import { useMemo } from "react";
import { motion } from "motion/react";
import { AnimatedText } from "./animated-text";
import { AnimatedIcon } from "./animated-icon";
import type { AnimationConfig, HeadlineConfig } from "./types";
import { parseHeadline, resolveEasing, unitCount } from "./utils";
import styles from "./styles.module.css";

interface HeadlineFrameProps {
  headline: HeadlineConfig;
  config: AnimationConfig;
  animKey: string;
  reducedMotion: boolean;
}

export function HeadlineFrame({
  headline,
  config,
  animKey,
  reducedMotion,
}: HeadlineFrameProps) {
  const { hasIcon, preText, postText } = useMemo(
    () => parseHeadline(headline.text),
    [headline.text],
  );

  const textEase = resolveEasing(config.text.intro.curve);
  const iconEase = resolveEasing(config.icon.intro.curve);
  const textOutroEase = resolveEasing(config.text.outro.curve);
  const iconOutroEase = resolveEasing(config.icon.outro.curve);

  const introDurationSec = config.text.intro.speed / 1000;
  const introStaggerSec = Math.max(
    (config.text.intro.speed + config.text.intro.delay) / 1000,
    0,
  );
  const preUnits = Math.max(
    unitCount(preText, config.text.animateBy) - 1,
    0,
  );
  const preTextBaseSec = preUnits * introStaggerSec;
  const textGroupDelaySec = preTextBaseSec + config.text.intro.stagger / 1000;
  const iconDelaySec = preTextBaseSec + config.icon.intro.delay / 1000;
  const iconDurationSec = config.icon.intro.speed / 1000;

  const outroDurationSec = config.text.outro.speed / 1000;
  const outroStaggerSec = Math.max(
    (config.text.outro.speed + config.text.outro.delay) / 1000,
    0,
  );
  const outroTextGroupDelaySec = Math.max(
    config.text.outro.stagger / 1000,
    0,
  );
  const iconOutroDelaySec = Math.max(config.icon.outro.delay / 1000, 0);
  const iconOutroDurationSec = config.icon.outro.speed / 1000;

  const iconSrc = headline.iconSrc ?? "";

  if (reducedMotion) {
    return (
      <div key={animKey} className={styles.textRow}>
        {preText && (
          <p className={`${styles.headline} ${styles.headlineDark}`}>
            {preText}
          </p>
        )}
        {hasIcon && iconSrc && (
          <div className={styles.iconContainer}>
            <img className={styles.iconImg} alt="" src={iconSrc} />
          </div>
        )}
        {postText && (
          <p
            className={styles.headline}
            style={
              headline.iconTextColor
                ? { color: headline.iconTextColor }
                : undefined
            }
          >
            {postText}
          </p>
        )}
      </div>
    );
  }

  return (
    <motion.div
      key={animKey}
      className={styles.textRow}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {preText && (
        <AnimatedText
          className={`${styles.headline} ${styles.headlineDark}`}
          text={preText}
          animateBy={config.text.animateBy}
          outroAnimateBy={config.text.outro.animateBy}
          introDelay={0}
          introStagger={introStaggerSec}
          introDuration={introDurationSec}
          introBlur={config.text.intro.blur}
          introScale={config.text.intro.scale}
          introEase={textEase}
          outroDelay={0}
          outroStagger={outroStaggerSec}
          outroDuration={outroDurationSec}
          outroBlur={config.text.outro.blur}
          outroScale={config.text.outro.scale}
          outroEase={textOutroEase}
          reducedMotion={false}
        />
      )}
      {hasIcon && iconSrc && (
        <AnimatedIcon
          iconSrc={iconSrc}
          introDelay={iconDelaySec}
          introDuration={iconDurationSec}
          introEase={iconEase}
          scaleFrom={config.icon.intro.scaleFrom}
          scaleTo={config.icon.intro.scaleTo}
          opacityFrom={config.icon.intro.opacityFrom}
          opacityTo={config.icon.intro.opacityTo}
          outroDelay={iconOutroDelaySec}
          outroDuration={iconOutroDurationSec}
          outroEase={iconOutroEase}
          outroScaleTo={config.icon.outro.scaleTo}
          outroOpacityTo={config.icon.outro.opacityTo}
          reducedMotion={false}
        />
      )}
      {postText && (
        <AnimatedText
          className={styles.headline}
          style={
            headline.iconTextColor
              ? { color: headline.iconTextColor }
              : undefined
          }
          text={postText}
          animateBy={config.text.animateBy}
          outroAnimateBy={config.text.outro.animateBy}
          introDelay={textGroupDelaySec}
          introStagger={introStaggerSec}
          introDuration={introDurationSec}
          introBlur={config.text.intro.blur}
          introScale={config.text.intro.scale}
          introEase={textEase}
          outroDelay={outroTextGroupDelaySec}
          outroStagger={outroStaggerSec}
          outroDuration={outroDurationSec}
          outroBlur={config.text.outro.blur}
          outroScale={config.text.outro.scale}
          outroEase={textOutroEase}
          reducedMotion={false}
        />
      )}
    </motion.div>
  );
}
