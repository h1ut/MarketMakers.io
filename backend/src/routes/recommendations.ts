import { Router } from "express";
import { companies } from "../data/companies";
import { getQuote, getCompanyInfo } from "../services/stockPriceService";
import { computeImpactScores } from "../services/scoringService";
import { ImpactCategoryId, CompanyScores, Company } from "../types";

export const recommendationsRouter = Router();

const DEFAULT_IMPACT: ImpactCategoryId = "broad";

// Popular stocks for dynamic recommendations
const POPULAR_SYMBOLS = [
  "AAPL", "MSFT", "GOOG", "AMZN", "TSLA", "NVDA", "META", "JPM",
  "V", "JNJ", "WMT", "PG", "UNH", "HD", "DIS", "NFLX", "PYPL",
  "ADBE", "CRM", "INTC", "AMD", "CSCO", "PEP", "KO"
];

// ESG-focused ETFs and companies by category
const CATEGORY_SYMBOLS: Record<ImpactCategoryId, string[]> = {
  broad: ["ESGU", "ESGV", "SUSA", "SUSL", "USSG"],
  environmental: ["ICLN", "QCLN", "TAN", "FAN", "PBW", "TSLA"],
  social: ["NACP", "WOMN", "SDGA", "KRMA", "EQLT"],
  genderEquality: ["SHE", "WOMN", "EQUL"],
  racialJustice: ["NACP", "EQLT", "SDGA"],
  workplaceEquality: ["SHE", "EQUL", "WOMN", "JUST"]
};

recommendationsRouter.get("/", async (req, res) => {
  const impact = (req.query.impact as ImpactCategoryId) || DEFAULT_IMPACT;
  const limit = Number(req.query.limit ?? 8);
  const useRealData = req.query.real === "true";

  try {
    let results: CompanyScores[];

    if (useRealData) {
      // Use real API data for dynamic companies
      const symbols = [
        ...(CATEGORY_SYMBOLS[impact] || []),
        ...POPULAR_SYMBOLS.slice(0, 10)
      ].slice(0, limit + 5);

      const companyPromises = symbols.map(async (symbol) => {
        try {
          const [info, quote] = await Promise.all([
            getCompanyInfo(symbol),
            getQuote(symbol)
          ]);

          if (!info) return null;

          const scoring = await computeImpactScores(info, impact);

          const company: Company = {
            id: info.symbol.toLowerCase(),
            symbol: info.symbol,
            name: info.name,
            description: info.description,
            sector: info.sector,
            logo: info.logo,
            impactCategories: ["broad"],
            baseScores: {}
          };

          return {
            company,
            quote,
            scores: scoring.scores,
            overallImpactScore: scoring.overallImpactScore
          };
        } catch (err) {
          console.error(`[Recommendations] Error processing ${symbol}:`, err);
          return null;
        }
      });

      const rawResults = await Promise.all(companyPromises);
      results = rawResults.filter((r): r is CompanyScores => r !== null);
    } else {
      // Use static company list (faster, no API calls)
      const matchingCompanies = companies.filter((c) =>
        impact === "broad" ? true : c.impactCategories.includes(impact)
      );

      results = await Promise.all(
        matchingCompanies.map(async (company) => {
          const [quote, scoring] = await Promise.all([
            getQuote(company.symbol),
            computeImpactScores(
              {
                symbol: company.symbol,
                name: company.name,
                description: company.description,
                sector: company.sector,
                industry: company.sector,
                logo: company.logo
              },
              impact
            )
          ]);

          return {
            company,
            quote,
            scores: scoring.scores,
            overallImpactScore: scoring.overallImpactScore
          };
        })
      );
    }

    // Sort by impact score (highest first)
    results.sort((a, b) => b.overallImpactScore - a.overallImpactScore);

    res.json(results.slice(0, limit));
  } catch (error) {
    console.error("[Recommendations] Error:", error);
    res.status(500).json({ error: "Failed to load recommendations" });
  }
});


