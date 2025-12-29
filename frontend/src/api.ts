export type ImpactCategoryId =
  | "broad"
  | "environmental"
  | "social"
  | "racialJustice"
  | "workplaceEquality"
  | "genderEquality";

export interface ImpactCategory {
  id: ImpactCategoryId;
  name: string;
  description: string;
}

export type ImpactKey =
  | "environmental"
  | "laborPractices"
  | "socialImpact"
  | "genderEquality"
  | "payEquality"
  | "corporateImpact"
  | "shortTermProfitability"
  | "longTermProfitability";

export type ImpactScores = Record<ImpactKey, number>;

export type TimePeriod = "1D" | "1W" | "1M" | "6M" | "1Y" | "5Y";

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

export interface Company {
  id: string;
  symbol: string;
  name: string;
  description: string;
  sector: string;
  logo?: string;
  impactCategories: ImpactCategoryId[];
  baseScores: Partial<Record<ImpactKey, number>>;
}

export interface CompanyScores {
  company: Company;
  quote: Quote | null;
  scores: ImpactScores;
  overallImpactScore: number;
}

export interface ArticleSnippet {
  id: string;
  companyId: string;
  title: string;
  summary: string;
  url?: string;
  sentiment: "positive" | "negative" | "neutral";
  impactTags: ImpactKey[];
  source?: string;
  publishedAt?: string;
}

export interface CompanyDetailResponse {
  company: Company;
  quote: Quote | null;
  scores: ImpactScores;
  overallImpactScore: number;
  impactCategoryUsed: ImpactCategoryId;
  articles: ArticleSnippet[];
  historicalData?: HistoricalDataPoint[];
  period?: TimePeriod;
}

export interface SearchResult {
  symbol: string;
  name: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return (await response.json()) as T;
}

export function fetchImpactCategories(): Promise<ImpactCategory[]> {
  return apiGet<ImpactCategory[]>("/api/impacts");
}

export function fetchRecommendations(
  impact: ImpactCategoryId,
  useRealData: boolean = false
): Promise<CompanyScores[]> {
  const params = new URLSearchParams({
    impact,
    limit: "8",
    ...(useRealData ? { real: "true" } : {})
  }).toString();
  return apiGet<CompanyScores[]>(`/api/recommendations?${params}`);
}

export function fetchCompanyDetail(
  symbol: string,
  impact: ImpactCategoryId,
  period: TimePeriod = "1M"
): Promise<CompanyDetailResponse> {
  const params = new URLSearchParams({ impact, period }).toString();
  return apiGet<CompanyDetailResponse>(`/api/company/${symbol}?${params}`);
}

export function fetchHistoricalData(
  symbol: string,
  period: TimePeriod
): Promise<{ symbol: string; period: TimePeriod; data: HistoricalDataPoint[] }> {
  const params = new URLSearchParams({ period }).toString();
  return apiGet(`/api/company/${symbol}/history?${params}`);
}

export function searchCompanies(query: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query }).toString();
  return apiGet<SearchResult[]>(`/api/company/search?${params}`);
}


