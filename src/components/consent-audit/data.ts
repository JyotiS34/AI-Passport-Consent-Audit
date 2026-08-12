// ──────────────────────────────────────────────
// AI Passport Consent Audit — Data & Constants
// ──────────────────────────────────────────────

export type Sensitivity = 'low' | 'medium' | 'high' | 'critical';

export interface PermissionCategory {
  category: string;
  id: string;
  sensitivity: Sensitivity;
  note: string;
}

export interface LedgerEntry {
  id: number;
  requester: string;
  date: string;
  categories: string[];
  total: number;
  revoked: boolean;
}

export interface IdentityAspect {
  required: string[] | 'all';
  label: string;
  description: string;
  sensitivity: Sensitivity;
}

export interface BiasLoop {
  id: string;
  categories: string[];
  steps: string[];
}

export type ActiveTab = 'problem' | 'impact' | 'fix';

// The 9 permission categories from the live evidence
export const LIVE_EVIDENCE: PermissionCategory[] = [
  { category: 'event', id: '3cb0f3ae', sensitivity: 'medium', note: 'things that happened, with a date' },
  { category: 'purchase', id: '97c670c4', sensitivity: 'high', note: 'buying history or intent' },
  { category: 'preference', id: 'c80ed46c', sensitivity: 'low', note: 'formatting, tone, standing preferences' },
  { category: 'project', id: 'cbef7387', sensitivity: 'medium', note: 'ongoing work or personal projects' },
  { category: 'claim', id: '107d9287', sensitivity: 'medium', note: 'an assertion made about the user' },
  { category: 'relationship', id: '15187b65', sensitivity: 'high', note: 'people connected to the user' },
  { category: 'fact', id: 'cf5089a3', sensitivity: 'low', note: 'general facts stated about the user' },
  { category: 'other', id: 'af00ebf7', sensitivity: 'medium', note: 'anything uncategorized' },
  { category: 'instruction', id: '86fed467', sensitivity: 'medium', note: 'standing instructions for how apps should behave' },
];

export const ALL_CATEGORIES = LIVE_EVIDENCE.map((e) => e.category);

// Seed ledger data
export const LEDGER_SEED: LedgerEntry[] = [
  { id: 1, requester: 'ChatGPT', date: 'Aug 3', categories: ['preference', 'fact'], total: 9, revoked: false },
  { id: 2, requester: 'Perplexity', date: 'Jul 30', categories: ['project'], total: 9, revoked: false },
];

// Identity aspects that become inferable based on permission COMBINATIONS
export const IDENTITY_ASPECTS: IdentityAspect[] = [
  {
    required: ['event', 'relationship'],
    label: 'Social Graph',
    description: 'Your social circle, life events, and interpersonal connections can be fully mapped.',
    sensitivity: 'high',
  },
  {
    required: ['purchase', 'preference'],
    label: 'Consumer Profile',
    description: 'A complete consumer identity — spending patterns, taste signals, brand affinities.',
    sensitivity: 'high',
  },
  {
    required: ['project', 'fact', 'claim'],
    label: 'Professional Identity',
    description: 'Your career trajectory, expertise areas, and professional reputation.',
    sensitivity: 'medium',
  },
  {
    required: ['preference', 'instruction'],
    label: 'Decision Patterns',
    description: 'How you make choices, what you automate, and where you delegate thinking.',
    sensitivity: 'high',
  },
  {
    required: ['event', 'purchase', 'relationship'],
    label: 'Life Pattern Model',
    description: 'A comprehensive model of your daily life, routines, and life stage.',
    sensitivity: 'critical',
  },
  {
    required: 'all',
    label: 'Behavioral Twin',
    description: 'A predictive model accurate enough to simulate your decisions. This data becomes training material for future AI systems.',
    sensitivity: 'critical',
  },
];

// Bias reinforcement feedback loops
export const BIAS_LOOPS: BiasLoop[] = [
  {
    id: 'consumer-bubble',
    categories: ['purchase', 'preference'],
    steps: [
      'Your purchase history trains recommendation engines',
      'They show you more of the same products and brands',
      'Your future purchases look increasingly similar',
      'The pattern reinforces itself — your choices narrow',
    ],
  },
  {
    id: 'social-echo',
    categories: ['relationship', 'event'],
    steps: [
      'Your social connections inform content algorithms',
      'You see what your circle sees and validates',
      'Your worldview narrows to shared perspectives',
      'The data confirms the assumption about who you are',
    ],
  },
  {
    id: 'creative-convergence',
    categories: ['project', 'preference', 'instruction'],
    steps: [
      'Your project data shapes AI assistance',
      'It suggests paths similar to your past work',
      'Your output converges toward an established pattern',
      'The model learns this convergence as "your type"',
    ],
  },
  {
    id: 'identity-lock-in',
    categories: ['claim', 'fact', 'instruction'],
    steps: [
      'Claims about you get stored as persistent facts',
      'Future AI interactions reference these stored claims',
      'You correct less than you accept by default',
      'The AI\'s version of you becomes your self-image',
    ],
  },
];

