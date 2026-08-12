'use client';

import { motion } from 'framer-motion';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { BIAS_LOOPS, SENSITIVITY_COLORS } from './data';

export function BiasPaths() {
  return (
    <div className="space-y-6">
      {BIAS_LOOPS.map((loop, i) => (
        <motion.div
          key={loop.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.12, duration: 0.5 }}
          className="space-y-3"
        >
          {/* Category tags */}
          <div className="flex items-center gap-2">
            <AlertTriangle size={12} style={{ color: SENSITIVITY_COLORS.high }} />
            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(236, 231, 220, 0.7)', fontFamily: 'var(--font-geist-mono), monospace' }}>
              Loop {i + 1}:
            </span>
            {loop.categories.map((cat) => (
              <span
                key={cat}
                className="px-1.5 py-0.5 rounded text-[10px] capitalize"
                style={{
                  backgroundColor: 'rgba(236, 231, 220, 0.08)',
                  color: 'rgba(236, 231, 220, 0.85)',
                  fontFamily: 'var(--font-geist-mono), monospace',
                }}
              >
                {cat}
              </span>
            ))}
          </div>

          {/* Flow chain */}
          <div className="relative pl-4">
            {/* Vertical line */}
            <div
              className="absolute left-[7px] top-2 bottom-2"
              style={{ width: '1px', backgroundColor: 'rgba(236, 231, 220, 0.1)' }}
            />

            <div className="space-y-1">
              {loop.steps.map((step, j) => (
                <motion.div
                  key={j}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.12 + j * 0.08, duration: 0.4 }}
                  className="flex items-start gap-2.5 relative"
                >
                  {/* Node dot */}
                  <div className="relative z-10 shrink-0 mt-1">
                    <div
                      className="w-[15px] h-[15px] rounded-full border flex items-center justify-center"
                      style={{
                        borderColor: j === loop.steps.length - 1 ? SENSITIVITY_COLORS.high : 'rgba(236, 231, 220, 0.55)',
                        backgroundColor: j === loop.steps.length - 1 ? 'rgba(161, 61, 52, 0.15)' : 'transparent',
                      }}
                    >
                      {j === loop.steps.length - 1 && (
                        <AlertTriangle size={7} style={{ color: SENSITIVITY_COLORS.high }} />
                      )}
                    </div>
                  </div>

                  {/* Arrow and text */}
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {j > 0 && (
                      <ArrowRight size={10} className="shrink-0 mt-1" style={{ color: 'rgba(236, 231, 220, 0.55)' }} />
                    )}
                    <p
                      className="text-xs leading-relaxed"
                      style={{
                        color: j === loop.steps.length - 1 ? 'rgba(236, 231, 220, 0.8)' : 'rgba(236, 231, 220, 0.75)',
                        fontWeight: j === loop.steps.length - 1 ? 500 : 400,
                      }}
                    >
                      {step}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Loop-back indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.12 + loop.steps.length * 0.08 + 0.2 }}
              className="mt-3 pl-7 flex items-center gap-1.5"
            >
              <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ backgroundColor: 'rgba(161, 61, 52, 0.08)', border: '1px dashed rgba(161, 61, 52, 0.25)' }}>
                <span className="text-[9px] uppercase tracking-wider" style={{ color: SENSITIVITY_COLORS.high, fontFamily: 'var(--font-geist-mono), monospace' }}>
                  ↻ Loop reinforces
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
