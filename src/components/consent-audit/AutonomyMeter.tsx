'use client';

import { motion, animate, useMotionValue } from 'framer-motion';
import { useEffect, useState } from 'react';
import { calculateAutonomy, getAutonomyLabel } from './data';

interface AutonomyMeterProps {
  allGranted: Set<string>;
}

function getBarColor(score: number): string {
  if (score >= 80) return '#3F6B57';
  if (score >= 50) return '#B4802A';
  if (score >= 25) return '#C75B1A';
  return '#A13D34';
}

function getBarBgColor(score: number): string {
  if (score >= 80) return 'rgba(63, 107, 87, 0.15)';
  if (score >= 50) return 'rgba(180, 128, 42, 0.15)';
  if (score >= 25) return 'rgba(199, 91, 26, 0.15)';
  return 'rgba(161, 61, 52, 0.15)';
}

export function AutonomyMeter({ allGranted }: AutonomyMeterProps) {
  const score = calculateAutonomy(allGranted);
  const [displayScore, setDisplayScore] = useState(100);
  const motionVal = useMotionValue(100);
  const color = getBarColor(score);
  const label = getAutonomyLabel(score);

  useEffect(() => {
    const controls = animate(motionVal, score, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayScore(Math.round(v)),
    });
    return () => controls.stop();
  }, [score, motionVal]);

  const thresholds = [
    { value: 100, label: 'Full autonomy' },
    { value: 80, label: 'Growing dependence' },
    { value: 50, label: 'Significant delegation' },
    { value: 25, label: 'Autonomy erosion' },
  ];

  return (
    <div className="space-y-4">
      {/* Score display */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider" style={{ color: 'rgba(236, 231, 220, 0.7)', fontFamily: 'var(--font-geist-mono), monospace' }}>
          Autonomy retained
        </span>
        <span className="text-2xl font-bold" style={{ color, fontFamily: 'var(--font-geist-sans), sans-serif' }}>
          {displayScore}%
        </span>
      </div>

      {/* Bar */}
      <div className="relative">
        <div
          className="w-full h-3 rounded-full overflow-hidden"
          style={{ backgroundColor: 'rgba(236, 231, 220, 0.06)' }}
        >
          <motion.div
            className="h-full rounded-full"
            initial={{ width: '100%' }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ backgroundColor: color }}
          />
        </div>

        {/* Threshold markers */}
        <div className="relative mt-1">
          {thresholds.map((t) => (
            <div
              key={t.value}
              className="absolute -top-[18px]"
              style={{ left: `${t.value}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-px h-2" style={{ backgroundColor: 'rgba(236, 231, 220, 0.15)' }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[9px]" style={{ color: 'rgba(236, 231, 220, 0.55)' }}>0%</span>
          <span className="text-[9px]" style={{ color: 'rgba(236, 231, 220, 0.55)' }}>100%</span>
        </div>
      </div>

      {/* Label */}
      <motion.p
        key={label}
        className="text-xs leading-relaxed"
        style={{ color: 'rgba(236, 231, 220, 0.8)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {label}
      </motion.p>

      {/* Threshold descriptions */}
      <div className="space-y-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(236, 231, 220, 0.08)' }}>
        {[
          { range: '80–100%', text: "You're in control — AI assists but doesn't decide", active: score >= 80 },
          { range: '50–79%', text: 'Growing dependence — AI shapes your options more than you realize', active: score >= 50 && score < 80 },
          { range: '25–49%', text: 'Significant delegation — many decisions follow AI-suggested paths', active: score >= 25 && score < 50 },
          { range: '0–24%', text: 'Autonomy erosion — AI effectively makes decisions in your name', active: score < 25 },
        ].map((item) => (
          <div
            key={item.range}
            className="flex items-start gap-2"
            style={{ opacity: item.active ? 1 : 0.55 }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
              style={{ backgroundColor: item.active ? color : 'rgba(236, 231, 220, 0.55)' }}
            />
            <div>
              <span className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(236, 231, 220, 0.75)', fontFamily: 'var(--font-geist-mono), monospace' }}>
                {item.range}
              </span>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(236, 231, 220, 0.8)' }}>
                {item.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
