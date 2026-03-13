import rawData from "../../../data.json";

/* ── Score interfaces ─────────────────────────────────── */

export interface TokenScores {
  productTruth: number;
  communityQuality: number;
  tokenLinkage: number;
  marketStructure: number;
  founderExecution: number;
  distributionReflexivity: number;
  valuationAsymmetry: number;
  culturalMoat: number;
  catalystsTiming: number;
}

export interface NFTScores {
  productTruth: number;
  communityQuality: number;
  collectionSinkIdentity: number;
  marketStructure: number;
  founderExecution: number;
  distributionReflexivity: number;
  floorDepthCulturalPremium: number;
  culturalMoat: number;
  catalystsTiming: number;
}

export interface Penalties {
  unlockCliffs: number;
  insiderConcentration: number;
  legalRisk: number;
  treasuryRunway: number;
  smartContractRisk: number;
  platformDependency: number;
}

/* ── Asset interfaces ─────────────────────────────────── */

export interface Token {
  id: string;
  name: string;
  ticker: string;
  chain: "Solana" | "Base" | "Ethereum";
  marketCap: number;
  fdv: number;
  price: number | null;
  athPrice: number | null;
  pctFromAth: number | null;
  circulatingPct: number;
  holders: number | null;
  category: string;
  description: string;
  catalysts: string[];
  risks: string[];
  killGate: "pass" | "fail";
  killGateNote: string | null;
  scores: TokenScores;
  penalties: Penalties;
  teamStatus: string;
  activity: string;
}

export interface KilledToken {
  id: string;
  name: string;
  ticker: string;
  chain: string;
  marketCap: number;
  fdv: number;
  killGateReason: string;
  category: string;
}

export interface NFT {
  id: string;
  name: string;
  chain: "Solana" | "Base" | "Ethereum";
  floorEth: number | null;
  floorSol?: number | null;
  floorUsd: number | null;
  marketCap: number | null;
  athFloorEth: number | null;
  athFloorSol?: number | null;
  pctFromAthFloor: number | null;
  change30d: number | null;
  supply: number | null;
  holders: number | null;
  category: string;
  description: string;
  catalysts: string[];
  risks: string[];
  killGate: "pass" | "fail";
  killGateNote: string | null;
  scores: NFTScores;
  penalties: Penalties;
  activity: string;
}

export interface KilledNFT {
  id: string;
  name: string;
  chain: string;
  floorUsd: number;
  marketCap: number;
  killGateReason: string;
  category: string;
}

export interface ChainInfo {
  color: string;
  tokens: number;
  nfts: number;
}

export interface Metadata {
  lastUpdated: string;
  methodology: string;
  scoringVersion: string;
  excludedProjects: string[];
  chains: Record<string, ChainInfo>;
}

export interface CryptoData {
  tokens: Token[];
  killedTokens: KilledToken[];
  nfts: NFT[];
  killedNfts: KilledNFT[];
  metadata: Metadata;
}

/* ── Data exports ─────────────────────────────────────── */

export const data = rawData as CryptoData;
export const tokens = data.tokens;
export const killedTokens = data.killedTokens;
export const nfts = data.nfts;
export const killedNfts = data.killedNfts;
export const metadata = data.metadata;

/* ── Constants ────────────────────────────────────────── */

export const CHAIN_COLORS: Record<string, string> = {
  Solana: "#9945FF",
  Base: "#0052FF",
  Ethereum: "#627EEA",
};

const TOKEN_WEIGHTS: Record<keyof TokenScores, number> = {
  productTruth: 20,
  communityQuality: 15,
  tokenLinkage: 15,
  marketStructure: 10,
  founderExecution: 10,
  distributionReflexivity: 10,
  valuationAsymmetry: 10,
  culturalMoat: 5,
  catalystsTiming: 5,
};

const NFT_WEIGHTS: Record<keyof NFTScores, number> = {
  productTruth: 20,
  communityQuality: 15,
  collectionSinkIdentity: 15,
  marketStructure: 10,
  founderExecution: 10,
  distributionReflexivity: 10,
  floorDepthCulturalPremium: 10,
  culturalMoat: 5,
  catalystsTiming: 5,
};

