import { useMemo } from "react";
import { motion } from "motion/react";
import type { CubicBezier } from "./easing";
import styles from "./styles.module.css";

interface AnimatedIconProps {
  iconSrc: string;
  introDelay: number;
  introDuration: number;
  introEase: CubicBezier;
  scaleFrom: number;
  scaleTo: number;
  opacityFrom: number;
  opacityTo: number;
  outroDelay: number;
  outroDuration: number;
  outroEase: CubicBezier;
  outroScaleTo: number;
  outroOpacityTo: number;
  reducedMotion: boolean;
}

export function AnimatedIcon({
  iconSrc,
  introDelay,
  introDuration,
  introEase,
  scaleFrom,
  scaleTo,
  opacityFrom,
  opacityTo,
  outroDelay,
  outroDuration,
  outroEase,
  outroScaleTo,
  outroOpacityTo,
  reducedMotion,
}: AnimatedIconProps) {
  const variants = useMemo(
    () => ({
      hidden: { scale: scaleFrom, opacity: opacityFrom },
      visible: {
        scale: scaleTo,
        opacity: opacityTo,
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
    }),
    [
      scaleFrom,
      scaleTo,
      opacityFrom,
      opacityTo,
      introDuration,
      introEase,
      introDelay,
      outroScaleTo,
      outroOpacityTo,
      outroDuration,
      outroEase,
      outroDelay,
    ],
  );

  if (reducedMotion) {
    return (
      <div className={styles.iconContainer}>
        <img className={styles.iconImg} alt="" src={iconSrc} />
      </div>
    );
  }

  return (
    <motion.div className={styles.iconContainer} variants={variants}>
      <img className={styles.iconImg} alt="" src={iconSrc} />
    </motion.div>
  );
}
