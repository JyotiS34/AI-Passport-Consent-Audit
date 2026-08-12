'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Stethoscope, UserCheck, ChevronDown, Play, AlertTriangle } from 'lucide-react';
import {
  ALL_CATEGORIES,
  calculateImpactScore,
  collectGrantedFromLedger,
  getScoreColor,
  type LedgerEntry,
} from '@/components/consent-audit/data';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PersonaScenariosProps {
  allGranted: Set<string>;
  ledger: LedgerEntry[];
  impactScore: number;
  onSimulate: (categories: string[]) => void;
}

interface Persona {
  id: string;
  name: string;
  Icon: typeof GraduationCap;
  context: string;
  behavior: string;
  risk: string;
  categories: string[];
  accentColor: string;
}

// ─── Persona Definitions ──────────────────────────────────────────────────────

const PERSONAS: Persona[] = [
  {
    id: 'tired-teacher',
    name: 'The Tired Teacher',
    Icon: GraduationCap,
    context: 'End of a 12-hour day, 40 unread emails, a permissions prompt appears',
    behavior: 'Checks all boxes to get back to grading',
    risk: 'Shares relationship + event + preference + fact data. Combined with existing ChatGPT grant, this creates a Consumer Profile and partially enables Social Graph reconstruction.',
    categories: ['relationship', 'event', 'preference', 'fact'],
    accentColor: '#B4802A',
  },
  {
    id: 'fatigued-med-student',
    name: 'The Fatigued Med Student',
    Icon: Stethoscope,
    context: '3 AM, studying for boards, AI tutor asks for memory access',
    behavior: 'Approves without reading, assumes it\'s the same as last time',
    risk: 'Shares project + fact + claim + instruction. Enables Professional Identity reconstruction and Decision Patterns. The instruction category means AI can now act on their behalf.',
    categories: ['project', 'fact', 'claim', 'instruction'],
    accentColor: '#A13D34',
  },
  {
    id: 'non-technical-parent',
    name: 'The Non-Technical Parent',
    Icon: UserCheck,
    context: 'Setting up an AI assistant for their child\'s homework help',
    behavior: 'Doesn\'t understand categories, grants everything trusting the system',
    risk: 'Shares all 9 categories. Creates a complete Behavioral Twin — a predictive model that could simulate their family\'s decisions. This data feeds into AI training, reinforcing biases about "families like theirs."',
    categories: ALL_CATEGORIES,
    accentColor: '#7A1A1A',
  },
];

