import { useState } from "react";
import { Lock, Check, Undo2 } from "lucide-react";

// Real result of calling AI Passport:recall with all 9 governed categories
// from inside this chat, reproduced live via the connected MCP server on
// Aug 9, 2026. None were pre-approved for this app, so the server returned
// nine separate pending-approval requests instead of data — same shape as
// the first run, different request IDs, confirming it isn't a one-off.
const LIVE_EVIDENCE = [
  { category: "event", id: "3cb0f3ae", sensitivity: "medium", note: "things that happened, with a date" },
  { category: "purchase", id: "97c670c4", sensitivity: "high", note: "buying history or intent" },
  { category: "preference", id: "c80ed46c", sensitivity: "low", note: "formatting, tone, standing preferences" },
  { category: "project", id: "cbef7387", sensitivity: "medium", note: "ongoing work or personal projects" },
  { category: "claim", id: "107d9287", sensitivity: "medium", note: "an assertion made about the user" },
  { category: "relationship", id: "15187b65", sensitivity: "high", note: "people connected to the user" },
  { category: "fact", id: "cf5089a3", sensitivity: "low", note: "general facts stated about the user" },
  { category: "other", id: "af00ebf7", sensitivity: "medium", note: "anything uncategorized" },
  { category: "instruction", id: "86fed467", sensitivity: "medium", note: "standing instructions for how apps should behave" },
];

const LEDGER_SEED = [
  { id: 1, requester: "ChatGPT", date: "Aug 3", categories: ["preference", "fact"], total: 9, revoked: false },
  { id: 2, requester: "Perplexity", date: "Jul 30", categories: ["project"], total: 9, revoked: false },
];

