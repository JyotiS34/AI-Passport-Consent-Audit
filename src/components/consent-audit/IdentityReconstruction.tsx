'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, ChevronRight } from 'lucide-react';
import {
  IDENTITY_ASPECTS,
  SENSITIVITY_COLORS,
  isAspectEnabled,
  findContributingApps,
  type IdentityAspect,
  type LedgerEntry,
  type Sensitivity,
} from './data';

interface IdentityReconstructionProps {
  allGranted: Set<string>;
  ledger: LedgerEntry[];
  currentSelection: Set<string>;
}

function SensitivityBadge({ sensitivity }: { sensitivity: Sensitivity }) {
  const color = SENSITIVITY_COLORS[sensitivity];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
      style={{
        backgroundColor: `${color}18`,
        color,
        fontFamily: 'var(--font-geist-mono), monospace',
      }}
    >
      {sensitivity}
    </span>
  );
}

export function IdentityReconstruction({ allGranted, ledger, currentSelection }: IdentityReconstructionProps) {
  const enabledAspects = IDENTITY_ASPECTS.filter((a) => isAspectEnabled(a, allGranted));
  const disabledAspects = IDENTITY_ASPECTS.filter((a) => !isAspectEnabled(a, allGranted));

  return (
    <div className="space-y-3">
      {/* Enabled aspects */}
      {enabledAspects.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {enabledAspects.map((aspect, i) => (
            <IdentityAspectCard
              key={aspect.label}
              aspect={aspect}
              enabled={true}
              allGranted={allGranted}
              ledger={ledger}
              currentSelection={currentSelection}
              index={i}
            />
          ))}
        </motion.div>
      )}

      {/* Disabled aspects */}
      {disabledAspects.length > 0 && (
        <div className="space-y-3 opacity-75">
          {disabledAspects.map((aspect, i) => (
            <IdentityAspectCard
              key={aspect.label}
              aspect={aspect}
              enabled={false}
              allGranted={allGranted}
              ledger={ledger}
              currentSelection={currentSelection}
              index={enabledAspects.length + i}
            />
          ))}
        </div>
      )}

      {enabledAspects.length === 0 && (
        <p className="text-sm italic" style={{ color: 'rgba(236, 231, 220, 0.7)' }}>
          No identity aspects are currently reconstructible. Grant additional categories to see what becomes inferable.
        </p>
      )}
    </div>
  );
}

function IdentityAspectCard({
  aspect,
  enabled,
  allGranted,
  ledger,
  currentSelection,
  index,
}: {
  aspect: IdentityAspect;
  enabled: boolean;
  allGranted: Set<string>;
  ledger: LedgerEntry[];
  currentSelection: Set<string>;
  index: number;
}) {
  // Find which apps contribute to the required categories
  const contributingApps = new Map<string, string[]>();
  if (aspect.required !== 'all') {
    for (const cat of aspect.required) {
      const apps = findContributingApps(cat, ledger, currentSelection);
      contributingApps.set(cat, apps);
    }
  } else {
    for (const cat of allGranted) {
      const apps = findContributingApps(cat, ledger, currentSelection);
      contributingApps.set(cat, apps);
    }
  }

  const uniqueApps = new Set<string>();
  for (const apps of contributingApps.values()) {
    for (const app of apps) uniqueApps.add(app);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: enabled ? 1 : 0.75, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className={`rounded-lg p-4 transition-colors ${
        enabled
          ? 'border-l-3'
          : ''
      }`}
      style={{
        backgroundColor: enabled ? 'rgba(161, 61, 52, 0.08)' : 'rgba(236, 231, 220, 0.04)',
        borderLeftColor: enabled ? SENSITIVITY_COLORS[aspect.sensitivity] : 'transparent',
        borderLeftWidth: 3,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {enabled ? (
            <ShieldCheck size={18} className="text-red-400" style={{ color: SENSITIVITY_COLORS[aspect.sensitivity] }} />
          ) : (
            <ShieldAlert size={18} style={{ color: 'rgba(236, 231, 220, 0.55)' }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold" style={{ color: enabled ? '#ECE7DC' : 'rgba(236, 231, 220, 0.75)' }}>
              {aspect.label}
            </h4>
            <SensitivityBadge sensitivity={aspect.sensitivity} />
          </div>
          <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'rgba(236, 231, 220, 0.85)' }}>
            {aspect.description}
          </p>

          {enabled && uniqueApps.size > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 flex items-center gap-1.5 flex-wrap"
            >
              <span className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(236, 231, 220, 0.85)', fontFamily: 'var(--font-geist-mono), monospace' }}>
                Data from:
              </span>
              {Array.from(uniqueApps).map((app) => (
                <span
                  key={app}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]"
                  style={{
                    backgroundColor: 'rgba(236, 231, 220, 0.1)',
                    color: 'rgba(236, 231, 220, 0.7)',
                    fontFamily: 'var(--font-geist-mono), monospace',
                  }}
                >
                  <ChevronRight size={8} />
                  {app}
                </span>
              ))}
            </motion.div>
          )}

          {!enabled && aspect.required !== 'all' && (
            <p className="text-[10px] mt-2" style={{ color: 'rgba(236, 231, 220, 0.8)', fontFamily: 'var(--font-geist-mono), monospace' }}>
              Requires: {aspect.required.join(' + ')}
            </p>
          )}
          {!enabled && aspect.required === 'all' && (
            <p className="text-[10px] mt-2" style={{ color: 'rgba(236, 231, 220, 0.8)', fontFamily: 'var(--font-geist-mono), monospace' }}>
              Requires: all 9 categories
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
