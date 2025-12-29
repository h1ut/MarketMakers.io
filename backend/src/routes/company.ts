import { Router } from "express";
import {
  getQuote,
  getCompanyInfo,
  getHistoricalData,
  searchCompanies
} from "../services/stockPriceService";
import { computeImpactScores, clearScoreCache } from "../services/scoringService";
import { ImpactCategoryId, TimePeriod } from "../types";

export const companyRouter = Router();

// Clear score cache (useful for testing)
companyRouter.delete("/cache", (req, res) => {
  const symbol = req.query.symbol as string | undefined;
  clearScoreCache(symbol);
  res.json({ 
    success: true, 
    message: symbol 
      ? `Cache cleared for ${symbol}` 
      : "Entire score cache cleared" 
  });
});

// Search companies by name/symbol
companyRouter.get("/search", async (req, res) => {
  const query = String(req.query.q || "");
  if (query.length < 1) {
    res.json([]);
    return;
  }

  try {
    const results = await searchCompanies(query);
    res.json(results);
  } catch (error) {
    console.error("[CompanyRoute] Search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

// Get company details with scores and historical data
companyRouter.get("/:symbol", async (req, res) => {
  const symbol = String(req.params.symbol).toUpperCase();
  const impactFromQuery = req.query.impact as string | undefined;
  const periodFromQuery = req.query.period as string | undefined;

  const impact: ImpactCategoryId =
    impactFromQuery && impactFromQuery.length > 0
      ? (impactFromQuery as ImpactCategoryId)
      : "broad";

  const period: TimePeriod =
    periodFromQuery && ["1D", "1W", "1M", "6M", "1Y", "5Y"].includes(periodFromQuery)
      ? (periodFromQuery as TimePeriod)
      : "1M";

  try {
    // Fetch company info
    const companyInfo = await getCompanyInfo(symbol);
    if (!companyInfo) {
      res.status(404).json({ error: "Company not found" });
      return;
    }

    // Fetch all data in parallel
    const [quote, historicalData, scoringResult] = await Promise.all([
      getQuote(symbol),
      getHistoricalData(symbol, period),
      computeImpactScores(companyInfo, impact)
    ]);

    res.json({
      company: {
        id: companyInfo.symbol.toLowerCase(),
        symbol: companyInfo.symbol,
        name: companyInfo.name,
        description: companyInfo.description,
        sector: companyInfo.sector,
        logo: companyInfo.logo,
        impactCategories: ["broad"] as ImpactCategoryId[],
        baseScores: {}
      },
      info: companyInfo,
      quote,
      scores: scoringResult.scores,
      overallImpactScore: scoringResult.overallImpactScore,
      impactCategoryUsed: impact,
      articles: scoringResult.news.map((n) => ({
        id: n.id,
        companyId: symbol.toLowerCase(),
        title: n.title,
        summary: n.description,
        url: n.url,
        sentiment: n.sentiment === "neutral" ? "positive" : n.sentiment,
        impactTags: [],
        source: n.source,
        publishedAt: n.publishedAt
      })),
      historicalData,
      period
    });
  } catch (error) {
    console.error("[CompanyRoute] Error fetching company details:", error);
    res.status(500).json({ error: "Failed to load company details" });
  }
});

// Get only historical data for a symbol
companyRouter.get("/:symbol/history", async (req, res) => {
  const symbol = String(req.params.symbol).toUpperCase();
  const periodFromQuery = req.query.period as string | undefined;

  const period: TimePeriod =
    periodFromQuery && ["1D", "1W", "1M", "6M", "1Y", "5Y"].includes(periodFromQuery)
      ? (periodFromQuery as TimePeriod)
      : "1M";

  try {
    const data = await getHistoricalData(symbol, period);
    res.json({ symbol, period, data });
  } catch (error) {
    console.error("[CompanyRoute] Error fetching history:", error);
    res.status(500).json({ error: "Failed to load historical data" });
  }
});