// Sensitivity color map
export const SENSITIVITY_COLORS: Record<Sensitivity, string> = {
  low: '#8B95A8',
  medium: '#B4802A',
  high: '#A13D34',
  critical: '#7A1A1A',
};

// Score color thresholds
export function getScoreColor(score: number): string {
  if (score <= 25) return '#3F6B57';
  if (score <= 50) return '#B4802A';
  if (score <= 75) return '#C75B1A';
  return '#A13D34';
}

export function getScoreLabel(score: number): string {
  if (score <= 25) return 'Low Exposure';
  if (score <= 50) return 'Moderate Exposure';
  if (score <= 75) return 'High Exposure';
  return 'Critical Exposure';
}

// Calculate cumulative impact score
export function calculateImpactScore(
  allGrantedCategories: Set<string>,
  ledger: LedgerEntry[],
  currentSelection: Set<string>
): number {
  // 1. Collect ALL unique categories granted across ALL ledger entries + current selection
  const granted = new Set(allGrantedCategories);

  // Add current selection
  for (const cat of currentSelection) {
    granted.add(cat);
  }

  if (granted.size === 0) return 0;

  // 2. Base score = (unique granted categories / 9) * 60
  let score = (granted.size / 9) * 60;

  // 3. Bonus for cross-app overlap
  const activeLedger = ledger.filter((e) => !e.revoked);
  const allApps = ['ChatGPT', 'Perplexity', 'Claude'];

  for (const cat of granted) {
    const appCount = allApps.filter((app) => {
      if (app === 'Claude') return currentSelection.has(cat);
      return activeLedger.some((e) => e.requester === app && e.categories.includes(cat));
    }).length;
    if (appCount >= 2) score += 4;
  }

  // 4. Bonus for high-sensitivity combinations
  if (granted.has('event') && granted.has('relationship')) score += 8;
  if (granted.has('purchase') && granted.has('preference')) score += 6;
  if (granted.size === 9) score += 20;

  // 5. Cap at 100
  return Math.min(100, Math.round(score));
}

// Collect all granted categories from ledger
export function collectGrantedFromLedger(ledger: LedgerEntry[]): Set<string> {
  const granted = new Set<string>();
  for (const entry of ledger) {
    if (!entry.revoked) {
      for (const cat of entry.categories) {
        granted.add(cat);
      }
    }
  }
  return granted;
}

// Calculate autonomy score (inverse of delegation)
export function calculateAutonomy(allGranted: Set<string>): number {
  const decisionCategories = ['instruction', 'preference', 'claim'];
  let count = 0;
  for (const cat of decisionCategories) {
    if (allGranted.has(cat)) count++;
  }
  // Also factor in total categories
  const totalWeight = (count * 15) + (allGranted.size > 5 ? (allGranted.size - 5) * 5 : 0);
  return Math.max(0, 100 - totalWeight);
}

export function getAutonomyLabel(score: number): string {
  if (score >= 80) return "You're in control — AI assists but doesn't decide";
  if (score >= 50) return 'Growing dependence — AI shapes your options more than you realize';
  if (score >= 25) return 'Significant delegation — many decisions follow AI-suggested paths';
  return 'Autonomy erosion — AI effectively makes decisions in your name';
}

// Check if an identity aspect is "enabled"
export function isAspectEnabled(aspect: IdentityAspect, allGranted: Set<string>): boolean {
  if (aspect.required === 'all') {
    return ALL_CATEGORIES.every((c) => allGranted.has(c));
  }
  return aspect.required.every((c) => allGranted.has(c));
}

// Find which apps contribute a specific category
export function findContributingApps(
  category: string,
  ledger: LedgerEntry[],
  currentSelection: Set<string>
): string[] {
  const apps: string[] = [];
  const activeLedger = ledger.filter((e) => !e.revoked);
  for (const entry of activeLedger) {
    if (entry.categories.includes(category)) {
      apps.push(entry.requester);
    }
  }
  if (currentSelection.has(category)) {
    apps.push('Claude (pending)');
  }
  return apps;
}

// Find what identity aspects a specific category enables (in combination with others)
export function findEnabledAspectsForCategory(
  category: string,
  allGranted: Set<string>
): IdentityAspect[] {
  return IDENTITY_ASPECTS.filter((aspect) => {
    if (aspect.required === 'all') return allGranted.size === 9;
    return aspect.required.includes(category) && isAspectEnabled(aspect, allGranted);
  });
}