// ─── Category tag colors ────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  event: '#B4802A',
  purchase: '#A13D34',
  preference: '#4B5468',
  project: '#B4802A',
  claim: '#B4802A',
  relationship: '#A13D34',
  fact: '#4B5468',
  other: '#4B5468',
  instruction: '#C75B1A',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function PersonaScenarios({ allGranted, ledger, impactScore, onSimulate }: PersonaScenariosProps) {
  const [expanded, setExpanded] = useState(false);

  // Compute impact delta for each persona
  const grantedFromLedger = useMemo(() => collectGrantedFromLedger(ledger), [ledger]);

  const personaDeltas = useMemo(() => {
    return PERSONAS.map((persona) => {
      const simGranted = new Set(allGranted);
      for (const cat of persona.categories) {
        simGranted.add(cat);
      }
      const newScore = calculateImpactScore(grantedFromLedger, ledger, new Set(persona.categories));
      return {
        id: persona.id,
        delta: newScore - impactScore,
        newScore,
      };
    });
  }, [allGranted, ledger, impactScore, grantedFromLedger]);

  return (
    <section style={{ marginBottom: 36 }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 16 }}>
        <p
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            color: 'rgba(236, 231, 220, 0.7)',
            margin: '0 0 8px',
          }}
        >
          Persona Scenarios
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-fraunces), Georgia, serif',
            fontWeight: 600,
            fontSize: '1.3rem',
            color: '#ECE7DC',
            margin: '0 0 8px',
            lineHeight: 1.2,
          }}
        >
          Who Does This Actually Affect?
        </h2>
        <p
          style={{
            fontSize: '0.85rem',
            color: 'rgba(236, 231, 220, 0.65)',
            maxWidth: 580,
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          The consent flow isn&apos;t designed for experts. Here&apos;s how three typical users would navigate it.
        </p>
      </div>

      {/* ── Toggle Button ── */}
      <motion.button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 mb-3"
        style={{
          background: 'rgba(236, 231, 220, 0.06)',
          border: '1px solid rgba(236, 231, 220, 0.1)',
          borderRadius: 6,
          padding: '8px 16px',
          color: 'rgba(236, 231, 220, 0.7)',
          fontSize: '0.8rem',
          cursor: 'pointer',
          fontFamily: 'var(--font-geist-sans), sans-serif',
        }}
        whileHover={{ backgroundColor: 'rgba(236, 231, 220, 0.09)' }}
        whileTap={{ scale: 0.98 }}
        aria-expanded={expanded}
        aria-controls="persona-scenarios-panel"
      >
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={14} />
        </motion.span>
        {expanded ? 'Hide scenarios' : 'Show scenarios'}
      </motion.button>

      {/* ── Collapsible Panel ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id="persona-scenarios-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="grid gap-4 mt-4"
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              }}
            >
              {PERSONAS.map((persona, idx) => {
                const deltaInfo = personaDeltas[idx];
                const alreadySimulated = persona.categories.every((c) => allGranted.has(c));

                return (
                  <motion.article
                    key={persona.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="dash-panel rounded-lg"
                    style={{
                      padding: '20px 22px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      borderLeft: `3px solid ${persona.accentColor}`,
                    }}
                  >
                    {/* ── Icon + Name ── */}
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center rounded-md shrink-0"
                        style={{
                          width: 34,
                          height: 34,
                          background: `${persona.accentColor}18`,
                          color: persona.accentColor,
                        }}
                      >
                        <persona.Icon size={18} />
                      </div>
                      <h3
                        style={{
                          fontFamily: 'var(--font-fraunces), Georgia, serif',
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          color: '#ECE7DC',
                          margin: 0,
                          lineHeight: 1.2,
                        }}
                      >
                        {persona.name}
                      </h3>
                    </div>

                    {/* ── Context ── */}
                    <p
                      style={{
                        fontSize: '0.78rem',
                        fontStyle: 'italic',
                        color: 'rgba(236, 231, 220, 0.75)',
                        margin: 0,
                        lineHeight: 1.45,
                      }}
                    >
                      &ldquo;{persona.context}&rdquo;
                    </p>

                    {/* ── What they'd do ── */}
                    <div>
                      <p
                        style={{
                          fontFamily: 'var(--font-geist-mono), monospace',
                          fontSize: '0.65rem',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase' as const,
                          color: persona.accentColor,
                          margin: '0 0 4px',
                        }}
                      >
                        What they&apos;d do
                      </p>
                      <p
                        style={{
                          fontSize: '0.8rem',
                          color: 'rgba(236, 231, 220, 0.7)',
                          margin: 0,
                          lineHeight: 1.45,
                        }}
                      >
                        {persona.behavior}
                      </p>
                    </div>

                    {/* ── What actually happens ── */}
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 4,
                        background: 'rgba(161, 61, 52, 0.06)',
                        border: '1px solid rgba(161, 61, 52, 0.1)',
                      }}
                    >
                      <p
                        style={{
                          fontFamily: 'var(--font-geist-mono), monospace',
                          fontSize: '0.65rem',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase' as const,
                          color: '#A13D34',
                          margin: '0 0 4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <AlertTriangle size={10} />
                        What actually happens
                      </p>
                      <p
                        style={{
                          fontSize: '0.76rem',
                          color: 'rgba(236, 231, 220, 0.65)',
                          margin: 0,
                          lineHeight: 1.45,
                        }}
                      >
                        {persona.risk}
                      </p>

                      {/* ── Impact delta ── */}
                      <div
                        className="flex items-center gap-2 mt-2"
                        style={{
                          paddingTop: 8,
                          borderTop: '1px solid rgba(161, 61, 52, 0.08)',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-geist-mono), monospace',
                            fontSize: '0.65rem',
                            color: 'rgba(236, 231, 220, 0.7)',
                          }}
                        >
                          Score impact:
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-geist-mono), monospace',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: getScoreColor(deltaInfo.newScore),
                          }}
                        >
                          {impactScore} → {deltaInfo.newScore}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-geist-mono), monospace',
                            fontSize: '0.65rem',
                            color: deltaInfo.delta > 0 ? '#A13D34' : '#3F6B57',
                          }}
                        >
                          ({deltaInfo.delta > 0 ? '+' : ''}{deltaInfo.delta})
                        </span>
                      </div>
                    </div>

                    {/* ── Category Tags ── */}
                    <div className="flex flex-wrap gap-1.5">
                      {persona.categories.map((cat) => {
                        const isAlreadyGranted = allGranted.has(cat);
                        return (
                          <span
                            key={cat}
                            className="rounded px-1.5 py-0.5 capitalize"
                            style={{
                              fontSize: '0.65rem',
                              fontFamily: 'var(--font-geist-mono), monospace',
                              background: isAlreadyGranted
                                ? `${CATEGORY_COLORS[cat] || '#4B5468'}25`
                                : 'rgba(236, 231, 220, 0.04)',
                              color: isAlreadyGranted
                                ? CATEGORY_COLORS[cat] || '#4B5468'
                                : 'rgba(236, 231, 220, 0.6)',
                              border: `1px solid ${isAlreadyGranted ? `${CATEGORY_COLORS[cat] || '#4B5468'}30` : 'rgba(236, 231, 220, 0.06)'}`,
                              textDecoration: isAlreadyGranted ? 'line-through' : 'none',
                            }}
                          >
                            {cat}
                          </span>
                        );
                      })}
                    </div>

                    {/* ── Simulate Button ── */}
                    <motion.button
                      onClick={() => onSimulate(persona.categories)}
                      className="flex items-center justify-center gap-2 w-full mt-auto"
                      style={{
                        background: alreadySimulated
                          ? 'rgba(63, 107, 87, 0.15)'
                          : `${persona.accentColor}18`,
                        border: `1px solid ${alreadySimulated ? 'rgba(63, 107, 87, 0.3)' : `${persona.accentColor}35`}`,
                        borderRadius: 6,
                        padding: '8px 14px',
                        color: alreadySimulated ? '#3F6B57' : persona.accentColor,
                        fontSize: '0.78rem',
                        fontWeight: 500,
                        cursor: alreadySimulated ? 'default' : 'pointer',
                        fontFamily: 'var(--font-geist-sans), sans-serif',
                        opacity: alreadySimulated ? 0.7 : 1,
                      }}
                      whileHover={!alreadySimulated ? { scale: 1.02, backgroundColor: `${persona.accentColor}25` } : {}}
                      whileTap={!alreadySimulated ? { scale: 0.97 } : {}}
                      disabled={alreadySimulated}
                    >
                      <Play size={12} />
                      {alreadySimulated ? 'Already simulated' : 'Simulate this'}
                    </motion.button>
                  </motion.article>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
