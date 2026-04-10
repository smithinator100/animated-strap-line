import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AnimationSettings,
  EASING_CURVES,
  ICON_OPTIONS,
  ICON_TEXT_COLORS,
  Headline,
} from "./settings";

export function parseHeadline(text: string) {
  const iconIdx = text.indexOf("{icon}");
  const hasIcon = iconIdx !== -1;
  return {
    hasIcon,
    preText: hasIcon ? text.slice(0, iconIdx).trimEnd() : text,
    postText: hasIcon ? text.slice(iconIdx + 6).trimStart() : "",
  };
}

export function unitCount(text: string, animateBy: "letter" | "word"): number {
  if (animateBy === "word") return text.split(/\s+/).filter(Boolean).length;
  return text.length;
}

export function wordStaggerScale(text: string): number {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return 1;
  const charCount = words.reduce((sum, w) => sum + w.length, 0);
  return charCount / words.length;
}

export function computeIntroDuration(headline: Headline, s: AnimationSettings): number {
  const { hasIcon, preText, postText } = parseHeadline(headline.text);
  const durationSec = s.textIntroSpeed / 1000;
  const staggerSec = Math.max((s.textIntroSpeed + s.textDelay) / 1000, 0);
  const preUnits = Math.max(unitCount(preText, s.textAnimateBy) - 1, 0);
  const preBase = preUnits * staggerSec;
  const preEnd = preBase + durationSec;
  const iconEnd = hasIcon
    ? preBase + s.iconDelay / 1000 + s.iconIntroSpeed / 1000
    : 0;
  const postStart = preBase + s.textStagger / 1000;
  const postUnits = Math.max(unitCount(postText, s.textAnimateBy) - 1, 0);
  const postEnd = postText
    ? postStart + postUnits * staggerSec + durationSec
    : 0;
  return Math.max(preEnd, iconEnd, postEnd, 0);
}

