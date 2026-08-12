# AI Passport Consent Audit

> **What You Permit vs. What You Expose**
>
> An consent audit that reveals not just what permissions exist, but what your *combined* permissions actually expose about you across AI systems.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

---

## The Problem

Granular consent controls create a false sense of security. Users see nine isolated permission categories and approve them one by one, unaware that the *combination* of permissions across multiple AI apps reconstructs a detailed profile — social graph, consumer behavior, decision patterns, even a behavioral twin.

The original AI Passport Consent Audit showed what permissions exist. This enhanced version shows **what those permissions reveal when combined**.

---

## Features

### Exposure Scoring
A real-time cumulative impact score (0–100) calculated from:
- **Base coverage** — how many categories are shared
- **Cross-app overlap** — how many apps share the same categories
- **Sensitivity combinations** — bonus exposure when high-sensitivity categories combine (e.g., `biometric + location + relationship`)

### Identity Reconstruction
Visualizes 6 aspects that AI can reconstruct from permission combinations:
| Aspect | Requires | Sensitivity |
|---|---|---|
| Social Graph | event + relationship + social | High |
| Consumer Profile | purchase + preference + fact | Medium |
| Professional Identity | project + preference + fact | Medium |
| Decision Patterns | preference + fact + instruction | Critical |
| Life Pattern Model | All 9 categories | Critical |
| Behavioral Twin | All 9 categories | Critical |

### Cross-App Data Flow
Interactive SVG diagram showing how data flows between ChatGPT, Claude, Perplexity, and a central AI Training node — with hover tooltips revealing which specific categories each app contributes.

### Autonomy Erosion Meter
Animated progress bar showing how much decision-making power has been delegated, based on `instruction`, `preference`, and `claim` category sharing.

### Bias Reinforcement Paths
4 visual feedback-loop chains showing how shared data reinforces filter bubbles, echo chambers, creative convergence, and identity lock-in.

### Consent Fatigue Intervention
When a user clicks "Approve All", a thoughtful dialog pauses the action and shows:
- Preview of the resulting exposure score
- Top 3 most sensitive identity aspects that would become reconstructible

### Enhanced Consent Ledger
Timestamped, revocable consent records with per-entry impact scores showing each app's contribution.

---

## Architecture

```
src/
├── app/
│   ├── page.tsx                          # Main page — 3 tabs, 7 sections
│   ├── layout.tsx                        # Root layout, fonts, metadata
│   ├── globals.css                       # Paper-on-dark theme, animations
│   └── api/route.ts                      # API placeholder
│
├── components/
│   ├── consent-audit/                    # Feature components
│   │   ├── data.ts                       # Types, scoring algorithm, seed data
│   │   ├── ExposureGauge.tsx             # SVG arc gauge with animated counter
│   │   ├── IdentityReconstruction.tsx    # 6 identity aspects with sensitivity badges
│   │   ├── CrossAppDataFlow.tsx          # SVG node-link data flow diagram
│   │   ├── AutonomyMeter.tsx             # Animated erosion progress bar
│   │   ├── BiasPaths.tsx                 # 4 bias feedback loop visualizations
│   │   ├── ConsentFatigueDialog.tsx      # Approve-all intervention modal
│   │   └── PersonaScenarios.tsx          # Persona-based scenario comparisons
│   │
│   └── ui/                              # shadcn/ui component library (47 components)
│
├── hooks/                               # React hooks (use-toast, use-mobile)
└── lib/                                 # Utilities (cn, db client)
```

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16** | React framework with App Router |
| **TypeScript 5** | Type safety |
| **Tailwind CSS 4** | Utility-first styling |
| **shadcn/ui** | Accessible UI component library |
| **Framer Motion** | Page transitions, animations |
| **Lucide React** | Icon library |
| **Fraunces** | Serif display font (headings) |
| **Geist** | Sans-serif and mono fonts (body/code) |

---

## Design System

The app uses a **paper-on-dark** aesthetic:
- **Background**: `#1C2333` (deep navy)
- **Card/Paper**: `#ECE7DC` (warm parchment)
- **Seal Red**: `#A13D34` (stamps, accents, destructive actions)
- **Authority Green**: `#3F6B57` (granted states, confirmations)
- **Amber**: `#B4802A` (medium sensitivity, warnings)

Typography hierarchy uses Fraunces (serif) for headings and Geist (sans-serif) for body text, with Geist Mono for labels and code.

---

## Getting Started

### Prerequisites
- Node.js 18+ or Bun 1.0+
- npm or bun package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/JyotiS34/AI-Passport-Consent-Audit.git
cd AI-Passport-Consent-Audit

# Install dependencies
npm install
# or: bun install

# Start development server
npm run dev
# or: bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## Deployment

### Vercel (Recommended)

The project deploys directly to Vercel with zero configuration:

1. Push to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Vercel auto-detects Next.js and deploys

> **Note:** Make sure the **Output Directory** in Vercel project settings is left empty (auto-detected). A `vercel.json` is included to ensure correct output directory mapping.

### Other Platforms

The standard `npm run build` produces a `.next` output directory compatible with any Node.js hosting platform.

---

## Usage

### Three Tabs

1. **The Problem** — Shows Claude's `recall()` request with 9 permission categories, sensitivity levels, and the friction gap between reviewing each category vs. "approve all."

2. **Cumulative Impact** — The main dashboard:
   - Toggle categories on/off to see real-time score changes
   - Watch identity aspects unlock as combinations are met
   - See data flow between apps update dynamically
   - Monitor autonomy erosion and bias reinforcement

3. **The Fix** — Interactive passport-style card where you stamp individual categories. Combined insights appear showing what each additional permission reveals. Includes consent fatigue intervention on "approve all."

### Below the Fold
- **Write-Side Comparison** — `remember()` vs `propose_memory()` showing the write-side consent gap
- **Consent Ledger** — All grants timestamped and revocable with impact scores

---

## Scoring Algorithm

```
Impact Score = min(100, baseScore + overlapBonus + sensitivityBonus)

where:
  baseScore       = (grantedCategories / 9) × 50
  overlapBonus    = crossAppCategories × 5
  sensitivityBonus = sum of combo bonuses for high-sensitivity pairs
```

Sensitivity combinations that trigger bonus exposure:
- `biometric + location` → +8
- `location + relationship` → +6
- `preference + fact + instruction` → +10
- `event + relationship + social` → +7
- All 9 categories → +15

---

## Project Status

- **Core Features**: Complete
- **Visual Design**: Production-ready with paper-on-dark theme
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation, focus indicators
- **Responsive**: Mobile-first design, works on all screen sizes
- **Animations**: Framer Motion with `prefers-reduced-motion` support
- **Lint**: Zero errors

---

## License

MIT

---

## Credits

Concept and design by **Egoist Machines**.

Built with Next.js, Tailwind CSS, shadcn/ui, and Framer Motion.
