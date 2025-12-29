import axios from "axios";
import {
  ImpactCategoryId,
  ImpactKey,
  ImpactScores,
  NewsArticle,
  CompanyInfo
} from "../types";
import { env } from "../config/env";
import { getCompanyNews, analyzeNewsWithGemini } from "./newsService";

const IMPACT_KEYS: ImpactKey[] = [
  "environmental",
  "laborPractices",
  "socialImpact",
  "genderEquality",
  "payEquality",
  "corporateImpact",
  "shortTermProfitability",
  "longTermProfitability"
];

// Cache for computed scores
interface CachedScore {
  scores: ImpactScores;
  overallImpactScore: number;
  news: NewsArticle[];
  computedAt: number;
}

const SCORE_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes (shorter for testing)
const scoreCache = new Map<string, CachedScore>();

// Helper to clear cache for a specific company (useful for debugging)
export function clearScoreCache(symbol?: string) {
  if (symbol) {
    const keysToDelete: string[] = [];
    for (const key of scoreCache.keys()) {
      if (key.startsWith(symbol.toUpperCase())) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(k => scoreCache.delete(k));
    console.log(`[ScoringService] Cleared cache for ${symbol}`);
  } else {
    scoreCache.clear();
    console.log("[ScoringService] Cleared entire score cache");
  }
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Compute base scores for a company based on sector.
 * In production, this could use historical ESG data APIs.
 */
function getBaseSectorScores(sector: string): ImpactScores {
  const sectorScores: Record<string, Partial<ImpactScores>> = {
    Technology: {
      environmental: 75,
      laborPractices: 80,
      socialImpact: 82,
      genderEquality: 70,
      payEquality: 75,
      corporateImpact: 85,
      shortTermProfitability: 85,
      longTermProfitability: 88
    },
    Automotive: {
      environmental: 60,
      laborPractices: 70,
      socialImpact: 65,
      genderEquality: 60,
      payEquality: 65,
      corporateImpact: 70,
      shortTermProfitability: 70,
      longTermProfitability: 75
    },
    "Financial Services": {
      environmental: 65,
      laborPractices: 75,
      socialImpact: 70,
      genderEquality: 68,
      payEquality: 72,
      corporateImpact: 80,
      shortTermProfitability: 82,
      longTermProfitability: 80
    },
    Healthcare: {
      environmental: 70,
      laborPractices: 78,
      socialImpact: 85,
      genderEquality: 72,
      payEquality: 70,
      corporateImpact: 75,
      shortTermProfitability: 78,
      longTermProfitability: 82
    },
    Energy: {
      environmental: 45,
      laborPractices: 72,
      socialImpact: 55,
      genderEquality: 58,
      payEquality: 65,
      corporateImpact: 65,
      shortTermProfitability: 75,
      longTermProfitability: 65
    },
    ETF: {
      environmental: 75,
      laborPractices: 75,
      socialImpact: 75,
      genderEquality: 75,
      payEquality: 75,
      corporateImpact: 75,
      shortTermProfitability: 75,
      longTermProfitability: 80
    }
  };

  const base = sectorScores[sector] || {};
  return IMPACT_KEYS.reduce((acc, key) => {
    acc[key] = base[key] ?? 70;
    return acc;
  }, {} as ImpactScores);
}

/**
 * Analyze news articles and adjust scores based on sentiment.
 * Uses keyword matching for each impact category.
 */
function adjustScoresFromNews(
  baseScores: ImpactScores,
  news: NewsArticle[]
): ImpactScores {
  const scores = { ...baseScores };
  
  // Keywords for each impact category
  const impactKeywords: Record<ImpactKey, string[]> = {
    environmental: [
      "climate", "carbon", "emissions", "renewable", "sustainable", "green",
      "pollution", "environmental", "energy", "solar", "wind", "electric"
    ],
    laborPractices: [
      "worker", "employee", "labor", "safety", "workplace", "union",
      "working conditions", "benefits", "layoff", "hiring"
    ],
    socialImpact: [
      "community", "social", "privacy", "data", "security", "philanthropy",
      "donation", "charity", "society", "public"
    ],
    genderEquality: [
      "gender", "women", "female", "diversity", "inclusion", "representation",
      "equality", "discrimination"
    ],
    payEquality: [
      "pay gap", "wage", "salary", "compensation", "equal pay", "bonus"
    ],
    corporateImpact: [
      "governance", "board", "executive", "transparency", "ethics",
      "compliance", "regulation", "scandal", "investigation"
    ],
    shortTermProfitability: [
      "earnings", "revenue", "profit", "quarter", "sales", "growth",
      "beat expectations", "miss", "guidance"
    ],
    longTermProfitability: [
      "innovation", "r&d", "patent", "expansion", "market share",
      "competitive", "strategic", "long-term", "investment"
    ]
  };

  for (const article of news) {
    const text = `${article.title} ${article.description}`.toLowerCase();
    const sentiment = article.sentiment || "neutral";
    const delta = sentiment === "positive" ? 3 : sentiment === "negative" ? -3 : 0;

    for (const [key, keywords] of Object.entries(impactKeywords) as [ImpactKey, string[]][]) {
      const hasKeyword = keywords.some((kw) => text.includes(kw));
      if (hasKeyword) {
        scores[key] = clampScore(scores[key] + delta);
      }
    }
  }

  return scores;
}

function overallScoreForCategory(
  scores: ImpactScores,
  impact: ImpactCategoryId
): number {
  const pick = (keys: ImpactKey[]): number => {
    const values = keys.map((k) => scores[k]);
    const sum = values.reduce((acc, v) => acc + v, 0);
    return sum / values.length;
  };

  switch (impact) {
    case "environmental":
      return pick(["environmental", "corporateImpact", "longTermProfitability"]);
    case "social":
      return pick(["socialImpact", "laborPractices", "payEquality"]);
    case "genderEquality":
      return pick(["genderEquality", "payEquality", "laborPractices"]);
    case "racialJustice":
      return pick(["socialImpact", "laborPractices", "payEquality"]);
    case "workplaceEquality":
      return pick(["laborPractices", "genderEquality", "payEquality"]);
    case "broad":
    default:
      return pick(IMPACT_KEYS);
  }
}

/**
 * Use Gemini to compute comprehensive impact scores.
 * This is the main AI-powered scoring function.
 * Works with or without news articles - uses company knowledge if no news available.
 */
async function computeGeminiScores(
  companyInfo: CompanyInfo,
  news: NewsArticle[],
  baseScores: ImpactScores
): Promise<ImpactScores | null> {
  if (!env.geminiApiKey) {
    console.log("[ScoringService] No Gemini API key, using heuristic scoring");
    return null;
  }

  // Build news section if available
  let newsSection = "";
  if (news.length > 0) {
    const articleText = news
      .slice(0, 10)
      .map(
        (a, i) =>
          `${i + 1}. "${a.title}" (${a.source}, ${new Date(a.publishedAt).toLocaleDateString()})
   ${a.description}`
      )
      .join("\n\n");
    newsSection = `
Recent news articles about this company:

${articleText}

Based on these news articles AND your knowledge about the company, provide impact scores.`;
  } else {
    newsSection = `
No recent news available. Based on your knowledge about ${companyInfo.name} and companies in the ${companyInfo.sector} sector, provide impact scores.`;
  }

  const prompt = `
You are an ESG (Environmental, Social, Governance) analyst helping retail investors understand the real-world impact of companies.

IMPORTANT: Analyze THIS SPECIFIC COMPANY based on its unique characteristics and reputation.

Company: ${companyInfo.name} (${companyInfo.symbol})
Sector: ${companyInfo.sector}
Industry: ${companyInfo.industry}
Description: ${companyInfo.description}
${newsSection}

Provide SPECIFIC impact scores on a 0-100 scale for THIS COMPANY (${companyInfo.name}).
DO NOT give generic sector scores - evaluate ${companyInfo.name}'s actual track record.

Consider ${companyInfo.name}'s specific:
- Environmental initiatives, carbon footprint, and climate commitments
- Labor practices, workplace safety, and employee treatment
- Social impact, community involvement, and data privacy
- Gender diversity in leadership and workforce
- Pay equity and compensation fairness
- Corporate governance, board independence, and transparency
- Financial performance and profitability trends

Starting baseline (sector averages - ADJUST for ${companyInfo.name}'s reality):
${JSON.stringify(baseScores, null, 2)}

Think about ${companyInfo.name}'s ACTUAL reputation:
- What is this company known for?
- What controversies or achievements has it had?
- How does it compare to peers?

Return ONLY a valid JSON object (no explanation, no markdown, no code blocks):
{
  "environmental": <score 0-100>,
  "laborPractices": <score 0-100>,
  "socialImpact": <score 0-100>,
  "genderEquality": <score 0-100>,
  "payEquality": <score 0-100>,
  "corporateImpact": <score 0-100>,
  "shortTermProfitability": <score 0-100>,
  "longTermProfitability": <score 0-100>
}
`.trim();

  try {
    console.log(`[ScoringService] Requesting Gemini analysis for ${companyInfo.symbol}`);
    
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7, // Higher temperature for more variation between companies
          maxOutputTokens: 500
        }
      },
      { params: { key: env.geminiApiKey } }
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[ScoringService] Could not parse Gemini response:", text);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as Partial<Record<ImpactKey, number>>;
    const updated: ImpactScores = { ...baseScores };

    for (const key of IMPACT_KEYS) {
      const value = parsed[key];
      if (typeof value === "number" && !Number.isNaN(value)) {
        updated[key] = clampScore(value);
      }
    }

    console.log(`[ScoringService] Gemini scores for ${companyInfo.symbol}:`, updated);
    return updated;
  } catch (error) {
    console.error("[ScoringService] Gemini scoring failed:", error);
    return null;
  }
}