function buildWordIndices(text: string): number[] {
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

interface AnimatedTextProps {
  text: string;
  animateBy: "letter" | "word";
  outroAnimateBy?: "letter" | "word";
  className?: string;
  style?: React.CSSProperties;
  introDelay?: number;
  introStagger: number;
  introDuration: number;
  introBlur: number;
  introScale: number;
  introEase: [number, number, number, number];
  outroDelay?: number;
  outroStagger: number;
  outroDuration: number;
  outroBlur: number;
  outroScale: number;
  outroEase: [number, number, number, number];
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
}: AnimatedTextProps) {
  const outroAnimateBy = outroAnimateByProp ?? animateBy;

  const introUnitFade = Math.max(introDuration, 0.01);
  const outroUnitFade = Math.max(outroDuration, 0.01);

  const hiddenStyle: Record<string, number | string> = { opacity: 0 };
  const visibleStyle: Record<string, number | string> = { opacity: 1 };
  const exitStyle: Record<string, number | string> = { opacity: 0 };

  if (introBlur > 0) {
    hiddenStyle.filter = `blur(${introBlur}px)`;
    visibleStyle.filter = "blur(0px)";
  }
  if (introScale > 0) {
    hiddenStyle.scale = introScale;
    visibleStyle.scale = 1;
  }
  if (outroBlur > 0) {
    exitStyle.filter = `blur(${outroBlur}px)`;
    if (!visibleStyle.filter) visibleStyle.filter = "blur(0px)";
  }
  if (outroScale > 0) {
    exitStyle.scale = outroScale;
    if (visibleStyle.scale === undefined) visibleStyle.scale = 1;
  }

  const chars = text.split("");
  const wordIndices = buildWordIndices(text);

  return (
    <motion.p
      className={className}
      style={style}
      variants={{ hidden: {}, visible: {}, exit: {} }}
    >
      {chars.map((char, i) => {
        const introD = animateBy === "word"
          ? introDelay + wordIndices[i] * introStagger
          : introDelay + i * introStagger;

        const outroD = outroAnimateBy === "word"
          ? outroDelay + wordIndices[i] * outroStagger
          : outroDelay + i * outroStagger;

        return (
          <motion.span
            key={i}
            className="letter"
            variants={{
              hidden: hiddenStyle,
              visible: {
                ...visibleStyle,
                transition: { duration: introUnitFade, ease: introEase, delay: introD },
              },
              exit: {
                ...exitStyle,
                transition: { duration: outroUnitFade, ease: outroEase, delay: outroD },
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

interface AnimatedIconProps {
  iconSrc: string;
  introDelay: number;
  introDuration: number;
  introEase: [number, number, number, number];
  scaleIn: number;
  scaleOut: number;
  opacityIn: number;
  opacityOut: number;
  outroDelay: number;
  outroDuration: number;
  outroEase: [number, number, number, number];
  outroScaleTo: number;
  outroOpacityTo: number;
}

export function AnimatedIcon({
  iconSrc,
  introDelay,
  introDuration,
  introEase,
  scaleIn,
  scaleOut,
  opacityIn,
  opacityOut,
  outroDelay,
  outroDuration,
  outroEase,
  outroScaleTo,
  outroOpacityTo,
}: AnimatedIconProps) {
  const variants = {
    hidden: { scale: scaleIn, opacity: opacityIn },
    visible: {
      scale: scaleOut,
      opacity: opacityOut,
      transition: { duration: introDuration, ease: introEase, delay: introDelay },
    },
    exit: {
      scale: outroScaleTo,
      opacity: outroOpacityTo,
      transition: { duration: outroDuration, ease: outroEase, delay: outroDelay },
    },
  };

  const resolvedSrc = ICON_OPTIONS.find((o) => o.key === iconSrc)?.src ?? "";

  return (
    <motion.div className="icon-container" variants={variants}>
      <img className="icon-img" alt="" src={resolvedSrc} />
    </motion.div>
  );
}

function HeadlineFrame({
  headline,
  settings,
  animKey,
}: {
  headline: Headline;
  settings: AnimationSettings;
  animKey: string;
}) {
  const { hasIcon, preText, postText } = parseHeadline(headline.text);

  const textEase = EASING_CURVES[settings.textIntroCurve];
  const iconEase = EASING_CURVES[settings.iconIntroCurve];
  const introDurationSec = settings.textIntroSpeed / 1000;
  const introStaggerSec = Math.max((settings.textIntroSpeed + settings.textDelay) / 1000, 0);
  const preUnits = Math.max(unitCount(preText, settings.textAnimateBy) - 1, 0);
  const preTextBaseSec = preUnits * introStaggerSec;
  const textGroupDelaySec = preTextBaseSec + settings.textStagger / 1000;
  const iconDelaySec = preTextBaseSec + settings.iconDelay / 1000;
  const iconDurationSec = settings.iconIntroSpeed / 1000;

  const textOutroEase = EASING_CURVES[settings.textOutroCurve];
  const iconOutroEase = EASING_CURVES[settings.iconOutroCurve];
  const outroDurationSec = settings.textOutroSpeed / 1000;
  const outroStaggerSec = Math.max((settings.textOutroSpeed + settings.textOutroDelay) / 1000, 0);
  const outroTextGroupDelaySec = Math.max(settings.textOutroStagger / 1000, 0);
  const iconOutroDelaySec = Math.max(settings.iconOutroDelay / 1000, 0);
  const iconOutroDurationSec = settings.iconOutroSpeed / 1000;

  return (
    <motion.div
      key={animKey}
      className="textRow"
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {preText && (
        <AnimatedText
          className="headline headlineDark"
          text={preText}
          animateBy={settings.textAnimateBy}
          outroAnimateBy={settings.textOutroAnimateBy}
          introDelay={0}
          introStagger={introStaggerSec}
          introDuration={introDurationSec}
          introBlur={settings.textBlur}
          introScale={settings.textScale}
          introEase={textEase}
          outroDelay={0}
          outroStagger={outroStaggerSec}
          outroDuration={outroDurationSec}
          outroBlur={settings.textOutroBlur}
          outroScale={settings.textOutroScale}
          outroEase={textOutroEase}
        />
      )}
      {hasIcon && (
        <AnimatedIcon
          iconSrc={headline.iconSrc}
          introDelay={iconDelaySec}
          introDuration={iconDurationSec}
          introEase={iconEase}
          scaleIn={settings.iconScaleIn}
          scaleOut={settings.iconScaleOut}
          opacityIn={settings.iconOpacityIn}
          opacityOut={settings.iconOpacityOut}
          outroDelay={iconOutroDelaySec}
          outroDuration={iconOutroDurationSec}
          outroEase={iconOutroEase}
          outroScaleTo={settings.iconOutroScaleTo}
          outroOpacityTo={settings.iconOutroOpacityTo}
        />
      )}
      {postText && (
        <AnimatedText
          className="headline"
          style={{ color: ICON_TEXT_COLORS[headline.iconSrc] }}
          text={postText}
          animateBy={settings.textAnimateBy}
          outroAnimateBy={settings.textOutroAnimateBy}
          introDelay={textGroupDelaySec}
          introStagger={introStaggerSec}
          introDuration={introDurationSec}
          introBlur={settings.textBlur}
          introScale={settings.textScale}
          introEase={textEase}
          outroDelay={outroTextGroupDelaySec}
          outroStagger={outroStaggerSec}
          outroDuration={outroDurationSec}
          outroBlur={settings.textOutroBlur}
          outroScale={settings.textOutroScale}
          outroEase={textOutroEase}
        />
      )}
    </motion.div>
  );
}

interface AnimationPreviewProps {
  settings: AnimationSettings;
  onClick?: () => void;
  className?: string;
}

export function AnimationPreview({ settings, onClick, className }: AnimationPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playKey, setPlayKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const safeIndex = Math.min(
    currentIndex,
    Math.max(settings.headlines.length - 1, 0),
  );

  useEffect(() => {
    if (currentIndex !== safeIndex) setCurrentIndex(safeIndex);
  }, [currentIndex, safeIndex]);

  const headline = settings.headlines[safeIndex];

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!headline || settings.headlines.length <= 1) return;

    const introDur = computeIntroDuration(headline, settings);
    const waitMs = (introDur + settings.displayDuration) * 1000;

    timerRef.current = setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % settings.headlines.length);
    }, waitMs);

    return () => clearTimeout(timerRef.current);
  }, [safeIndex, playKey, headline, settings]);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
      return;
    }
    clearTimeout(timerRef.current);
    if (settings.headlines.length > 1) {
      setCurrentIndex((i) => (i + 1) % settings.headlines.length);
    } else {
      setPlayKey((k) => k + 1);
    }
  }, [onClick, settings.headlines.length]);

  if (!headline) return null;

  const animKey = `${safeIndex}-${playKey}`;

  return (
    <div className={className ?? "container"} onClick={handleClick}>
      <AnimatePresence mode="wait">
        <HeadlineFrame
          key={animKey}
          headline={headline}
          settings={settings}
          animKey={animKey}
        />
      </AnimatePresence>
    </div>
  );
}
