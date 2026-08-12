'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Check, Undo2, ArrowRight, AlertTriangle, ChevronRight } from 'lucide-react';
import {
  LIVE_EVIDENCE,
  LEDGER_SEED,
  ALL_CATEGORIES,
  SENSITIVITY_COLORS,
  IDENTITY_ASPECTS,
  calculateImpactScore,
  collectGrantedFromLedger,
  findContributingApps,
  findEnabledAspectsForCategory,
  getScoreColor,
  type LedgerEntry,
  type ActiveTab,
  type Sensitivity,
} from '@/components/consent-audit/data';
import { ExposureGauge } from '@/components/consent-audit/ExposureGauge';
import { IdentityReconstruction } from '@/components/consent-audit/IdentityReconstruction';
import { CrossAppDataFlow } from '@/components/consent-audit/CrossAppDataFlow';
import { AutonomyMeter } from '@/components/consent-audit/AutonomyMeter';
import { BiasPaths } from '@/components/consent-audit/BiasPaths';
import { ConsentFatigueDialog } from '@/components/consent-audit/ConsentFatigueDialog';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function Home() {
  // ── State ──
  const [activeTab, setActiveTab] = useState<ActiveTab>('impact');
  const [granted, setGranted] = useState<Set<string>>(() => new Set());
  const [ledger, setLedger] = useState<LedgerEntry[]>(LEDGER_SEED);
  const [showFatigueDialog, setShowFatigueDialog] = useState(false);
  const [confirmed, setConfirmed] = useState<{ count: number } | null>(null);
  const [animatedTabKey, setAnimatedTabKey] = useState(0);

  // ── Computed ──
  const grantedFromLedger = useMemo(() => collectGrantedFromLedger(ledger), [ledger]);

  const allGranted = useMemo(() => {
    const combined = new Set(grantedFromLedger);
    for (const cat of granted) combined.add(cat);
    return combined;
  }, [grantedFromLedger, granted]);

  const impactScore = useMemo(
    () => calculateImpactScore(grantedFromLedger, ledger, granted),
    [grantedFromLedger, ledger, granted]
  );

  // ── Handlers ──
  const toggleCategory = useCallback((cat: string) => {
    setGranted((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) { next.delete(cat); } else { next.add(cat); }
      return next;
    });
  }, []);

  const confirmShare = useCallback(
    (categories: string[]) => {
      const entry: LedgerEntry = {
        id: Date.now(),
        requester: 'Claude',
        date: formatDate(new Date()),
        categories,
        total: LIVE_EVIDENCE.length,
        revoked: false,
      };
      setLedger((prev) => [entry, ...prev]);
      setConfirmed({ count: categories.length });
    },
    []
  );

  const handleApproveSelected = useCallback(() => {
    confirmShare(Array.from(granted));
  }, [granted, confirmShare]);

  const handleApproveAll = useCallback(() => {
    const all = LIVE_EVIDENCE.map((e) => e.category);
    setGranted(new Set(all));
    confirmShare(all);
  }, [confirmShare]);

  const handleApproveAllWithFatigue = useCallback(() => {
    setShowFatigueDialog(true);
  }, []);

  const handleFatigueConfirm = useCallback(() => {
    const all = LIVE_EVIDENCE.map((e) => e.category);
    setGranted(new Set(all));
    confirmShare(all);
  }, [confirmShare]);

  const handleFatigueReview = useCallback(() => {
    // Do nothing — dialog closes, user reviews individually
  }, []);

  const handleReset = useCallback(() => {
    setGranted(new Set());
    setConfirmed(null);
  }, []);

  const toggleRevoke = useCallback((id: number) => {
    setLedger((prev) =>
      prev.map((e) => (e.id === id ? { ...e, revoked: !e.revoked } : e))
    );
  }, []);

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setAnimatedTabKey((k) => k + 1);
    setActiveTab(tab);
  }, []);

  // ── Tab animation variants ──
  const tabVariants = {
    enter: { opacity: 0, y: 12 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
  };

  return (
    <div className="apa">
      <div className="inner" style={{ padding: '48px 20px 20px' }}>

        {/* ═══════════════════════════════════════════════════
            SECTION 1: Hero Header
            ═══════════════════════════════════════════════════ */}
        <header>
          <motion.p
            className="eyebrow"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.72rem',
              letterSpacing: '0.13em',
              textTransform: 'uppercase' as const,
              color: 'rgba(236, 231, 220, 0.8)',
              margin: '0 0 14px',
            }}
          >
            AI Passport Consent Audit — Egoist Machines
          </motion.p>

          <motion.h1
            className="title"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              fontFamily: 'var(--font-fraunces), Georgia, serif',
              fontWeight: 700,
              fontSize: 'clamp(1.9rem, 4.6vw, 2.9rem)',
              lineHeight: 1.1,
              margin: '0 0 14px',
              color: '#ECE7DC',
            }}
          >
            What You Permit
            <br />
            vs. What You Expose
          </motion.h1>

          <motion.p
            className="subtitle"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontSize: '0.98rem',
              color: 'rgba(236, 231, 220, 0.75)',
              maxWidth: 600,
              lineHeight: 1.55,
              margin: '0 0 28px',
            }}
          >
            Granting granular permissions doesn&apos;t mean you understand the cumulative impact.
            The audit helps you see not just what&apos;s enabled, but what your combined permissions
            actually reveal about you across AI systems — and how that affects your autonomy and identity.
          </motion.p>

          {/* ── Decorative line ── */}
          <div className="deco-line" style={{ marginBottom: 28 }} />

          {/* ── Navigation Tabs ── */}
          <motion.nav
            className="mode-toggle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{
              display: 'inline-flex',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 999,
              padding: 4,
              gap: 2,
              marginBottom: 36,
            }}
            role="tablist"
            aria-label="Audit sections"
          >
            {([
              { key: 'problem' as ActiveTab, label: 'The Problem' },
              { key: 'impact' as ActiveTab, label: 'Cumulative Impact' },
              { key: 'fix' as ActiveTab, label: 'The Fix' },
            ]).map((tab) => (
              <button
                key={tab.key}
                className={activeTab === tab.key ? 'active' : ''}
                onClick={() => handleTabChange(tab.key)}
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls={`panel-${tab.key}`}
                style={{
                  fontFamily: 'var(--font-geist-sans), sans-serif',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  padding: '8px 20px',
                  border: 'none',
                  borderRadius: 999,
                  background: activeTab === tab.key ? '#ECE7DC' : 'transparent',
                  color: activeTab === tab.key ? '#1C2333' : 'rgba(236, 231, 220, 0.85)',
                  cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                  letterSpacing: activeTab === tab.key ? '0.01em' : '0',
                  textShadow: activeTab === tab.key ? 'none' : 'none',
                  boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0, 0, 0, 0.2)' : 'none',
                }}
              >
                {tab.label}
                {tab.key === 'impact' && (
                  <span
                    className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px]"
                    style={{
                      backgroundColor: `${getScoreColor(impactScore)}20`,
                      color: getScoreColor(impactScore),
                      fontFamily: 'var(--font-geist-mono), monospace',
                    }}
                  >
                    {impactScore}
                  </span>
                )}
              </button>
            ))}
          </motion.nav>
        </header>

        {/* ═══════════════════════════════════════════════════
            TAB CONTENT
            ═══════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${animatedTabKey}`}
            variants={tabVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            id={`panel-${activeTab}`}
            role="tabpanel"
          >
            {/* ───────────────────────────────────────────
                SECTION 2: The Problem
                ─────────────────────────────────────────── */}
            {activeTab === 'problem' && (
              <div className="space-y-6">
                <section className="paper-card evidence-texture" style={{ padding: '30px 32px' }}>
                  <div
                    className="evidence-head"
                    style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}
                  >
                    <h2 style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontWeight: 600, fontSize: '1.2rem', margin: 0 }}>recall() from Claude</h2>
                    <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.75rem', color: '#4B5468' }}>
                      9 categories requested
                    </span>
                  </div>
                  <p
                    className="evidence-purpose"
                    style={{ fontSize: '0.82rem', color: '#4B5468', margin: '4px 0 22px', lineHeight: 1.5 }}
                  >
                    Purpose sent with the request:{' '}
                    <code style={{ background: 'rgba(28, 35, 51, 0.08)', padding: '1px 6px', borderRadius: 3, fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.78rem' }}>
                      &quot;recall&quot;
                    </code>{' '}
                    — the only value the API&apos;s <code style={{ background: 'rgba(28, 35, 51, 0.08)', padding: '1px 6px', borderRadius: 3, fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.78rem' }}>purpose</code> field
                    currently accepts, so no real reason travels with the ask.
                  </p>

                  {/* Request list */}
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {LIVE_EVIDENCE.map((r) => (
                      <li key={r.id} className="req-row">
                        <span className={`sens-dot ${r.sensitivity}`} />
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 500, textTransform: 'capitalize' }}>{r.category}</div>
                          <div style={{ fontSize: '0.76rem', color: '#4B5468' }}>{r.note}</div>
                        </div>
                        <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.72rem', color: '#4B5468' }}>req {r.id}</span>
                        <span className="req-lock" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: '#A13D34', whiteSpace: 'nowrap' }}>
                          <Lock size={12} /> separate approval
                        </span>
                      </li>
                    ))}
                  </ul>

                  <p
                    className="evidence-foot"
                    style={{
                      margin: '22px 0 0',
                      paddingTop: 18,
                      borderTop: '1px solid rgba(28, 35, 51, 0.1)',
                      fontSize: '0.82rem',
                      color: '#4B5468',
                      lineHeight: 1.55,
                    }}
                  >
                    <strong>Nine categories in, nine separate pending requests out</strong> — each with
                    its own link, in the owner&apos;s inbox. The category-level gate already exists and
                    already defaults to closed, which is the right instinct. But reviewing it properly
                    costs nine clicks through nine pages. A single &quot;approve all&quot; click in that inbox
                    costs one. That gap is where &quot;approve all&quot; wins by default — not because the system
                    wants it to, but because the deliberate path is nine times more expensive than the
                    bulk one.
                  </p>
                </section>

                {/* The Deeper Problem callout */}
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-lg p-5"
                  style={{
                    backgroundColor: 'rgba(161, 61, 52, 0.06)',
                    border: '1px solid rgba(161, 61, 52, 0.15)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: '#A13D34' }} />
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 8px', color: '#ECE7DC' }}>
                        The Deeper Problem
                      </h3>
                      <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'rgba(236, 231, 220, 0.7)' }}>
                        The nine separate approvals create an <strong style={{ color: '#ECE7DC' }}>illusion of control</strong>.
                        Each checkbox feels like a small, manageable decision. But the system never shows you
                        what all nine together actually expose — or how combining these with permissions
                        you&apos;ve already granted to other apps creates a <strong style={{ color: '#ECE7DC' }}>much richer profile</strong> than
                        any single approval suggests.
                      </p>
                    </div>
                  </div>
                </motion.section>
              </div>
            )}

            {/* ───────────────────────────────────────────
                SECTION 3: Cumulative Impact Dashboard
                ─────────────────────────────────────────── */}
            {activeTab === 'impact' && (
              <div className="space-y-6">
                <div className="grid gap-6" style={{ gridTemplateColumns: '1fr', maxWidth: '100%' }}>
                  {/* Row 1: Exposure Gauge + Identity Reconstruction */}
                  <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

                    {/* 3a. Overall Exposure Score */}
                    <section className="rounded-lg p-6 dash-panel gauge-glow">
                      <p
                        style={{
                          fontFamily: 'var(--font-geist-mono), monospace',
                          fontSize: '0.7rem',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase' as const,
                          color: 'rgba(236, 231, 220, 0.7)',
                          margin: '0 0 20px',
                        }}
                      >
                        Overall Exposure Score
                      </p>
                      <ExposureGauge score={impactScore} />

                      {/* Category breakdown */}
                      <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(236, 231, 220, 0.08)' }}>
                        <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                          {ALL_CATEGORIES.map((cat) => {
                            const isGranted = allGranted.has(cat);
                            return (
                              <div
                                key={cat}
                                className="flex items-center gap-1.5 px-2 py-1 rounded"
                                style={{
                                  backgroundColor: isGranted ? 'rgba(236, 231, 220, 0.08)' : 'transparent',
                                  opacity: isGranted ? 1 : 0.55,
                                }}
                              >
                                <div
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{
                                    backgroundColor: isGranted ? '#3F6B57' : 'rgba(236, 231, 220, 0.15)',
                                  }}
                                />
                                <span
                                  className="text-[10px] capitalize"
                                  style={{ color: 'rgba(236, 231, 220, 0.85)', fontFamily: 'var(--font-geist-mono), monospace' }}
                                >
                                  {cat}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </section>

                    {/* 3b. Identity Reconstruction Panel */}
                    <section className="rounded-lg p-6 dash-panel">
                      <p
                        style={{
                          fontFamily: 'var(--font-geist-mono), monospace',
                          fontSize: '0.7rem',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase' as const,
                          color: 'rgba(236, 231, 220, 0.7)',
                          margin: '0 0 4px',
                        }}
                      >
                        Identity Reconstruction
                      </p>
                      <h3
                        style={{
                          fontFamily: 'var(--font-fraunces), Georgia, serif',
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: '#ECE7DC',
                          margin: '0 0 16px',
                        }}
                      >
                        What AI Can Reconstruct About You
                      </h3>
                      <div className="max-h-96 overflow-y-auto custom-scrollbar pr-1">
                        <IdentityReconstruction allGranted={allGranted} ledger={ledger} currentSelection={granted} />
                      </div>
                    </section>
                  </div>

                  {/* Row 2: Data Flow + Autonomy */}
                  <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

                    {/* 3c. Cross-App Data Flow Visualization */}
                    <section className="rounded-lg p-6 dash-panel">
                      <p
                        style={{
                          fontFamily: 'var(--font-geist-mono), monospace',
                          fontSize: '0.7rem',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase' as const,
                          color: 'rgba(236, 231, 220, 0.7)',
                          margin: '0 0 4px',
                        }}
                      >
                        Data Flow
                      </p>
                      <h3
                        style={{
                          fontFamily: 'var(--font-fraunces), Georgia, serif',
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: '#ECE7DC',
                          margin: '0 0 20px',
                        }}
                      >
                        How Your Data Travels
                      </h3>
                      <CrossAppDataFlow ledger={ledger} currentSelection={granted} />
                    </section>

                    {/* 3d. Autonomy Erosion Meter */}
                    <section className="rounded-lg p-6 dash-panel">
                      <p
                        style={{
                          fontFamily: 'var(--font-geist-mono), monospace',
                          fontSize: '0.7rem',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase' as const,
                          color: 'rgba(236, 231, 220, 0.7)',
                          margin: '0 0 4px',
                        }}
                      >
                        Autonomy Erosion
                      </p>
                      <h3
                        style={{
                          fontFamily: 'var(--font-fraunces), Georgia, serif',
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: '#ECE7DC',
                          margin: '0 0 20px',
                        }}
                      >
                        Decision-Making Power You&apos;ve Delegated
                      </h3>
                      <AutonomyMeter allGranted={allGranted} />
                    </section>
                  </div>

                  {/* 3e. Bias Reinforcement Paths */}
                  <section className="rounded-lg p-6 dash-panel">
                    <p
                      style={{
                        fontFamily: 'var(--font-geist-mono), monospace',
                        fontSize: '0.7rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase' as const,
                        color: 'rgba(236, 231, 220, 0.7)',
                        margin: '0 0 4px',
                      }}
                    >
                      Feedback Loops
                    </p>
                    <h3
                      style={{
                        fontFamily: 'var(--font-fraunces), Georgia, serif',
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#ECE7DC',
                        margin: '0 0 24px',
                      }}
                    >
                      How Shared Data Reinforces Bias
                    </h3>
                    <BiasPaths />
                  </section>
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────
                SECTION 4: The Fix
                ─────────────────────────────────────────── */}
            {activeTab === 'fix' && (
              <div className="space-y-6">
                {/* Passport card */}
                <section className="passport-card paper-card" style={{ position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1.15fr' }}>
                  {/* Tear line */}
                  <div className="passport-tear" style={{ position: 'absolute', top: 0, bottom: 0, left: '42%', width: 34, background: 'linear-gradient(to right, rgba(0,0,0,0.09), rgba(0,0,0,0) 18%, rgba(0,0,0,0) 82%, rgba(0,0,0,0.09))', pointerEvents: 'none' }} />

                  {/* Left panel */}
                  <div style={{ padding: '32px 30px', background: '#ECE7DC' }}>
                    <div
                      className="monogram"
                      style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: '#1C2333', color: '#ECE7DC',
                        fontWeight: 700, fontSize: '1.05rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 14,
                      }}
                    >
                      C
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontWeight: 600, fontSize: '1.3rem', margin: '0 0 8px' }}>Claude</h2>
                    <p style={{ fontSize: '0.86rem', color: '#4B5468', lineHeight: 1.5, margin: '0 0 6px' }}>
                      Wants to recall from your AI Passport.
                    </p>
                    <p style={{ fontSize: '0.76rem', color: '#B4802A', lineHeight: 1.5, margin: '0 0 26px' }}>
                      Purpose declared: &quot;recall&quot; — until the API carries a real per-request reason,
                      this screen is the only place that context can live, so each row states plainly
                      what the category covers.
                    </p>

                    {/* Mini impact score */}
                    <div
                      className="mb-4 p-3 rounded"
                      style={{ background: 'rgba(28, 35, 51, 0.04)', border: '1px solid rgba(28, 35, 51, 0.08)' }}
                    >
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-geist-mono), monospace', textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#4B5468' }}>
                          Selection impact
                        </span>
                        <span
                          className="font-bold"
                          style={{
                            fontSize: '1rem',
                            color: getScoreColor(calculateImpactScore(grantedFromLedger, ledger, granted)),
                            fontFamily: 'var(--font-geist-sans), sans-serif',
                          }}
                        >
                          {calculateImpactScore(grantedFromLedger, ledger, granted)}
                        </span>
                      </div>
                      <div
                        className="w-full h-1.5 rounded-full mt-2 overflow-hidden"
                        style={{ backgroundColor: 'rgba(28, 35, 51, 0.08)' }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: getScoreColor(calculateImpactScore(grantedFromLedger, ledger, granted)),
                          }}
                          animate={{
                            width: `${calculateImpactScore(grantedFromLedger, ledger, granted)}%`,
                          }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    {!confirmed ? (
                      <div className="cta-block" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
                        <button
                          onClick={handleApproveSelected}
                          disabled={granted.size === 0}
                          style={{
                            fontFamily: 'var(--font-geist-sans), sans-serif',
                            fontWeight: 600,
                            fontSize: '0.88rem',
                            background: '#1C2333',
                            color: '#ECE7DC',
                            border: 'none',
                            borderRadius: 6,
                            padding: '12px 18px',
                            cursor: granted.size === 0 ? 'default' : 'pointer',
                            opacity: granted.size === 0 ? 0.45 : 1,
                            transition: 'background 0.2s, transform 0.15s',
                          }}
                          onMouseOver={(e) => { if (granted.size > 0) (e.currentTarget as HTMLButtonElement).style.background = '#2a3350'; }}
                          onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1C2333'; }}
                          onMouseDown={(e) => { if (granted.size > 0) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)'; }}
                          onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
                        >
                          Approve selected ({granted.size})
                        </button>
                        <button
                          onClick={handleApproveAllWithFatigue}
                          className="btn-link"
                          style={{
                            fontFamily: 'var(--font-geist-sans), sans-serif',
                            fontSize: '0.8rem',
                            background: 'none',
                            border: 'none',
                            color: '#4B5468',
                            textDecoration: 'underline',
                            textUnderlineOffset: 3,
                            cursor: 'pointer',
                            padding: 0,
                          }}
                          onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#A13D34'; }}
                          onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#4B5468'; }}
                        >
                          or approve all {LIVE_EVIDENCE.length} instead
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
                        <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, fontSize: '0.88rem', color: '#3F6B57', margin: 0 }}>
                          <Check size={16} /> Logged — {confirmed.count} of {LIVE_EVIDENCE.length} categories granted to Claude.
                        </p>
                        <button
                          onClick={handleReset}
                          className="btn-link"
                          style={{
                            fontFamily: 'var(--font-geist-sans), sans-serif',
                            fontSize: '0.8rem',
                            background: 'none',
                            border: 'none',
                            color: '#4B5468',
                            textDecoration: 'underline',
                            textUnderlineOffset: 3,
                            cursor: 'pointer',
                            padding: 0,
                          }}
                          onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#A13D34'; }}
                          onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#4B5468'; }}
                        >
                          Simulate another request
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right panel */}
                  <div style={{ padding: '32px 30px', background: '#E3DDCE' }}>
                    <p
                      style={{
                        fontFamily: 'var(--font-geist-mono), monospace',
                        fontSize: '0.7rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase' as const,
                        color: '#4B5468',
                        margin: '0 0 16px',
                      }}
                    >
                      Requested categories
                    </p>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {LIVE_EVIDENCE.map((r) => {
                        const isGranted = granted.has(r.category);
                        // Find what identity aspects this enables
                        const combinedForCheck = new Set([...allGranted]);
                        if (!isGranted) combinedForCheck.add(r.category);
                        const enabledAspects = findEnabledAspectsForCategory(r.category, combinedForCheck);

                        return (
                          <li
                            key={r.category}
                            className="field-row"
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '36px 1fr auto',
                              alignItems: 'start',
                              gap: 12,
                              padding: '9px 0',
                              borderBottom: '1px solid rgba(28, 35, 51, 0.08)',
                            }}
                          >
                            <motion.button
                              className={`stamp-btn ${isGranted ? 'granted' : ''}`}
                              onClick={() => toggleCategory(r.category)}
                              aria-pressed={isGranted}
                              aria-label={`${isGranted ? 'Granted' : 'Not shared'}: ${r.category}`}
                              whileTap={{ scale: 0.9 }}
                            >
                              {isGranted ? <Check size={15} /> : null}
                            </motion.button>
                            <div style={{ minWidth: 0 }}>
                              <p
                                style={{
                                  fontSize: '0.87rem',
                                  fontWeight: 500,
                                  margin: '0 0 2px',
                                  textTransform: 'capitalize' as const,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                }}
                              >
                                {r.category}
                                <span className={`sens-dot ${r.sensitivity}`} />
                              </p>
                              <p style={{ fontSize: '0.74rem', color: '#4B5468', margin: '0 0 3px', lineHeight: 1.4 }}>
                                {r.note}
                              </p>
                              {/* Combined insight */}
                              {isGranted && enabledAspects.length > 0 && (
                                <motion.p
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="flex items-center gap-1"
                                  style={{ fontSize: '0.68rem', color: '#A13D34', lineHeight: 1.4 }}
                                >
                                  <ChevronRight size={9} />
                                  <span>
                                    Combined with other shared data, this reveals{' '}
                                    <strong>{enabledAspects.map((a) => a.label).join(', ')}</strong>
                                  </span>
                                </motion.p>
                              )}
                            </div>
                            <span
                              style={{
                                fontFamily: 'var(--font-geist-mono), monospace',
                                fontSize: '0.68rem',
                                color: '#4B5468',
                                whiteSpace: 'nowrap',
                                paddingTop: 2,
                              }}
                            >
                              {isGranted ? 'Granted' : 'Not shared'}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Mobile responsive handled in globals.css */}
                </section>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════
            SECTION 5: Write-Side Comparison (always visible)
            ═══════════════════════════════════════════════════ */}
        <motion.section
          className="write-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{ marginTop: 48 }}
        >
          <p
            className="eyebrow"
            style={{
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.72rem',
              letterSpacing: '0.13em',
              textTransform: 'uppercase' as const,
              color: 'rgba(236, 231, 220, 0.55)',
              margin: '0 0 14px',
            }}
          >
            The write side has the same gap
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-fraunces), Georgia, serif',
              fontWeight: 600,
              fontSize: '1.4rem',
              margin: '0 0 8px',
              color: '#ECE7DC',
            }}
          >
            remember() vs. propose_memory()
          </h2>
          <p
            style={{
              fontSize: '0.88rem',
              color: 'rgba(236, 231, 220, 0.75)',
              maxWidth: 560,
              lineHeight: 1.55,
              margin: '0 0 18px',
            }}
          >
            recall() is already gated per category. The tool that writes new memories isn&apos;t gated at all by default.
          </p>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div className="paper-card" style={{ padding: '22px 24px', borderTop: '3px solid #A13D34' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: '0.75rem',
                  letterSpacing: '0.04em',
                  margin: '0 0 10px',
                  color: '#1C2333',
                }}
              >
                REMEMBER() — TODAY&apos;S DEFAULT
              </h3>
              <p style={{ fontSize: '0.83rem', lineHeight: 1.55, color: '#4B5468', margin: 0 }}>
                Any connected app calls this directly and it writes immediately — the tool&apos;s own description calls
                saving &quot;expected and safe.&quot; Visibility defaults to <em>shared</em>, so every other connected app can
                read it back right away. Only items an app explicitly flags <em>sensitivity: protected</em> get a
                review gate — and that gate covers other apps reading it back later, not the write itself.
              </p>
            </div>
            <div className="paper-card" style={{ padding: '22px 24px', borderTop: '3px solid #3F6B57' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: '0.75rem',
                  letterSpacing: '0.04em',
                  margin: '0 0 10px',
                  color: '#1C2333',
                }}
              >
                PROPOSE_MEMORY() — ALREADY BUILT, NOT DEFAULT
              </h3>
              <p style={{ fontSize: '0.83rem', lineHeight: 1.55, color: '#4B5468', margin: 0 }}>
                Queues the fact in the owner&apos;s private inbox; it isn&apos;t cross-app readable until the owner approves it.
                Nothing requires an app to use this over remember() — it&apos;s available, not the default path. Making it
                the default for every category except preference and fact, and flipping visibility to app_private
                unless the user grants sharing, closes the write-side gap with tooling Egoist has already shipped.
              </p>
            </div>
          </div>

          {/* Enhanced note about compound effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-4 rounded-lg p-4"
            style={{
              backgroundColor: 'rgba(236, 231, 220, 0.04)',
              border: '1px solid rgba(236, 231, 220, 0.08)',
            }}
          >
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(236, 231, 220, 0.55)' }}>
              <strong style={{ color: 'rgba(236, 231, 220, 0.75)' }}>Compound effect:</strong>{' '}
              When remember() writes are combined with recall() reads across apps, the system doesn&apos;t just
              know you — it can <strong style={{ color: '#A13D34' }}>shape what you become</strong>. Every memory written
              by one app becomes the training data that shapes another app&apos;s suggestions about you, creating
              a feedback loop between what the system stores and what it presents as &quot;your preferences.&quot;
            </p>
          </motion.div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════
            SECTION 6: Enhanced Consent Ledger (always visible)
            ═══════════════════════════════════════════════════ */}
        <motion.section
          className="ledger-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          style={{ marginTop: 48 }}
        >
          <p
            className="eyebrow"
            style={{
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.72rem',
              letterSpacing: '0.13em',
              textTransform: 'uppercase' as const,
              color: 'rgba(236, 231, 220, 0.55)',
              margin: '0 0 14px',
            }}
          >
            Consent Ledger
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-fraunces), Georgia, serif',
              fontWeight: 600,
              fontSize: '1.4rem',
              margin: '0 0 8px',
              color: '#ECE7DC',
            }}
          >
            What&apos;s been granted
          </h2>
          <p
            className="subtitle"
            style={{
              fontSize: '0.88rem',
              color: 'rgba(236, 231, 220, 0.75)',
              maxWidth: 560,
              lineHeight: 1.55,
              margin: '0 0 18px',
            }}
          >
            Every grant, timestamped and revocable — the receipt today&apos;s fragmented flow doesn&apos;t produce.
          </p>

          {/* Running total */}
          <div
            className="flex items-center justify-between mb-4 p-3 rounded-lg"
            style={{ backgroundColor: 'rgba(236, 231, 220, 0.04)', border: '1px solid rgba(236, 231, 220, 0.08)' }}
          >
            <span
              style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-geist-mono), monospace',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                color: 'rgba(236, 231, 220, 0.4)',
              }}
            >
              Combined exposure across all active grants
            </span>
            <span
              className="font-bold"
              style={{
                fontSize: '1rem',
                color: getScoreColor(impactScore),
              }}
            >
              {impactScore}/100
            </span>
          </div>

          {/* Ledger entries */}
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {ledger.map((entry) => {
              // Calculate entry's contribution
              const entryGranted = new Set(entry.categories);
              const enabledAspects = IDENTITY_ASPECTS.filter((a) => {
                if (a.required === 'all') return false;
                return a.required.every((c) => entryGranted.has(c));
              });

              // Entry impact score
              const entryScore = Math.round((entry.categories.length / 9) * 60);

              return (
                <motion.li
                  key={entry.id}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`ledger-row paper-card ${entry.revoked ? 'revoked' : ''}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '16px 1fr auto auto auto',
                    alignItems: 'center',
                    gap: 16,
                    padding: '13px 20px',
                    borderRadius: 4,
                    opacity: entry.revoked ? 0.5 : 1,
                  }}
                >
                  <span
                    className="ledger-dot"
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: entry.revoked ? '#4B5468' : '#A13D34',
                    }}
                  />
                  <div>
                    <span
                      className="ledger-requester"
                      style={{
                        fontWeight: 500,
                        fontSize: '0.87rem',
                        textDecoration: entry.revoked ? 'line-through' : 'none',
                      }}
                    >
                      {entry.requester}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span
                        style={{
                          fontFamily: 'var(--font-geist-mono), monospace',
                          fontSize: '0.76rem',
                          color: '#4B5468',
                        }}
                      >
                        {entry.date}
                      </span>
                      <span style={{ color: 'rgba(28, 35, 51, 0.2)' }}>·</span>
                      <span
                        className="text-capitalize"
                        style={{
                          fontSize: '0.78rem',
                          color: '#4B5468',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {entry.categories.join(', ')} · {entry.categories.length} of {entry.total}
                      </span>
                    </div>
                    {/* Revoked: show what it was contributing to */}
                    {entry.revoked && enabledAspects.length > 0 && (
                      <p style={{ fontSize: '0.68rem', color: '#4B5468', marginTop: 4, fontStyle: 'italic' }}>
                        was contributing to: {enabledAspects.map((a) => a.label).join(', ')}
                      </p>
                    )}
                  </div>
                  {/* Impact badge */}
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                    style={{
                      backgroundColor: `${getScoreColor(entryScore)}15`,
                      color: getScoreColor(entryScore),
                      fontFamily: 'var(--font-geist-mono), monospace',
                    }}
                  >
                    {entryScore}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-geist-mono), monospace',
                      fontSize: '0.76rem',
                      color: '#4B5468',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {entry.categories.length} cats
                  </span>
                  <button
                    onClick={() => toggleRevoke(entry.id)}
                    className="ledger-revoke"
                    style={{
                      fontSize: '0.76rem',
                      background: 'none',
                      border: 'none',
                      color: '#A13D34',
                      textDecoration: 'underline',
                      textUnderlineOffset: 3,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0,
                      whiteSpace: 'nowrap',
                    }}
                    aria-label={entry.revoked ? `Restore access for ${entry.requester}` : `Revoke access for ${entry.requester}`}
                  >
                    {entry.revoked ? (
                      <>
                        <Undo2 size={12} /> Restore
                      </>
                    ) : (
                      'Revoke'
                    )}
                  </button>
                </motion.li>
              );
            })}
          </ul>
        </motion.section>
      </div>

      {/* ═══════════════════════════════════════════════════
          SECTION 7: Footer
          ═══════════════════════════════════════════════════ */}
      <footer
        className="mt-auto footer-border"
        style={{
          padding: '40px 20px',
          marginTop: 48,
        }}
      >
        <div className="inner" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div className="passport-stamp">
            <Lock size={14} />
          </div>
          <div>
            <blockquote
              className="text-sm italic leading-relaxed"
              style={{ color: 'rgba(236, 231, 220, 0.55)', maxWidth: 600 }}
            >
              &ldquo;The fix does not lie in mere flagging and correction of the basic features in the passport,
              but a universal change in design.&rdquo;
            </blockquote>
            <p
              className="mt-3"
              style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-geist-mono), monospace',
                letterSpacing: '0.06em',
                color: 'rgba(236, 231, 220, 0.5)',
              }}
            >
              A design exploration by Egoist Machines
            </p>
          </div>
        </div>
      </footer>

      {/* ── Consent Fatigue Dialog ── */}
      <ConsentFatigueDialog
        open={showFatigueDialog}
        onClose={() => setShowFatigueDialog(false)}
        onConfirm={handleFatigueConfirm}
        onReview={handleFatigueReview}
        allGrantedFromLedger={grantedFromLedger}
        ledger={ledger}
      />
    </div>
  );
}
