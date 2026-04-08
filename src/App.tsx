import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { AnimationSettings, DEFAULT_SETTINGS, EASING_CURVES } from "./settings";
import { SettingsPanel } from "./SettingsPanel";
import "./App.css";

const imgFill =
  "https://www.figma.com/api/mcp/asset/ffab6c22-9219-4b9c-b2a7-111ca2358718";
const imgUnion =
  "https://www.figma.com/api/mcp/asset/b8f8173b-1cc4-47f2-a763-f3369202ad10";

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  charStagger: number;
  overlap: number;
  blur: number;
  scale: number;
  ease: [number, number, number, number];
}

function AnimatedText({
  text,
  className,
  delay = 0,
  charStagger,
  overlap,
  blur,
  scale,
  ease,
}: AnimatedTextProps) {
  const chars = text.split("");
  const letterFade = Math.max(charStagger * overlap, 0.15);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: charStagger,
        staggerDirection: 1 as const,
        delayChildren: delay,
      },
    },
  };

  const hiddenStyle: Record<string, number | string> = { opacity: 0 };
  const visibleStyle: Record<string, number | string> = { opacity: 1 };

  if (blur > 0) {
    hiddenStyle.filter = `blur(${blur}px)`;
    visibleStyle.filter = "blur(0px)";
  }
  if (scale > 0) {
    hiddenStyle.scale = scale;
    visibleStyle.scale = 1;
  }

  const letterVariants = {
    hidden: hiddenStyle,
    visible: {
      ...visibleStyle,
      transition: { duration: letterFade, ease },
    },
  };

  return (
    <motion.p
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {chars.map((char, i) => (
        <motion.span key={i} className="letter" variants={letterVariants}>
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.p>
  );
}

interface AnimatedIconProps {
  delay: number;
  duration: number;
  ease: [number, number, number, number];
  scaleIn: number;
  scaleOut: number;
  opacityIn: number;
  opacityOut: number;
}

function AnimatedIcon({
  delay,
  duration,
  ease,
  scaleIn,
  scaleOut,
  opacityIn,
  opacityOut,
}: AnimatedIconProps) {
  const variants = {
    hidden: { scale: scaleIn, opacity: opacityIn },
    visible: {
      scale: scaleOut,
      opacity: opacityOut,
      transition: { duration, ease, delay },
    },
  };

  return (
    <motion.div
      className="shield"
      variants={variants}
      initial="hidden"
      animate="visible"
    >
      <div className="shieldFill" data-name="Fill">
        <img alt="" src={imgFill} />
      </div>
      <div className="shieldUnion" data-name="Union">
        <img alt="" src={imgUnion} />
      </div>
    </motion.div>
  );
}

export function App() {
  const [settings, setSettings] = useState<AnimationSettings>({
    ...DEFAULT_SETTINGS,
  });
  const [playKey, setPlayKey] = useState(0);
  const replay = useCallback(() => setPlayKey((k) => k + 1), []);

  const textEase = EASING_CURVES[settings.textIntroCurve];
  const iconEase = EASING_CURVES[settings.iconIntroCurve];
  const charStaggerSec = settings.textIntroSpeed / 1000;
  const preTextDurationSec =
    Math.max(settings.preText.length - 1, 0) * charStaggerSec;
  const textGroupDelaySec = preTextDurationSec + settings.textStagger / 1000;
  const iconDelaySec = preTextDurationSec + settings.iconDelay / 1000;
  const iconDurationSec = settings.iconIntroSpeed / 1000;

  const animKey = `${playKey}-${JSON.stringify(settings)}`;

  return (
    <div className="page">
      <div className="preview">
        <div className="container" onClick={replay}>
          <div key={animKey} className="textRow">
            <AnimatedText
              className="headline headlineDark"
              text={settings.preText}
              delay={0}
              charStagger={charStaggerSec}
              overlap={settings.textOverlap}
              blur={settings.textBlur}
              scale={settings.textScale}
              ease={textEase}
            />
            <AnimatedIcon
              delay={iconDelaySec}
              duration={iconDurationSec}
              ease={iconEase}
              scaleIn={settings.iconScaleIn}
              scaleOut={settings.iconScaleOut}
              opacityIn={settings.iconOpacityIn}
              opacityOut={settings.iconOpacityOut}
            />
            <AnimatedText
              className="headline headlineGreen"
              text={settings.postText}
              delay={textGroupDelaySec}
              charStagger={charStaggerSec}
              overlap={settings.textOverlap}
              blur={settings.textBlur}
              scale={settings.textScale}
              ease={textEase}
            />
          </div>
        </div>
      </div>
      <SettingsPanel settings={settings} onChange={setSettings} />
    </div>
  );
}
