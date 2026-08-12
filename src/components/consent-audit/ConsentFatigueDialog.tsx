'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';
import {
  IDENTITY_ASPECTS,
  SENSITIVITY_COLORS,
  calculateImpactScore,
  collectGrantedFromLedger,
  isAspectEnabled,
  type LedgerEntry,
} from './data';

interface ConsentFatigueDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onReview: () => void;
  allGrantedFromLedger: Set<string>;
  ledger: LedgerEntry[];
}

export function ConsentFatigueDialog({
  open,
  onClose,
  onConfirm,
  onReview,
  allGrantedFromLedger,
  ledger,
}: ConsentFatigueDialogProps) {
  if (!open) return null;

  // Calculate new score if all 9 are granted
  const allNine = new Set([
    'event', 'purchase', 'preference', 'project', 'claim',
    'relationship', 'fact', 'other', 'instruction',
  ]);
  const newScore = calculateImpactScore(allGrantedFromLedger, ledger, allNine);

  // Find the 3 most sensitive identity aspects that would be enabled
  const sensitivityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  const allGranted = new Set([...allGrantedFromLedger, ...allNine]);
  const enabledAspects = IDENTITY_ASPECTS
    .filter((a) => isAspectEnabled(a, allGranted))
    .sort((a, b) => sensitivityOrder[b.sensitivity] - sensitivityOrder[a.sensitivity])
    .slice(0, 3);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(28, 35, 51, 0.85)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Dialog */}
      <motion.div
        className="relative w-full max-w-md rounded-lg p-6 z-10"
        style={{
          backgroundColor: '#ECE7DC',
          color: '#1C2333',
          boxShadow: '0 40px 80px -20px rgba(0, 0, 0, 0.6)',
        }}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded hover:opacity-70 transition-opacity"
          style={{ color: '#4B5468' }}
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>

        {/* Warning icon */}
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={20} style={{ color: SENSITIVITY_COLORS.high }} />
          <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}>
            Before you approve all
          </h3>
        </div>

        <p className="text-sm mb-4" style={{ color: '#4B5468', lineHeight: 1.6 }}>
          You&apos;re about to share all 9 categories with Claude. Before you continue, here&apos;s what
          this means in combination with your existing grants:
        </p>

        {/* New score */}
        <div className="flex items-center gap-3 mb-4 p-3 rounded" style={{ backgroundColor: 'rgba(28, 35, 51, 0.06)' }}>
          <div className="text-center">
            <div
              className="text-2xl font-bold"
              style={{
                color: newScore > 75 ? SENSITIVITY_COLORS.critical : newScore > 50 ? SENSITIVITY_COLORS.high : SENSITIVITY_COLORS.medium,
                fontFamily: 'var(--font-geist-sans), sans-serif',
              }}
            >
              {newScore}
            </div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: '#4B5468', fontFamily: 'var(--font-geist-mono), monospace' }}>
              Exposure Score
            </div>
          </div>
          <div className="flex-1">
            <div className="text-xs" style={{ color: '#4B5468', lineHeight: 1.5 }}>
              Your cumulative exposure would rise to <strong style={{ color: '#1C2333' }}>{newScore}/100</strong>.
              {newScore > 75
                ? ' This creates a near-complete behavioral model across AI systems.'
                : newScore > 50
                  ? ' This enables significant identity reconstruction across connected apps.'
                  : ' This expands AI\'s ability to form cross-app profiles about you.'}
            </div>
          </div>
        </div>

        {/* Sensitive aspects */}
        <div className="mb-5">
          <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: '#4B5468', fontFamily: 'var(--font-geist-mono), monospace' }}>
            This would enable:
          </p>
          <div className="space-y-2">
            {enabledAspects.map((aspect) => (
              <div
                key={aspect.label}
                className="flex items-start gap-2"
              >
                <ShieldAlert size={14} className="shrink-0 mt-0.5" style={{ color: SENSITIVITY_COLORS[aspect.sensitivity] }} />
                <div>
                  <span className="text-xs font-semibold" style={{ color: '#1C2333' }}>{aspect.label}</span>
                  <span
                    className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded uppercase"
                    style={{
                      backgroundColor: `${SENSITIVITY_COLORS[aspect.sensitivity]}15`,
                      color: SENSITIVITY_COLORS[aspect.sensitivity],
                      fontFamily: 'var(--font-geist-mono), monospace',
                    }}
                  >
                    {aspect.sensitivity}
                  </span>
                  <p className="text-[11px] mt-0.5" style={{ color: '#4B5468', lineHeight: 1.4 }}>
                    {aspect.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              onClose();
              onConfirm();
            }}
            className="w-full py-2.5 px-4 rounded text-sm font-semibold transition-colors"
            style={{
              backgroundColor: '#A13D34',
              color: '#fff',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#8B3228')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#A13D34')}
          >
            I understand, approve all
          </button>
          <button
            onClick={() => {
              onClose();
              onReview();
            }}
            className="w-full py-2.5 px-4 rounded text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'transparent',
              color: '#4B5468',
              border: '1px solid rgba(28, 35, 51, 0.15)',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(28, 35, 51, 0.04)')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Let me review individually
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
