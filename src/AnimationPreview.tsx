import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import {
  AnimationSettings,
  EASING_CURVES,
  ICON_OPTIONS,
  ICON_TEXT_COLORS,
  Headline,
} from "./settings";

/* ------------------------------------------------------------------ */
/*  Parsing                                                            */
/* ------------------------------------------------------------------ */

export function parseHeadline(text: string) {
  const iconIdx = text.indexOf("{icon}");
  const hasIcon = iconIdx !== -1;
  return {
    hasIcon,
    preText: hasIcon ? text.slice(0, iconIdx).trimEnd() : text,
    postText: hasIcon ? text.slice(iconIdx + 6).trimStart() : "",
  };
}

export interface HeadlineToken {
  kind: "text" | "icon";
  content: string;
  isStatic: boolean;
}

/** Split headline text into tokens, marking `[…]` content as static. */
export function tokenizeHeadline(text: string): HeadlineToken[] {
  const tokens: HeadlineToken[] = [];
  let i = 0;
  let inBracket = false;
  let buffer = "";

  while (i < text.length) {
    if (text[i] === "[") {
      if (buffer)
        tokens.push({ kind: "text", content: buffer, isStatic: inBracket });
      buffer = "";
      inBracket = true;
      i++;
    } else if (text[i] === "]") {
      if (buffer)
        tokens.push({ kind: "text", content: buffer, isStatic: inBracket });
      buffer = "";
      inBracket = false;
      i++;
    } else if (text.startsWith("{icon}", i)) {
      if (buffer)
        tokens.push({ kind: "text", content: buffer, isStatic: inBracket });
      buffer = "";
      tokens.push({ kind: "icon", content: "", isStatic: inBracket });
      i += 6;
    } else {
      buffer += text[i];
      i++;
    }
  }

  if (buffer)
    tokens.push({ kind: "text", content: buffer, isStatic: inBracket });
  return tokens;
}

/** Remove bracket markers but keep content inside. */
function stripBrackets(text: string): string {
  return text.replace(/\[([^\]]*)\]/g, "$1");
}

/** Remove bracket markers AND their content. */
function stripStaticContent(text: string): string {
  return text.replace(/\[[^\]]*\]/g, "");
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export function unitCount(
  text: string,
  animateBy: "letter" | "word",
): number {
  if (animateBy === "word") return text.split(/\s+/).filter(Boolean).length;
  return text.length;
}

export function wordStaggerScale(text: string): number {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return 1;
  const charCount = words.reduce((sum, w) => sum + w.length, 0);
  return charCount / words.length;
}