export const TOKEN_DIMENSIONS: { key: keyof TokenScores; label: string; shortLabel: string; weight: number }[] = [
  { key: "productTruth", label: "Product Truth", shortLabel: "PRD", weight: 20 },
  { key: "communityQuality", label: "Community", shortLabel: "COM", weight: 15 },
  { key: "tokenLinkage", label: "Token Linkage", shortLabel: "TKN", weight: 15 },
  { key: "marketStructure", label: "Market Structure", shortLabel: "MKT", weight: 10 },
  { key: "founderExecution", label: "Founder Exec", shortLabel: "FND", weight: 10 },
  { key: "distributionReflexivity", label: "Distribution", shortLabel: "DST", weight: 10 },
  { key: "valuationAsymmetry", label: "Valuation", shortLabel: "VAL", weight: 10 },
  { key: "culturalMoat", label: "Cultural Moat", shortLabel: "CUL", weight: 5 },
  { key: "catalystsTiming", label: "Catalysts", shortLabel: "CAT", weight: 5 },
];

export const NFT_DIMENSIONS: { key: keyof NFTScores; label: string; shortLabel: string; weight: number }[] = [
  { key: "productTruth", label: "Product Truth", shortLabel: "PRD", weight: 20 },
  { key: "communityQuality", label: "Community", shortLabel: "COM", weight: 15 },
  { key: "collectionSinkIdentity", label: "Collection Identity", shortLabel: "CSI", weight: 15 },
  { key: "marketStructure", label: "Market Structure", shortLabel: "MKT", weight: 10 },
  { key: "founderExecution", label: "Founder Exec", shortLabel: "FND", weight: 10 },
  { key: "distributionReflexivity", label: "Distribution", shortLabel: "DST", weight: 10 },
  { key: "floorDepthCulturalPremium", label: "Floor/Premium", shortLabel: "FDP", weight: 10 },
  { key: "culturalMoat", label: "Cultural Moat", shortLabel: "CUL", weight: 5 },
  { key: "catalystsTiming", label: "Catalysts", shortLabel: "CAT", weight: 5 },
];

export const PENALTY_KEYS: { key: keyof Penalties; label: string; maxPenalty: number }[] = [
  { key: "unlockCliffs", label: "Unlock Cliffs", maxPenalty: -5 },
  { key: "insiderConcentration", label: "Insider Concentration", maxPenalty: -4 },
  { key: "legalRisk", label: "Legal Risk", maxPenalty: -3 },
  { key: "treasuryRunway", label: "Treasury Runway", maxPenalty: -3 },
  { key: "smartContractRisk", label: "Smart Contract Risk", maxPenalty: -3 },
  { key: "platformDependency", label: "Platform Dependency", maxPenalty: -2 },
];

/* ── Scoring functions ────────────────────────────────── */

export function computeTokenScore(scores: TokenScores): number {
  let total = 0;
  for (const [key, weight] of Object.entries(TOKEN_WEIGHTS)) {
    total += (scores[key as keyof TokenScores] / 10) * weight;
  }
  return Math.round(total);
}

export function computeNFTScore(scores: NFTScores): number {
  let total = 0;
  for (const [key, weight] of Object.entries(NFT_WEIGHTS)) {
    total += (scores[key as keyof NFTScores] / 10) * weight;
  }
  return Math.round(total);
}

export function computePenalty(penalties: Penalties): number {
  return Object.values(penalties).reduce((sum, v) => sum + v, 0);
}

export function computeFinalScore(rawScore: number, penalties: Penalties): number {
  return Math.max(0, rawScore + computePenalty(penalties));
}

/* ── Formatting helpers ───────────────────────────────── */

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "N/A";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatPrice(value: number | null | undefined): string {
  if (value == null) return "N/A";
  if (value >= 1000) return `$${new Intl.NumberFormat("en-US").format(Math.round(value))}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(6)}`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "N/A";
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPct(value: number | null | undefined): string {
  if (value == null) return "N/A";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
