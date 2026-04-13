import { useMemo, type CSSProperties } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { AnimatedText } from "./animated-text";
import { AnimatedIcon } from "./animated-icon";
import type { AnimationConfig, HeadlineConfig } from "./types";
import {
  parseHeadline,
  resolveEasing,
  stripBrackets,
  stripStaticContent,
  tokenizeHeadline,
  unitCount,
} from "./utils";
import styles from "./styles.module.css";

interface SplitHeadlineRowProps {
  headline: HeadlineConfig;
  firstHeadline: HeadlineConfig;
  config: AnimationConfig;
  animKey: string;
  playKey: number;
  isFirstCycle: boolean;
  reducedMotion: boolean;
}

const WRAPPER_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
};

const LAYOUT_TRANSITION = {
  layout: { duration: 0.4, ease: [0.33, 1, 0.68, 1] as const },
};

export function SplitHeadlineRow({
  headline,
  firstHeadline,
  config,
  animKey,
  playKey,
  isFirstCycle,
  reducedMotion,
}: SplitHeadlineRowProps) {
  const tokens = useMemo(
    () => tokenizeHeadline(firstHeadline.text),
    [firstHeadline.text],
  );

  const iconTokIdx = tokens.findIndex((t) => t.kind === "icon");
  const hasIcon = iconTokIdx !== -1;

  const { preIsStatic, iconIsStatic, postIsStatic, postToks } = useMemo(
    () => {
      const pre = tokens
        .slice(0, hasIcon ? iconTokIdx : tokens.length)
        .filter((t) => t.kind === "text");
      const post = hasIcon
        ? tokens.slice(iconTokIdx + 1).filter((t) => t.kind === "text")
        : [];
      return {
        postToks: post,
        preIsStatic: pre.length > 0 && pre.every((t) => t.isStatic),
        iconIsStatic: hasIcon && tokens[iconTokIdx].isStatic,
        postIsStatic: post.length > 0 && post.every((t) => t.isStatic),
      };
    },
    [tokens, hasIcon, iconTokIdx],
  );

  const fullText = stripBrackets(firstHeadline.text);
  const { preText: fullPreText } = parseHeadline(fullText);

  const dynText = stripStaticContent(headline.text).trim();
  const { preText: dynPreText, postText: dynPostText } =
    parseHeadline(dynText);

  const staticPreText = preIsStatic ? fullPreText : "";
  const staticPostText = postIsStatic
    ? postToks.map((t) => t.content).join("").trim()
    : "";

  // Shared timing
  const textEase = resolveEasing(config.text.intro.curve);
  const iconEase = resolveEasing(config.icon.intro.curve);
  const textOutroEase = resolveEasing(config.text.outro.curve);
  const iconOutroEase = resolveEasing(config.icon.outro.curve);

  const introDurationSec = config.text.intro.speed / 1000;
  const introStaggerSec = Math.max(
    (config.text.intro.speed + config.text.intro.delay) / 1000,
    0,
  );
  const iconDurationSec = config.icon.intro.speed / 1000;

  const fullPreUnits = Math.max(
    unitCount(fullPreText, config.text.animateBy) - 1,
    0,
  );
  const fullPreBase = fullPreUnits * introStaggerSec;
  const fullIconDelay = fullPreBase + config.icon.intro.delay / 1000;
  const fullTextGroupDelay = fullPreBase + config.text.intro.stagger / 1000;

  const dynPreUnits = Math.max(
    unitCount(dynPreText, config.text.animateBy) - 1,
    0,
  );
  const dynPreBase = dynPreUnits * introStaggerSec;
  const dynIconDelay = dynPreBase + config.icon.intro.delay / 1000;
  const dynTextGroupDelay = dynPreBase + config.text.intro.stagger / 1000;

  const effectiveIconDelay = isFirstCycle ? fullIconDelay : dynIconDelay;
  const effectiveTextGroupDelay = isFirstCycle
    ? fullTextGroupDelay
    : dynTextGroupDelay;

  const outroDurationSec = config.text.outro.speed / 1000;
  const outroStaggerSec = Math.max(
    (config.text.outro.speed + config.text.outro.delay) / 1000,
    0,
  );
  const outroTextGroupDelay = Math.max(config.text.outro.stagger / 1000, 0);
  const iconOutroDelaySec = Math.max(config.icon.outro.delay / 1000, 0);
  const iconOutroDurationSec = config.icon.outro.speed / 1000;

  const staticIconSrc = firstHeadline.iconSrc ?? "";
  const staticKey = `static-${playKey}`;

  if (reducedMotion) {
    const displayText = stripBrackets(headline.text);
    const parsed = parseHeadline(displayText);
    return (
      <div className={styles.textRow}>
        {parsed.preText && (
          <p className={`${styles.headline} ${styles.headlineDark}`}>
            {parsed.preText}
          </p>
        )}
        {parsed.hasIcon && headline.iconSrc && (
          <div className={styles.iconContainer}>
            <img className={styles.iconImg} alt="" src={headline.iconSrc} />
          </div>
        )}
        {parsed.postText && (
          <p
            className={styles.headline}
            style={
              headline.iconTextColor
                ? { color: headline.iconTextColor }
                : undefined
            }
          >
            {parsed.postText}
          </p>
        )}
      </div>
    );
  }

  return (
    <LayoutGroup>
      <div className={styles.textRow}>
        {/* Pre-text */}
        {preIsStatic && staticPreText ? (
          <motion.div
            key={`${staticKey}-pre`}
            layout
            transition={LAYOUT_TRANSITION}
            style={WRAPPER_STYLE}
            initial="hidden"
            animate="visible"
          >
            <AnimatedText
              className={`${styles.headline} ${styles.headlineDark}`}
              text={staticPreText}
              animateBy={config.text.animateBy}
              introDelay={0}
              introStagger={introStaggerSec}
              introDuration={introDurationSec}
              introBlur={config.text.intro.blur}
              introScale={config.text.intro.scale}
              introEase={textEase}
              outroStagger={outroStaggerSec}
              outroDuration={outroDurationSec}
              outroBlur={config.text.outro.blur}
              outroScale={config.text.outro.scale}
              outroEase={textOutroEase}
              reducedMotion={false}
            />
          </motion.div>
        ) : dynPreText ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={animKey}
              style={WRAPPER_STYLE}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <AnimatedText
                className={`${styles.headline} ${styles.headlineDark}`}
                text={dynPreText}
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
            </motion.div>
          </AnimatePresence>
        ) : null}

        {/* Icon */}
        {hasIcon && iconIsStatic ? (
          <motion.div
            key={`${staticKey}-icon`}
            layout
            transition={LAYOUT_TRANSITION}
            style={WRAPPER_STYLE}
            initial="hidden"
            animate="visible"
          >
            <AnimatedIcon
              iconSrc={staticIconSrc}
              introDelay={fullIconDelay}
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
          </motion.div>
        ) : hasIcon ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={animKey}
              style={WRAPPER_STYLE}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <AnimatedIcon
                iconSrc={headline.iconSrc ?? ""}
                introDelay={effectiveIconDelay}
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
            </motion.div>
          </AnimatePresence>
        ) : null}

        {/* Post-text */}
        {postIsStatic && staticPostText ? (
          <motion.div
            key={`${staticKey}-post`}
            layout
            transition={LAYOUT_TRANSITION}
            style={WRAPPER_STYLE}
            initial="hidden"
            animate="visible"
          >
            <AnimatedText
              className={styles.headline}
              style={
                firstHeadline.iconTextColor
                  ? { color: firstHeadline.iconTextColor }
                  : undefined
              }
              text={staticPostText}
              animateBy={config.text.animateBy}
              introDelay={fullTextGroupDelay}
              introStagger={introStaggerSec}
              introDuration={introDurationSec}
              introBlur={config.text.intro.blur}
              introScale={config.text.intro.scale}
              introEase={textEase}
              outroStagger={outroStaggerSec}
              outroDuration={outroDurationSec}
              outroBlur={config.text.outro.blur}
              outroScale={config.text.outro.scale}
              outroEase={textOutroEase}
              reducedMotion={false}
            />
          </motion.div>
        ) : dynPostText ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={animKey}
              style={WRAPPER_STYLE}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <AnimatedText
                className={styles.headline}
                style={
                  headline.iconTextColor
                    ? { color: headline.iconTextColor }
                    : undefined
                }
                text={dynPostText}
                animateBy={config.text.animateBy}
                outroAnimateBy={config.text.outro.animateBy}
                introDelay={effectiveTextGroupDelay}
                introStagger={introStaggerSec}
                introDuration={introDurationSec}
                introBlur={config.text.intro.blur}
                introScale={config.text.intro.scale}
                introEase={textEase}
                outroDelay={outroTextGroupDelay}
                outroStagger={outroStaggerSec}
                outroDuration={outroDurationSec}
                outroBlur={config.text.outro.blur}
                outroScale={config.text.outro.scale}
                outroEase={textOutroEase}
                reducedMotion={false}
              />
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>
    </LayoutGroup>
  );
}
