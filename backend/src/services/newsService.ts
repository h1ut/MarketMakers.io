import axios from "axios";
import { env } from "../config/env";
import { NewsArticle } from "../types";

interface CachedNews {
  articles: NewsArticle[];
  fetchedAt: number;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const newsCache = new Map<string, CachedNews>();

// Mock news for when API is not available
const mockNews: Record<string, NewsArticle[]> = {
  DEFAULT: [
    {
      id: "mock-1",
      title: "Company announces new sustainability initiative",
      description:
        "The company has committed to reducing carbon emissions by 50% by 2030 through renewable energy investments.",
      url: "https://example.com/sustainability",
      source: "Business Wire",
      publishedAt: new Date().toISOString(),
      sentiment: "positive"
    },
    {
      id: "mock-2",
      title: "Quarterly earnings exceed expectations",
      description:
        "Strong revenue growth driven by new product launches and market expansion.",
      url: "https://example.com/earnings",
      source: "Reuters",
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      sentiment: "positive"
    },
    {
      id: "mock-3",
      title: "Workplace diversity report shows improvement",
      description:
        "Annual diversity report reveals increased representation across all levels of the organization.",
      url: "https://example.com/diversity",
      source: "PR Newswire",
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
      sentiment: "positive"
    }
  ]
};

/**
 * Analyze sentiment of news article using simple keyword matching.
 * In production, this would use a proper NLP model or Gemini.
 */
function analyzeSentiment(
  title: string,
  description: string
): "positive" | "negative" | "neutral" {
  const text = `${title} ${description}`.toLowerCase();

  const positiveWords = [
    "growth",
    "profit",
    "success",
    "innovation",
    "sustainability",
    "diversity",
    "award",
    "record",
    "exceeds",
    "strong",
    "partnership",
    "expansion",
    "breakthrough",
    "renewable",
    "clean",
    "green",
    "inclusive",
    "equity"
  ];

  const negativeWords = [
    "lawsuit",
    "fine",
    "scandal",
    "layoff",
    "decline",
    "loss",
    "controversy",
    "investigation",
    "pollution",
    "violation",
    "discrimination",
    "unsafe",
    "breach",
    "fraud",
    "recall",
    "strike"
  ];

  let positiveScore = 0;
  let negativeScore = 0;

  for (const word of positiveWords) {
    if (text.includes(word)) positiveScore++;
  }
  for (const word of negativeWords) {
    if (text.includes(word)) negativeScore++;
  }

  if (positiveScore > negativeScore) return "positive";
  if (negativeScore > positiveScore) return "negative";
  return "neutral";
}

/**
 * Fetch news articles for a company from News API.
 * Falls back to mock data if API key is not configured.
 */
export async function getCompanyNews(
  companyName: string,
  symbol: string,
  limit: number = 5
): Promise<NewsArticle[]> {
  const cacheKey = symbol.toUpperCase();
  const cached = newsCache.get(cacheKey);

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.articles;
  }

  if (!env.newsApiKey) {
    console.log(`[NewsService] No API key, using mock news for ${symbol}`);
    return mockNews.DEFAULT;
  }

  try {
    // Search for company news
    const searchQuery = `"${companyName}" OR "${symbol}"`;
    const response = await axios.get(`${env.newsApiBaseUrl}/everything`, {
      params: {
        q: searchQuery,
        sortBy: "publishedAt",
        language: "en",
        pageSize: limit,
        apiKey: env.newsApiKey
      }
    });

    const articles: NewsArticle[] = (response.data?.articles || []).map(
      (article: {
        title: string;
        description: string;
        url: string;
        source: { name: string };
        publishedAt: string;
      }, index: number) => ({
        id: `${symbol}-news-${index}`,
        title: article.title || "Untitled",
        description: article.description || "",
        url: article.url || "",
        source: article.source?.name || "Unknown",
        publishedAt: article.publishedAt || new Date().toISOString(),
        sentiment: analyzeSentiment(
          article.title || "",
          article.description || ""
        )
      })
    );

    if (articles.length > 0) {
      newsCache.set(cacheKey, { articles, fetchedAt: Date.now() });
      return articles;
    }

    return mockNews.DEFAULT;
  } catch (error) {
    console.error(
      `[NewsService] Error fetching news for ${symbol}, using mock:`,
      error
    );
    return mockNews.DEFAULT;
  }
}

/**
 * Use Gemini to analyze news sentiment with more context.
 * This provides better sentiment analysis than keyword matching.
 */
export async function analyzeNewsWithGemini(
  articles: NewsArticle[],
  companyName: string
): Promise<NewsArticle[]> {
  if (!env.geminiApiKey || articles.length === 0) {
    return articles;
  }

  const articlesText = articles
    .map((a, i) => `${i + 1}. "${a.title}": ${a.description}`)
    .join("\n");

  const prompt = `
Analyze the sentiment of these news articles about ${companyName}.
For each article, determine if the sentiment is "positive", "negative", or "neutral"
based on the impact on the company's reputation, ESG factors, and financial outlook.

Articles:
${articlesText}

Return ONLY a JSON array with the sentiment for each article in order:
["positive", "negative", "neutral", ...]
`.trim();

  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      { params: { key: env.geminiApiKey } }
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const sentiments = JSON.parse(jsonMatch[0]) as string[];
      return articles.map((article, index) => ({
        ...article,
        sentiment: (sentiments[index] as "positive" | "negative" | "neutral") ||
          article.sentiment
      }));
    }
  } catch (error) {
    console.error("[NewsService] Gemini sentiment analysis failed:", error);
  }

  return articles;
}

