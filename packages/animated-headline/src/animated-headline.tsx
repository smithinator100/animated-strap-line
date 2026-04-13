import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type CSSProperties,
} from "react";
import { AnimatePresence } from "motion/react";
import { usePress } from "react-aria";
import { VisuallyHidden } from "react-aria";
import { HeadlineFrame } from "./headline-frame";
import { SplitHeadlineRow } from "./split-headline-row";
import type { AnimatedHeadlineProps, AnimationConfig } from "./types";
import {
  computeIntroDuration,
  queryReducedMotion,
  resolveConfig,
  stripBrackets,
  stripStaticContent,
} from "./utils";
import styles from "./styles.module.css";

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(queryReducedMotion);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return reduced;
}

function computeWaitMs(
  headline: { text: string; iconSrc?: string },
  config: AnimationConfig,
  hasBrackets: boolean,
  isFirstCycle: boolean,
): number {
  let effectiveText: string;
  if (hasBrackets && !isFirstCycle) {
    effectiveText = stripStaticContent(headline.text).trim();
  } else {
    effectiveText = hasBrackets
      ? stripBrackets(headline.text)
      : headline.text;
  }

  const introDur = computeIntroDuration(
    { text: effectiveText, iconSrc: headline.iconSrc },
    config,
  );
  return (introDur + config.displayDuration) * 1000;
}

export function AnimatedHeadline({
  headlines,
  settings,
  autoPlay = true,
  onClick,
  onAdvance,
  className,
  style,
}: AnimatedHeadlineProps) {
  const config = useMemo(() => resolveConfig(settings), [settings]);
  const reducedMotion = useReducedMotion();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [playKey, setPlayKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const isFirstCycleRef = useRef(true);
  const onAdvanceRef = useRef(onAdvance);
  onAdvanceRef.current = onAdvance;

  const safeIndex = Math.min(
    currentIndex,
    Math.max(headlines.length - 1, 0),
  );

  useEffect(() => {
    if (currentIndex !== safeIndex) setCurrentIndex(safeIndex);
  }, [currentIndex, safeIndex]);

  const headline = headlines[safeIndex];

  const hasBrackets = useMemo(
    () =>
      headlines.some(
        (h) => h.text.includes("[") && h.text.includes("]"),
      ),
    [headlines],
  );

  useEffect(() => {
    isFirstCycleRef.current = true;
  }, [playKey, hasBrackets]);

  // Auto-advance timer
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!headline || !autoPlay || headlines.length <= 1) return;

    const waitMs = computeWaitMs(
      headline,
      config,
      hasBrackets,
      isFirstCycleRef.current,
    );

    timerRef.current = setTimeout(() => {
      isFirstCycleRef.current = false;
      const nextIndex = (safeIndex + 1) % headlines.length;
      setCurrentIndex(nextIndex);
      onAdvanceRef.current?.(nextIndex);
    }, waitMs);

    return () => clearTimeout(timerRef.current);
  }, [safeIndex, playKey, headline, config, hasBrackets, autoPlay, headlines.length]);

  const handlePress = useCallback(() => {
    if (onClick) {
      onClick();
      return;
    }
    clearTimeout(timerRef.current);
    if (headlines.length > 1) {
      isFirstCycleRef.current = false;
      const nextIndex = (safeIndex + 1) % headlines.length;
      setCurrentIndex(nextIndex);
      onAdvanceRef.current?.(nextIndex);
    } else {
      setPlayKey((k) => k + 1);
    }
  }, [onClick, headlines.length, safeIndex]);

  const { pressProps } = usePress({ onPress: handlePress });

  const liveText = useMemo(() => {
    if (!headline) return "";
    return stripBrackets(headline.text).replace("{icon}", "");
  }, [headline]);

  if (!headline) return null;

  const animKey = `${safeIndex}-${playKey}`;

  const containerClass = className
    ? `${styles.container} ${className}`
    : styles.container;

  const mergedStyle: CSSProperties | undefined = style;

  const content = hasBrackets ? (
    <SplitHeadlineRow
      headline={headline}
      firstHeadline={headlines[0]}
      config={config}
      animKey={animKey}
      playKey={playKey}
      isFirstCycle={isFirstCycleRef.current}
      reducedMotion={reducedMotion}
    />
  ) : (
    <AnimatePresence mode="wait">
      <HeadlineFrame
        key={animKey}
        headline={headline}
        config={config}
        animKey={animKey}
        reducedMotion={reducedMotion}
      />
    </AnimatePresence>
  );

  return (
    <div
      {...pressProps}
      role="region"
      aria-roledescription="animated headline"
      tabIndex={0}
      className={containerClass}
      style={mergedStyle}
    >
      {content}
      <VisuallyHidden>
        <div aria-live="polite" aria-atomic="true">
          {liveText}
        </div>
      </VisuallyHidden>
    </div>
  );
}
