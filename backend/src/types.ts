export type ImpactCategoryId =
  | "broad"
  | "environmental"
  | "social"
  | "racialJustice"
  | "workplaceEquality"
  | "genderEquality";

export type ImpactKey =
  | "environmental"
  | "laborPractices"
  | "socialImpact"
  | "genderEquality"
  | "payEquality"
  | "corporateImpact"
  | "shortTermProfitability"
  | "longTermProfitability";

export interface ImpactCategory {
  id: ImpactCategoryId;
  name: string;
  description: string;
}

export type ImpactScores = Record<ImpactKey, number>;

export interface Company {
  id: string;
  symbol: string;
  name: string;
  description: string;
  sector: string;
  logo?: string; // Company logo (emoji or URL)
  impactCategories: ImpactCategoryId[];
  /**
   * Baseline scores (0-100) used before applying article-based adjustments.
   */
  baseScores: Partial<Record<ImpactKey, number>>;
}

export interface ArticleSnippet {
  id: string;
  companyId: string;
  title: string;
  summary: string;
  /**
   * Optional URL used just for display in the UI.
   */
  url?: string;
  sentiment: "positive" | "negative";
  /**
   * Which impact dimensions this article most closely relates to.
   */
  impactTags: ImpactKey[];
}

export interface Quote {
  symbol: string;
  price: number;
  currency: string;
  changePercent: number;
  lastUpdated: string;
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TimePeriod = "1D" | "1W" | "1M" | "6M" | "1Y" | "5Y";

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment?: "positive" | "negative" | "neutral";
}

export interface CompanyInfo {
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  logo?: string;
  marketCap?: number;
  peRatio?: number;
  dividendYield?: number;
}

export interface CompanyScores {
  company: Company;
  scores: ImpactScores;
  quote: Quote | null;
  overallImpactScore: number;
}

export interface CompanyFullData {
  info: CompanyInfo;
  quote: Quote | null;
  scores: ImpactScores;
  overallImpactScore: number;
  news: NewsArticle[];
  historicalData: HistoricalDataPoint[];
}