export function computeIntroDuration(
  headline: Headline,
  s: AnimationSettings,
): number {
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

/* ------------------------------------------------------------------ */
/*  AnimatedText                                                       */
/* ------------------------------------------------------------------ */

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
            className="letter"
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

/* ------------------------------------------------------------------ */
/*  AnimatedIcon                                                       */
/* ------------------------------------------------------------------ */

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
      transition: {
        duration: introDuration,
        ease: introEase,
        delay: introDelay,
      },
    },
    exit: {
      scale: outroScaleTo,
      opacity: outroOpacityTo,
      transition: {
        duration: outroDuration,
        ease: outroEase,
        delay: outroDelay,
      },
    },
  };

  const resolvedSrc = ICON_OPTIONS.find((o) => o.key === iconSrc)?.src ?? "";

  return (
    <motion.div className="icon-container" variants={variants}>
      <img className="icon-img" alt="" src={resolvedSrc} />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  HeadlineFrame — no-bracket path (unchanged)                        */
/* ------------------------------------------------------------------ */

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
  const introStaggerSec = Math.max(
    (settings.textIntroSpeed + settings.textDelay) / 1000,
    0,
  );
  const preUnits = Math.max(
    unitCount(preText, settings.textAnimateBy) - 1,
    0,
  );
  const preTextBaseSec = preUnits * introStaggerSec;
  const textGroupDelaySec = preTextBaseSec + settings.textStagger / 1000;
  const iconDelaySec = preTextBaseSec + settings.iconDelay / 1000;
  const iconDurationSec = settings.iconIntroSpeed / 1000;

  const textOutroEase = EASING_CURVES[settings.textOutroCurve];
  const iconOutroEase = EASING_CURVES[settings.iconOutroCurve];
  const outroDurationSec = settings.textOutroSpeed / 1000;
  const outroStaggerSec = Math.max(
    (settings.textOutroSpeed + settings.textOutroDelay) / 1000,
    0,
  );
  const outroTextGroupDelaySec = Math.max(
    settings.textOutroStagger / 1000,
    0,
  );
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

/* ------------------------------------------------------------------ */
/*  SplitHeadlineRow — bracket path: static segments persist           */
/* ------------------------------------------------------------------ */

function SplitHeadlineRow({
  headline,
  firstHeadline,
  settings,
  animKey,
  playKey,
  isFirstCycle,
}: {
  headline: Headline;
  firstHeadline: Headline;
  settings: AnimationSettings;
  animKey: string;
  playKey: number;
  isFirstCycle: boolean;
}) {
  // Determine which parts are static via token analysis of the first headline
  const tokens = tokenizeHeadline(firstHeadline.text);
  const iconTokIdx = tokens.findIndex((t) => t.kind === "icon");
  const hasIcon = iconTokIdx !== -1;

  const preToks = tokens
    .slice(0, hasIcon ? iconTokIdx : tokens.length)
    .filter((t) => t.kind === "text");
  const postToks = hasIcon
    ? tokens.slice(iconTokIdx + 1).filter((t) => t.kind === "text")
    : [];

  const preIsStatic = preToks.length > 0 && preToks.every((t) => t.isStatic);
  const iconIsStatic = hasIcon && tokens[iconTokIdx].isStatic;
  const postIsStatic =
    postToks.length > 0 && postToks.every((t) => t.isStatic);

  // Full text (brackets removed, content kept) for timing
  const fullText = stripBrackets(firstHeadline.text);
  const { preText: fullPreText } = parseHeadline(fullText);

  // Dynamic-only text from current headline
  const dynText = stripStaticContent(headline.text).trim();
  const { preText: dynPreText, postText: dynPostText } =
    parseHeadline(dynText);

  // Static text from first headline
  const staticPreText = preIsStatic ? fullPreText : "";
  const staticPostText = postIsStatic
    ? postToks.map((t) => t.content).join("").trim()
    : "";

  // ----- Shared timing constants -----
  const textEase = EASING_CURVES[settings.textIntroCurve];
  const iconEase = EASING_CURVES[settings.iconIntroCurve];
  const introDurationSec = settings.textIntroSpeed / 1000;
  const introStaggerSec = Math.max(
    (settings.textIntroSpeed + settings.textDelay) / 1000,
    0,
  );
  const iconDurationSec = settings.iconIntroSpeed / 1000;

  // Full-text delays (for static elements and first-cycle dynamic elements)
  const fullPreUnits = Math.max(
    unitCount(fullPreText, settings.textAnimateBy) - 1,
    0,
  );
  const fullPreBase = fullPreUnits * introStaggerSec;
  const fullIconDelay = fullPreBase + settings.iconDelay / 1000;
  const fullTextGroupDelay = fullPreBase + settings.textStagger / 1000;

  // Dynamic-only delays (for dynamic elements on subsequent cycles)
  const dynPreUnits = Math.max(
    unitCount(dynPreText, settings.textAnimateBy) - 1,
    0,
  );
  const dynPreBase = dynPreUnits * introStaggerSec;
  const dynIconDelay = dynPreBase + settings.iconDelay / 1000;
  const dynTextGroupDelay = dynPreBase + settings.textStagger / 1000;

  const effectiveIconDelay = isFirstCycle ? fullIconDelay : dynIconDelay;
  const effectiveTextGroupDelay = isFirstCycle
    ? fullTextGroupDelay
    : dynTextGroupDelay;

  // Outro timing
  const textOutroEase = EASING_CURVES[settings.textOutroCurve];
  const iconOutroEase = EASING_CURVES[settings.iconOutroCurve];
  const outroDurationSec = settings.textOutroSpeed / 1000;
  const outroStaggerSec = Math.max(
    (settings.textOutroSpeed + settings.textOutroDelay) / 1000,
    0,
  );
  const outroTextGroupDelay = Math.max(settings.textOutroStagger / 1000, 0);
  const iconOutroDelaySec = Math.max(settings.iconOutroDelay / 1000, 0);
  const iconOutroDurationSec = settings.iconOutroSpeed / 1000;

  const staticIconSrc = firstHeadline.iconSrc;
  const staticKey = `static-${playKey}`;

  const wrapperStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
  };

  const layoutTransition = {
    layout: { duration: 0.4, ease: [0.33, 1, 0.68, 1] as const },
  };

  return (
    <LayoutGroup>
      <div className="textRow">
        {/* ---- Pre-text ---- */}
        {preIsStatic && staticPreText ? (
          <motion.div
            key={`${staticKey}-pre`}
            layout
            transition={layoutTransition}
            style={wrapperStyle}
            initial="hidden"
            animate="visible"
          >
            <AnimatedText
              className="headline headlineDark"
              text={staticPreText}
              animateBy={settings.textAnimateBy}
              introDelay={0}
              introStagger={introStaggerSec}
              introDuration={introDurationSec}
              introBlur={settings.textBlur}
              introScale={settings.textScale}
              introEase={textEase}
              outroStagger={outroStaggerSec}
              outroDuration={outroDurationSec}
              outroBlur={settings.textOutroBlur}
              outroScale={settings.textOutroScale}
              outroEase={textOutroEase}
            />
          </motion.div>
        ) : dynPreText ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={animKey}
              style={wrapperStyle}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <AnimatedText
                className="headline headlineDark"
                text={dynPreText}
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
            </motion.div>
          </AnimatePresence>
        ) : null}

        {/* ---- Icon ---- */}
        {hasIcon && iconIsStatic ? (
          <motion.div
            key={`${staticKey}-icon`}
            layout
            transition={layoutTransition}
            style={wrapperStyle}
            initial="hidden"
            animate="visible"
          >
            <AnimatedIcon
              iconSrc={staticIconSrc}
              introDelay={fullIconDelay}
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
          </motion.div>
        ) : hasIcon ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={animKey}
              style={wrapperStyle}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <AnimatedIcon
                iconSrc={headline.iconSrc}
                introDelay={effectiveIconDelay}
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
            </motion.div>
          </AnimatePresence>
        ) : null}

        {/* ---- Post-text ---- */}
        {postIsStatic && staticPostText ? (
          <motion.div
            key={`${staticKey}-post`}
            layout
            transition={layoutTransition}
            style={wrapperStyle}
            initial="hidden"
            animate="visible"
          >
            <AnimatedText
              className="headline"
              style={{ color: ICON_TEXT_COLORS[staticIconSrc] }}
              text={staticPostText}
              animateBy={settings.textAnimateBy}
              introDelay={fullTextGroupDelay}
              introStagger={introStaggerSec}
              introDuration={introDurationSec}
              introBlur={settings.textBlur}
              introScale={settings.textScale}
              introEase={textEase}
              outroStagger={outroStaggerSec}
              outroDuration={outroDurationSec}
              outroBlur={settings.textOutroBlur}
              outroScale={settings.textOutroScale}
              outroEase={textOutroEase}
            />
          </motion.div>
        ) : dynPostText ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={animKey}
              style={wrapperStyle}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <AnimatedText
                className="headline"
                style={{ color: ICON_TEXT_COLORS[headline.iconSrc] }}
                text={dynPostText}
                animateBy={settings.textAnimateBy}
                outroAnimateBy={settings.textOutroAnimateBy}
                introDelay={effectiveTextGroupDelay}
                introStagger={introStaggerSec}
                introDuration={introDurationSec}
                introBlur={settings.textBlur}
                introScale={settings.textScale}
                introEase={textEase}
                outroDelay={outroTextGroupDelay}
                outroStagger={outroStaggerSec}
                outroDuration={outroDurationSec}
                outroBlur={settings.textOutroBlur}
                outroScale={settings.textOutroScale}
                outroEase={textOutroEase}
              />
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>
    </LayoutGroup>
  );
}

