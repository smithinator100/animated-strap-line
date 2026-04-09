import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AnimationSettings,
  DEFAULT_SETTINGS,
  EASING_CURVES,
  ICON_OPTIONS,
  ICON_TEXT_COLORS,
  Headline,
} from "./settings";
import { SettingsPanel } from "./SettingsPanel";
import "./App.css";

function parseHeadline(text: string) {
  const iconIdx = text.indexOf("{icon}");
  const hasIcon = iconIdx !== -1;
  return {
    hasIcon,
    preText: hasIcon ? text.slice(0, iconIdx).trimEnd() : text,
    postText: hasIcon ? text.slice(iconIdx + 6).trimStart() : "",
  };
}

function computeIntroDuration(headline: Headline, s: AnimationSettings): number {
  const { hasIcon, preText, postText } = parseHeadline(headline.text);
  const cs = s.textIntroSpeed / 1000;
  const lf = Math.max(cs * s.textOverlap, 0.15);
  const preBase = Math.max(preText.length - 1, 0) * cs;
  const preEnd = preBase + lf;
  const iconEnd = hasIcon
    ? preBase + s.iconDelay / 1000 + s.iconIntroSpeed / 1000
    : 0;
  const postStart = preBase + s.textStagger / 1000;
  const postEnd = postText
    ? postStart + Math.max(postText.length - 1, 0) * cs + lf
    : 0;
  return Math.max(preEnd, iconEnd, postEnd, 0);
}

interface AnimatedTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  introDelay?: number;
  introCharStagger: number;
  introOverlap: number;
  introBlur: number;
  introScale: number;
  introEase: [number, number, number, number];
  outroDelay?: number;
  outroCharStagger: number;
  outroOverlap: number;
  outroBlur: number;
  outroScale: number;
  outroEase: [number, number, number, number];
}

function AnimatedText({
  text,
  className,
  style,
  introDelay = 0,
  introCharStagger,
  introOverlap,
  introBlur,
  introScale,
  introEase,
  outroDelay = 0,
  outroCharStagger,
  outroOverlap,
  outroBlur,
  outroScale,
  outroEase,
}: AnimatedTextProps) {
  const chars = text.split("");
  const introLetterFade = Math.max(introCharStagger * introOverlap, 0.15);
  const outroLetterFade = Math.max(outroCharStagger * outroOverlap, 0.15);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: introCharStagger,
        staggerDirection: 1 as const,
        delayChildren: introDelay,
      },
    },
    exit: {
      transition: {
        staggerChildren: outroCharStagger,
        staggerDirection: 1 as const,
        delayChildren: outroDelay,
      },
    },
  };

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

  const letterVariants = {
    hidden: hiddenStyle,
    visible: {
      ...visibleStyle,
      transition: { duration: introLetterFade, ease: introEase },
    },
    exit: {
      ...exitStyle,
      transition: { duration: outroLetterFade, ease: outroEase },
    },
  };

  return (
    <motion.p className={className} style={style} variants={containerVariants}>
      {chars.map((char, i) => (
        <motion.span key={i} className="letter" variants={letterVariants}>
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
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

function AnimatedIcon({
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

export function App() {
  const [settings, setSettings] = useState<AnimationSettings>({
    ...DEFAULT_SETTINGS,
    headlines: DEFAULT_SETTINGS.headlines.map((h) => ({ ...h })),
  });
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
    clearTimeout(timerRef.current);
    if (settings.headlines.length > 1) {
      setCurrentIndex((i) => (i + 1) % settings.headlines.length);
    } else {
      setPlayKey((k) => k + 1);
    }
  }, [settings.headlines.length]);

  if (!headline) return null;

  const { hasIcon, preText, postText } = parseHeadline(headline.text);

  const textEase = EASING_CURVES[settings.textIntroCurve];
  const iconEase = EASING_CURVES[settings.iconIntroCurve];
  const charStaggerSec = settings.textIntroSpeed / 1000;
  const preTextBaseSec = Math.max(preText.length - 1, 0) * charStaggerSec;
  const textGroupDelaySec = preTextBaseSec + settings.textStagger / 1000;
  const iconDelaySec = preTextBaseSec + settings.iconDelay / 1000;
  const iconDurationSec = settings.iconIntroSpeed / 1000;

  const textOutroEase = EASING_CURVES[settings.textOutroCurve];
  const iconOutroEase = EASING_CURVES[settings.iconOutroCurve];
  const outroCharStaggerSec = settings.textOutroSpeed / 1000;
  const outroTextGroupDelaySec = Math.max(settings.textOutroStagger / 1000, 0);
  const iconOutroDelaySec = Math.max(settings.iconOutroDelay / 1000, 0);
  const iconOutroDurationSec = settings.iconOutroSpeed / 1000;

  const animKey = `${safeIndex}-${playKey}`;

  return (
    <div className="page">
      <div className="preview">
        <div className="container" onClick={handleClick}>
          <AnimatePresence mode="wait">
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
                  introDelay={0}
                  introCharStagger={charStaggerSec}
                  introOverlap={settings.textOverlap}
                  introBlur={settings.textBlur}
                  introScale={settings.textScale}
                  introEase={textEase}
                  outroDelay={0}
                  outroCharStagger={outroCharStaggerSec}
                  outroOverlap={settings.textOutroOverlap}
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
                  introDelay={textGroupDelaySec}
                  introCharStagger={charStaggerSec}
                  introOverlap={settings.textOverlap}
                  introBlur={settings.textBlur}
                  introScale={settings.textScale}
                  introEase={textEase}
                  outroDelay={outroTextGroupDelaySec}
                  outroCharStagger={outroCharStaggerSec}
                  outroOverlap={settings.textOutroOverlap}
                  outroBlur={settings.textOutroBlur}
                  outroScale={settings.textOutroScale}
                  outroEase={textOutroEase}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <SettingsPanel settings={settings} onChange={setSettings} />
    </div>
  );
}
