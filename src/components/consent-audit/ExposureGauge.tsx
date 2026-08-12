'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getScoreColor, getScoreLabel } from './data';

interface ExposureGaugeProps {
  score: number;
}

export function ExposureGauge({ score }: ExposureGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const motionScore = useMotionValue(0);
  const arcLength = useTransform(motionScore, [0, 100], [0, 1]);
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  useEffect(() => {
    const controls = animate(motionScore, score, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayScore(Math.round(v)),
    });
    return () => controls.stop();
  }, [score, motionScore]);

  // SVG arc parameters
  const radius = 80;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <svg width="200" height="200" viewBox="0 0 200 200" aria-label={`Exposure score: ${score} out of 100`}>
          {/* Background arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgba(236, 231, 220, 0.08)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={0}
            transform="rotate(-90 100 100)"
          />
          {/* Score arc */}
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transform="rotate(-90 100 100)"
            style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
          {/* Center text */}
          <text
            x="100"
            y="92"
            textAnchor="middle"
            fill={color}
            fontSize="42"
            fontWeight="700"
            fontFamily="var(--font-geist-sans), sans-serif"
          >
            {displayScore}
          </text>
          <text
            x="100"
            y="116"
            textAnchor="middle"
            fill="rgba(236, 231, 220, 0.75)"
            fontSize="11"
            fontFamily="var(--font-geist-mono), monospace"
            letterSpacing="0.1em"
          >
            OF 100
          </text>
        </svg>
      </motion.div>

      <div className="text-center">
        <motion.p
          key={label}
          className="text-sm font-semibold mb-1"
          style={{ color }}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {label}
        </motion.p>
        <p className="text-xs max-w-xs mx-auto" style={{ color: 'rgba(236, 231, 220, 0.8)', lineHeight: 1.5 }}>
          {score === 0 && "No categories shared yet. Your identity profile is minimal across AI systems."}
          {score > 0 && score <= 25 && "Some data is shared, but your identity remains fragmented across apps."}
          {score > 25 && score <= 50 && "Multiple data types are combining. Apps can start forming basic profiles."}
          {score > 50 && score <= 75 && "Rich cross-app data enables significant identity reconstruction."}
          {score > 75 && "Your combined permissions create a near-complete behavioral model across AI systems."}
        </p>
      </div>
    </div>
  );
}
