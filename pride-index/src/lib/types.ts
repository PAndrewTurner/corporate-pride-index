/** Shared data model for the Corporate Pride Index. */

export type Band =
  | 'Champion'
  | 'Ally'
  | 'Neutral'
  | 'Performative'
  | 'Harmful'
  | 'Adversarial';

export type Tier = 'Cosmetic' | 'Commercial' | 'Civic' | 'Financial' | 'Structural' | '—';

export type Polarity = 'Positive' | 'Negative';

export type Trajectory = 'Improving' | 'Stable' | 'Declining' | 'Sharp Reversal';

export interface ActionRow {
  actionId: string;
  description: string;
  tier: Tier;
  polarity: Polarity;
  points: number;
  year: number;
  sourceUrl: string | null;
  sourceType: string | null;
  postJan2025: boolean;
  notes: string | null;
}

export interface SocialPost {
  platform: string;
  date: string | null;
  description: string;
  url: string | null;
  engagement: string | null;
  deleted: boolean;
  notes: string | null;
}

export interface Statement {
  recordType: string;
  date: string | null;
  title: string;
  excerpt: string;
  speaker: string | null;
  sourceUrl: string | null;
}

export interface Rationale {
  verdict: string;
  driversUp: string;
  driversDown: string;
  decisiveFactor: string;
  trajectory: Trajectory;
  confidence: 'High' | 'Medium' | 'Low' | string;
}

export interface ContextFlags {
  postJan2025Reversal: boolean;
  pressureDriven: boolean;
  juneOnly: boolean;
  transNbExclusion: boolean;
  geoHypocrisy: boolean;
}

export interface ScoreBreakdown {
  cosmeticCommercialRaw: number;
  cosmeticCommercialCapped: number;
  civic: number;
  financial: number;
  structural: number;
  positiveCapped: number;
  negative: number;
  score: number;
  band: Band;
}

export interface Company {
  name: string;
  slug: string;
  ticker: string | null;
  sector: string;
  revenueB: number | null;
  hrcCei: number | null;
  ceiYear: number | null;
  stillSubmittingCei: boolean | null;
  flags: ContextFlags;
  analystNotes: string | null;
  rationale: Rationale | null;
  actions: ActionRow[];
  social: SocialPost[];
  statements: Statement[];
  breakdown: ScoreBreakdown;
  score: number;
  band: Band;
}

export interface ScoringRefRow {
  actionId: string;
  tier: string;
  polarity: Polarity;
  points: number;
  description: string;
}

export interface SectorStats {
  sector: string;
  companies: number;
  avgScore: number;
  min: number;
  max: number;
  champions: number;
  harmfulPlus: number;
}

export interface IndexData {
  generatedAt: string;
  workbook: string;
  companies: Company[];
  sectors: SectorStats[];
  scoringReference: ScoringRefRow[];
  validation: {
    passed: boolean;
    companiesChecked: number;
    actionsChecked: number;
    issues: string[];
  };
}