/**
 * Main function to compute impact scores for a company.
 * Uses real news data and Gemini AI when available.
 */
export async function computeImpactScores(
  companyInfo: CompanyInfo,
  impact: ImpactCategoryId
): Promise<{
  scores: ImpactScores;
  overallImpactScore: number;
  news: NewsArticle[];
}> {
  const cacheKey = `${companyInfo.symbol}-${impact}`;
  const cached = scoreCache.get(cacheKey);

  if (cached && Date.now() - cached.computedAt < SCORE_CACHE_TTL_MS) {
    console.log(`[ScoringService] ✓ Using cached scores for ${companyInfo.symbol}-${impact}`);
    return {
      scores: cached.scores,
      overallImpactScore: cached.overallImpactScore,
      news: cached.news
    };
  }

  console.log(`[ScoringService] ⚡ Computing NEW scores for ${companyInfo.symbol} (${companyInfo.name})`);
  console.log(`[ScoringService] Sector: ${companyInfo.sector}, Impact category: ${impact}`);

  // 1. Get base scores for sector
  const baseScores = getBaseSectorScores(companyInfo.sector);
  console.log(`[ScoringService] Base scores for ${companyInfo.sector}:`, baseScores);

  // 2. Fetch real news about the company
  let news = await getCompanyNews(companyInfo.name, companyInfo.symbol, 10);
  console.log(`[ScoringService] Fetched ${news.length} news articles for ${companyInfo.symbol}`);

  // 3. Analyze news sentiment with Gemini if available
  if (env.geminiApiKey) {
    news = await analyzeNewsWithGemini(news, companyInfo.name);
  }

  // 4. Compute final scores
  let finalScores: ImpactScores;

  // Try Gemini first for comprehensive analysis
  console.log(`[ScoringService] Attempting Gemini scoring for ${companyInfo.symbol}...`);
  const geminiScores = await computeGeminiScores(companyInfo, news, baseScores);
  
  if (geminiScores) {
    console.log(`[ScoringService] ✓ Using Gemini scores for ${companyInfo.symbol}`);
    finalScores = geminiScores;
  } else {
    console.log(`[ScoringService] ⚠ Using heuristic scores for ${companyInfo.symbol} (Gemini unavailable)`);
    // Fall back to heuristic scoring
    finalScores = adjustScoresFromNews(baseScores, news);
  }

  // 5. Compute overall score based on impact category
  const overallImpactScore = clampScore(overallScoreForCategory(finalScores, impact));
  console.log(`[ScoringService] Final overall score for ${companyInfo.symbol}: ${overallImpactScore}`);

  // Cache results
  scoreCache.set(cacheKey, {
    scores: finalScores,
    overallImpactScore,
    news,
    computedAt: Date.now()
  });

  return { scores: finalScores, overallImpactScore, news };
}

/**
 * Legacy function for backward compatibility with existing routes.
 * @deprecated Use computeImpactScores instead
 */
export async function getImpactScores(
  companyId: string,
  impact: ImpactCategoryId
): Promise<{ scores: ImpactScores; overallImpactScore: number }> {
  // For legacy calls, create a minimal CompanyInfo
  const info: CompanyInfo = {
    symbol: companyId.toUpperCase(),
    name: companyId,
    description: "",
    sector: "Unknown",
    industry: "Unknown"
  };

  const result = await computeImpactScores(info, impact);
  return {
    scores: result.scores,
    overallImpactScore: result.overallImpactScore
  };
}