function formatDate(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AiPassportConsentAudit() {
  const [view, setView] = useState("today"); // today | proposed
  const [granted, setGranted] = useState(() => new Set());
  const [ledger, setLedger] = useState(LEDGER_SEED);
  const [confirmed, setConfirmed] = useState(null);

  function toggleCategory(cat) {
    setGranted((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  function confirmShare(categories) {
    const entry = {
      id: Date.now(),
      requester: "Claude",
      date: formatDate(new Date()),
      categories,
      total: LIVE_EVIDENCE.length,
      revoked: false,
    };
    setLedger((prev) => [entry, ...prev]);
    setConfirmed({ count: categories.length });
  }

  function handleApproveSelected() {
    confirmShare(Array.from(granted));
  }

  function handleApproveAll() {
    const all = LIVE_EVIDENCE.map((e) => e.category);
    setGranted(new Set(all));
    confirmShare(all);
  }

  function handleReset() {
    setGranted(new Set());
    setConfirmed(null);
  }

  function toggleRevoke(id) {
    setLedger((prev) => prev.map((e) => (e.id === id ? { ...e, revoked: !e.revoked } : e)));
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

        .apa * { box-sizing: border-box; }
        .apa {
          --paper: #ECE7DC;
          --paper-dim: #E3DDCE;
          --ink: #1C2333;
          --ink-soft: #4B5468;
          --seal: #A13D34;
          --granted: #3F6B57;
          --amber: #B4802A;
          min-height: 100vh;
          background: var(--ink);
          color: var(--paper);
          font-family: 'IBM Plex Sans', sans-serif;
          padding: 48px 20px 80px;
        }
        .apa .inner { max-width: 900px; margin: 0 auto; }

        .apa .eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.72rem;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: rgba(236,231,220,0.55);
          margin: 0 0 14px;
        }
        .apa .title {
          font-family: 'Fraunces', serif;
          font-weight: 700;
          font-size: clamp(1.9rem, 4.6vw, 2.9rem);
          line-height: 1.1;
          margin: 0 0 14px;
          color: var(--paper);
        }
        .apa .subtitle {
          font-size: 0.98rem;
          color: rgba(236,231,220,0.75);
          max-width: 560px;
          line-height: 1.55;
          margin: 0 0 28px;
        }
        .apa .subtitle.small { font-size: 0.88rem; margin-bottom: 20px; }

        .apa .mode-toggle {
          display: inline-flex;
          background: rgba(255,255,255,0.08);
          border-radius: 999px;
          padding: 4px;
          gap: 2px;
          margin-bottom: 36px;
        }
        .apa .mode-toggle button {
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          padding: 8px 18px;
          border: none;
          border-radius: 999px;
          background: transparent;
          color: rgba(236,231,220,0.65);
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .apa .mode-toggle button.active { background: var(--paper); color: var(--ink); }

        .apa .fade-in { animation: cardIn 0.5s ease-out; }
        @keyframes cardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

        /* ---- Today (live evidence) ---- */
        .apa .evidence-card {
          background: var(--paper);
          color: var(--ink);
          border-radius: 6px;
          padding: 30px 32px;
          box-shadow: 0 24px 60px -20px rgba(0,0,0,0.5);
        }
        .apa .evidence-head {
          display: flex; align-items: baseline; justify-content: space-between; gap: 12px;
          margin-bottom: 6px; flex-wrap: wrap;
        }
        .apa .evidence-title { font-family: 'Fraunces', serif; font-weight: 600; font-size: 1.2rem; margin: 0; }
        .apa .evidence-caller {
          font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; color: var(--ink-soft);
        }
        .apa .evidence-purpose {
          font-size: 0.82rem; color: var(--ink-soft); margin: 4px 0 22px; line-height: 1.5;
        }
        .apa .evidence-purpose code {
          background: rgba(28,35,51,0.08); padding: 1px 6px; border-radius: 3px;
          font-family: 'IBM Plex Mono', monospace; font-size: 0.78rem;
        }
        .apa .req-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1px; }
        .apa .req-row {
          display: grid;
          grid-template-columns: 24px 1fr auto auto;
          align-items: center;
          gap: 14px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(28,35,51,0.08);
        }
        .apa .req-row:last-child { border-bottom: none; }
        .apa .req-dot { width: 8px; height: 8px; border-radius: 50%; }
        .apa .req-dot.low { background: var(--ink-soft); }
        .apa .req-dot.medium { background: var(--amber); }
        .apa .req-dot.high { background: var(--seal); }
        .apa .req-name { font-size: 0.88rem; font-weight: 500; text-transform: capitalize; }
        .apa .req-note { font-size: 0.76rem; color: var(--ink-soft); }
        .apa .req-id { font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; color: var(--ink-soft); }
        .apa .req-lock {
          display: flex; align-items: center; gap: 5px;
          font-size: 0.72rem; color: var(--seal); white-space: nowrap;
        }
        .apa .evidence-foot {
          margin: 22px 0 0; padding-top: 18px; border-top: 1px solid rgba(28,35,51,0.1);
          font-size: 0.82rem; color: var(--ink-soft); line-height: 1.55;
        }
        .apa .evidence-foot strong { color: var(--ink); }

        /* ---- Proposed (batched consent) ---- */
        .apa .passport-card {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          background: var(--paper);
          border-radius: 6px;
          box-shadow: 0 24px 60px -20px rgba(0,0,0,0.5);
          position: relative;
          overflow: hidden;
          color: var(--ink);
        }
        .apa .passport-card::before {
          content: '';
          position: absolute;
          top: 0; bottom: 0; left: 42%;
          width: 34px;
          background: linear-gradient(to right, rgba(0,0,0,0.09), rgba(0,0,0,0) 18%, rgba(0,0,0,0) 82%, rgba(0,0,0,0.09));
          pointer-events: none;
        }
        @media (max-width: 720px) {
          .apa .passport-card { grid-template-columns: 1fr; }
          .apa .passport-card::before { display: none; }
        }
        .apa .panel { padding: 32px 30px; }
        .apa .panel.left { background: var(--paper); }
        .apa .panel.right { background: var(--paper-dim); }

        .apa .monogram {
          width: 40px; height: 40px; border-radius: 50%;
          background: var(--ink); color: var(--paper);
          font-family: 'Fraunces', serif; font-weight: 700; font-size: 1.05rem;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
        }
        .apa .requester-name { font-family: 'Fraunces', serif; font-weight: 600; font-size: 1.3rem; margin: 0 0 8px; }
        .apa .requester-purpose { font-size: 0.86rem; color: var(--ink-soft); line-height: 1.5; margin: 0 0 6px; }
        .apa .purpose-caveat {
          font-size: 0.76rem; color: var(--amber); line-height: 1.5; margin: 0 0 26px;
        }

        .apa .cta-block { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }
        .apa .btn-primary {
          font-family: 'IBM Plex Sans', sans-serif; font-weight: 600; font-size: 0.88rem;
          background: var(--ink); color: var(--paper); border: none; border-radius: 6px;
          padding: 12px 18px; cursor: pointer; transition: background 0.2s, transform 0.15s;
        }
        .apa .btn-primary:hover { background: #2a3350; }
        .apa .btn-primary:active { transform: scale(0.98); }
        .apa .btn-primary:disabled { opacity: 0.45; cursor: default; }
        .apa .btn-link {
          font-family: 'IBM Plex Sans', sans-serif; font-size: 0.8rem;
          background: none; border: none; color: var(--ink-soft);
          text-decoration: underline; text-underline-offset: 3px; cursor: pointer; padding: 0;
        }
        .apa .btn-link:hover { color: var(--seal); }

        .apa .confirmed-block { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }
        .apa .confirmed-msg { display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.88rem; color: var(--granted); margin: 0; }

        .apa .fields-heading {
          font-family: 'IBM Plex Mono', monospace; font-size: 0.7rem; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--ink-soft); margin: 0 0 16px;
        }
        .apa .field-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 3px; }
        .apa .field-row { display: grid; grid-template-columns: 36px 1fr auto; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px solid rgba(28,35,51,0.08); }
        .apa .field-row:last-child { border-bottom: none; }

        .apa .stamp-btn {
          width: 30px; height: 30px; border-radius: 50%;
          border: 2px dashed rgba(28,35,51,0.3); background: transparent;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          color: var(--ink-soft); transform: rotate(0deg);
          transition: transform 0.35s cubic-bezier(.34,1.56,.64,1), background 0.2s, border-color 0.2s, color 0.2s;
        }
        .apa .stamp-btn:hover { border-color: var(--ink); }
        .apa .stamp-btn.granted { background: var(--seal); border: 2px solid var(--seal); color: #fff; transform: rotate(-6deg); }

        .apa .field-text { min-width: 0; }
        .apa .field-name { font-size: 0.87rem; font-weight: 500; margin: 0 0 2px; text-transform: capitalize; display: flex; align-items: center; gap: 8px; }
        .apa .field-note { font-size: 0.74rem; color: var(--ink-soft); margin: 0; line-height: 1.4; }
        .apa .field-status { font-family: 'IBM Plex Mono', monospace; font-size: 0.68rem; color: var(--ink-soft); white-space: nowrap; }
        .apa .dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
        .apa .dot.low { background: var(--ink-soft); }
        .apa .dot.medium { background: var(--amber); }
        .apa .dot.high { background: var(--seal); }

        /* ---- write-side comparison ---- */
        .apa .write-section { margin-top: 48px; }
        .apa .write-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 18px; }
        @media (max-width: 680px) { .apa .write-grid { grid-template-columns: 1fr; } }
        .apa .write-card { background: var(--paper); color: var(--ink); border-radius: 6px; padding: 22px 24px; }
        .apa .write-card h3 {
          font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; letter-spacing: 0.04em;
          margin: 0 0 10px; color: var(--ink);
        }
        .apa .write-card p { font-size: 0.83rem; line-height: 1.55; color: var(--ink-soft); margin: 0; }
        .apa .write-card.today { border-top: 3px solid var(--seal); }
        .apa .write-card.proposed { border-top: 3px solid var(--granted); }
        .apa .write-arrow { display: flex; align-items: center; justify-content: center; color: rgba(236,231,220,0.4); }

        /* ---- ledger ---- */
        .apa .ledger-section { margin-top: 48px; }
        .apa .ledger-title { font-family: 'Fraunces', serif; font-weight: 600; font-size: 1.4rem; margin: 0 0 8px; color: var(--paper); }
        .apa .ledger-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
        .apa .ledger-row {
          display: grid; grid-template-columns: 16px 1fr auto auto auto; align-items: center; gap: 16px;
          background: var(--paper); color: var(--ink); padding: 13px 20px; border-radius: 4px;
        }
        .apa .ledger-row.revoked { opacity: 0.5; }
        .apa .ledger-row.revoked .ledger-requester { text-decoration: line-through; }
        .apa .ledger-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--seal); }
        .apa .ledger-row.revoked .ledger-dot { background: var(--ink-soft); }
        .apa .ledger-requester { font-weight: 500; font-size: 0.87rem; }
        .apa .ledger-date { font-family: 'IBM Plex Mono', monospace; font-size: 0.76rem; color: var(--ink-soft); }
        .apa .ledger-count { font-size: 0.78rem; color: var(--ink-soft); white-space: nowrap; text-transform: capitalize; }
        .apa .ledger-revoke {
          font-size: 0.76rem; background: none; border: none; color: var(--seal);
          text-decoration: underline; text-underline-offset: 3px; cursor: pointer;
          display: flex; align-items: center; gap: 4px; padding: 0; white-space: nowrap;
        }
        @media (max-width: 640px) {
          .apa .ledger-row { grid-template-columns: 1fr auto; row-gap: 6px; }
        }

        .apa button:focus-visible { outline: 2px solid var(--seal); outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { .apa * { animation: none !important; transition: none !important; } }
      `}</style>

      <div className="apa">
        <div className="inner">
          <header>
            <p className="eyebrow">Live check · Egoist AI Passport MCP</p>
            <h1 className="title">One ask. Nine<br />separate approvals.</h1>
            <p className="subtitle">
              This is what actually happened when this chat called <code style={{fontFamily:"'IBM Plex Mono',monospace"}}>recall</code> against
              the real AI Passport server, requesting all nine governed categories at once — verified live, not simulated, and
              reproduced on a second independent run with the same shape and fresh request IDs.
            </p>
            <div className="mode-toggle" role="tablist">
              <button className={view === "today" ? "active" : ""} onClick={() => setView("today")} role="tab" aria-selected={view === "today"}>
                Today (live result)
              </button>
              <button className={view === "proposed" ? "active" : ""} onClick={() => setView("proposed")} role="tab" aria-selected={view === "proposed"}>
                Proposed fix
              </button>
            </div>
          </header>

          {view === "today" ? (
            <section className="evidence-card fade-in">
              <div className="evidence-head">
                <h2 className="evidence-title">recall() from Claude</h2>
                <span className="evidence-caller">9 categories requested</span>
              </div>
              <p className="evidence-purpose">
                Purpose sent with the request: <code>"recall"</code> — the only value the API's <code>purpose</code> field
                currently accepts, so no real reason travels with the ask.
              </p>
              <ul className="req-list">
                {LIVE_EVIDENCE.map((r) => (
                  <li key={r.id} className="req-row">
                    <span className={`req-dot ${r.sensitivity}`}></span>
                    <div>
                      <div className="req-name">{r.category}</div>
                      <div className="req-note">{r.note}</div>
                    </div>
                    <span className="req-id">req {r.id}</span>
                    <span className="req-lock"><Lock size={12} /> separate approval</span>
                  </li>
                ))}
              </ul>
              <p className="evidence-foot">
                <strong>Nine categories in, nine separate pending requests out</strong> — each with its own link, in the owner's
                inbox. The category-level gate already exists and already defaults to closed, which is the right instinct.
                But reviewing it properly costs nine clicks through nine pages. A single "approve all" click in that inbox
                costs one. That gap is where "approve all" wins by default — not because the system wants it to, but because
                the deliberate path is nine times more expensive than the bulk one.
              </p>
            </section>
          ) : (
            <section className="passport-card fade-in">
              <div className="panel left">
                <div className="monogram">C</div>
                <h2 className="requester-name">Claude</h2>
                <p className="requester-purpose">Wants to recall from your AI Passport.</p>
                <p className="purpose-caveat">
                  Purpose declared: "recall" — until the API carries a real per-request reason, this screen is the only
                  place that context can live, so each row states plainly what the category covers.
                </p>

                {!confirmed ? (
                  <div className="cta-block">
                    <button className="btn-primary" onClick={handleApproveSelected} disabled={granted.size === 0}>
                      Approve selected ({granted.size})
                    </button>
                    <button className="btn-link" onClick={handleApproveAll}>
                      or approve all {LIVE_EVIDENCE.length} instead
                    </button>
                  </div>
                ) : (
                  <div className="confirmed-block">
                    <p className="confirmed-msg">
                      <Check size={16} /> Logged — {confirmed.count} of {LIVE_EVIDENCE.length} categories granted to Claude.
                    </p>
                    <button className="btn-link" onClick={handleReset}>Simulate another request</button>
                  </div>
                )}
              </div>

              <div className="panel right">
                <p className="fields-heading">Requested categories</p>
                <ul className="field-list">
                  {LIVE_EVIDENCE.map((r) => {
                    const isGranted = granted.has(r.category);
                    return (
                      <li key={r.category} className="field-row">
                        <button
                          className={`stamp-btn ${isGranted ? "granted" : ""}`}
                          onClick={() => toggleCategory(r.category)}
                          aria-pressed={isGranted}
                          aria-label={`${isGranted ? "Granted" : "Not shared"}: ${r.category}`}
                        >
                          {isGranted ? <Check size={15} /> : null}
                        </button>
                        <div className="field-text">
                          <p className="field-name">
                            {r.category}
                            <span className={`dot ${r.sensitivity}`}></span>
                          </p>
                          <p className="field-note">{r.note}</p>
                        </div>
                        <span className="field-status">{isGranted ? "Granted" : "Not shared"}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          )}

          <section className="write-section">
            <p className="eyebrow">The write side has the same gap</p>
            <h2 className="ledger-title">remember() vs. propose_memory()</h2>
            <p className="subtitle small">
              recall() is already gated per category. The tool that writes new memories isn't gated at all by default.
            </p>
            <div className="write-grid">
              <div className="write-card today">
                <h3>REMEMBER() — TODAY'S DEFAULT</h3>
                <p>
                  Any connected app calls this directly and it writes immediately — the tool's own description calls
                  saving "expected and safe." Visibility defaults to <em>shared</em>, so every other connected app can
                  read it back right away. Only items an app explicitly flags <em>sensitivity: protected</em> get a
                  review gate — and that gate covers other apps reading it back later, not the write itself.
                </p>
              </div>
              <div className="write-card proposed">
                <h3>PROPOSE_MEMORY() — ALREADY BUILT, NOT DEFAULT</h3>
                <p>
                  Queues the fact in the owner's private inbox; it isn't cross-app readable until the owner approves it.
                  Nothing requires an app to use this over remember() — it's available, not the default path. Making it
                  the default for every category except preference and fact, and flipping visibility to app_private
                  unless the user grants sharing, closes the write-side gap with tooling Egoist has already shipped.
                </p>
              </div>
            </div>
          </section>

          <section className="ledger-section">
            <p className="eyebrow">Consent Ledger</p>
            <h2 className="ledger-title">What's been granted</h2>
            <p className="subtitle small">Every grant, timestamped and revocable — the receipt today's fragmented flow doesn't produce.</p>
            <ul className="ledger-list">
              {ledger.map((entry) => (
                <li key={entry.id} className={`ledger-row ${entry.revoked ? "revoked" : ""}`}>
                  <span className="ledger-dot"></span>
                  <span className="ledger-requester">{entry.requester}</span>
                  <span className="ledger-date">{entry.date}</span>
                  <span className="ledger-count">{entry.categories.join(", ")} · {entry.categories.length} of {entry.total}</span>
                  <button className="ledger-revoke" onClick={() => toggleRevoke(entry.id)}>
                    {entry.revoked ? <><Undo2 size={12} /> Restore</> : "Revoke"}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