/* ------------------------------------------------------------------ */
/*  AnimationPreview                                                   */
/* ------------------------------------------------------------------ */

interface AnimationPreviewProps {
  settings: AnimationSettings;
  onClick?: () => void;
  className?: string;
}

export function AnimationPreview({
  settings,
  onClick,
  className,
}: AnimationPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playKey, setPlayKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const isFirstCycleRef = useRef(true);

  const safeIndex = Math.min(
    currentIndex,
    Math.max(settings.headlines.length - 1, 0),
  );

  useEffect(() => {
    if (currentIndex !== safeIndex) setCurrentIndex(safeIndex);
  }, [currentIndex, safeIndex]);

  const headline = settings.headlines[safeIndex];

  const hasBrackets = useMemo(
    () =>
      settings.headlines.some(
        (h) => h.text.includes("[") && h.text.includes("]"),
      ),
    [settings.headlines],
  );

  // Reset first-cycle tracking on replay or bracket-structure change
  useEffect(() => {
    isFirstCycleRef.current = true;
  }, [playKey, hasBrackets]);

  // Auto-advance timer
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!headline || settings.headlines.length <= 1) return;

    let introDur: number;
    if (hasBrackets && !isFirstCycleRef.current) {
      const dynamicText = stripStaticContent(headline.text).trim();
      introDur = computeIntroDuration(
        { ...headline, text: dynamicText },
        settings,
      );
    } else {
      const fullText = hasBrackets
        ? stripBrackets(headline.text)
        : headline.text;
      introDur = computeIntroDuration(
        { ...headline, text: fullText },
        settings,
      );
    }

    const waitMs = (introDur + settings.displayDuration) * 1000;

    timerRef.current = setTimeout(() => {
      isFirstCycleRef.current = false;
      setCurrentIndex((i) => (i + 1) % settings.headlines.length);
    }, waitMs);

    return () => clearTimeout(timerRef.current);
  }, [safeIndex, playKey, headline, settings, hasBrackets]);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
      return;
    }
    clearTimeout(timerRef.current);
    if (settings.headlines.length > 1) {
      isFirstCycleRef.current = false;
      setCurrentIndex((i) => (i + 1) % settings.headlines.length);
    } else {
      setPlayKey((k) => k + 1);
    }
  }, [onClick, settings.headlines.length]);

  if (!headline) return null;

  const animKey = `${safeIndex}-${playKey}`;

  if (hasBrackets) {
    return (
      <div className={className ?? "container"} onClick={handleClick}>
        <SplitHeadlineRow
          headline={headline}
          firstHeadline={settings.headlines[0]}
          settings={settings}
          animKey={animKey}
          playKey={playKey}
          isFirstCycle={isFirstCycleRef.current}
        />
      </div>
    );
  }

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
