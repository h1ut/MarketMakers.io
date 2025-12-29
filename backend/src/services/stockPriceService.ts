import axios from "axios";
import { env } from "../config/env";
import { Quote, HistoricalDataPoint, TimePeriod, CompanyInfo } from "../types";

interface CachedQuote {
  quote: Quote;
  fetchedAt: number;
}

interface CachedHistory {
  data: HistoricalDataPoint[];
  fetchedAt: number;
}

interface CachedCompanyInfo {
  info: CompanyInfo;
  fetchedAt: number;
}

const CACHE_TTL_MS = 60_000; // 1 minute
const HISTORY_CACHE_TTL_MS = 5 * 60_000; // 5 minutes
const INFO_CACHE_TTL_MS = 60 * 60_000; // 1 hour

const quoteCache = new Map<string, CachedQuote>();
const historyCache = new Map<string, CachedHistory>();
const infoCache = new Map<string, CachedCompanyInfo>();

// Generate mock historical data based on current price
function generateMockHistory(
  symbol: string,
  currentPrice: number,
  period: TimePeriod
): HistoricalDataPoint[] {
  const periodDays: Record<TimePeriod, number> = {
    "1D": 1,
    "1W": 7,
    "1M": 30,
    "6M": 180,
    "1Y": 365,
    "5Y": 1825
  };

  const days = periodDays[period];
  const dataPoints: HistoricalDataPoint[] = [];
  const now = new Date();
  
  // Use symbol as seed for consistent data
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) {
    seed = ((seed << 5) - seed) + symbol.charCodeAt(i);
  }
  const random = (n: number) => {
    const x = Math.sin(seed++ + n) * 10000;
    return x - Math.floor(x);
  };

  // Generate data points
  let price = currentPrice * (0.7 + random(0) * 0.4); // Start 70-110% of current
  const trend = (currentPrice - price) / days; // Trend towards current price

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const volatility = 0.02 + random(i * 3) * 0.03;
    const change = price * volatility * (random(i * 2) - 0.5);
    price += trend + change;
    price = Math.max(price, 1);

    const open = price * (1 + (random(i * 4) - 0.5) * 0.01);
    const high = Math.max(open, price) * (1 + random(i * 5) * 0.02);
    const low = Math.min(open, price) * (1 - random(i * 6) * 0.02);

    dataPoints.push({
      date: date.toISOString().split("T")[0],
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(price.toFixed(2)),
      volume: Math.floor(1000000 + random(i * 7) * 10000000)
    });
  }

  return dataPoints;
}

// Mock company info
const mockCompanyInfo: Record<string, CompanyInfo> = {
  GOOG: {
    symbol: "GOOG",
    name: "Alphabet Inc.",
    description: "Parent company of Google, specializing in Internet-related services and products.",
    sector: "Technology",
    industry: "Internet Content & Information",
    logo: "🔍",
    marketCap: 2100000000000,
    peRatio: 25.4
  },
  TSLA: {
    symbol: "TSLA",
    name: "Tesla Inc.",
    description: "Electric vehicle and clean energy company.",
    sector: "Automotive",
    industry: "Auto Manufacturers",
    logo: "⚡",
    marketCap: 700000000000,
    peRatio: 62.8
  },
  MSFT: {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    description: "Technology corporation that develops and supports software, services, devices, and solutions.",
    sector: "Technology",
    industry: "Software—Infrastructure",
    logo: "🪟",
    marketCap: 3000000000000,
    peRatio: 35.2
  },
  AAPL: {
    symbol: "AAPL",
    name: "Apple Inc.",
    description: "Consumer electronics, software and services company.",
    sector: "Technology",
    industry: "Consumer Electronics",
    logo: "🍎",
    marketCap: 2800000000000,
    peRatio: 28.9
  },
  NVDA: {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    description: "Technology company that designs graphics processing units and system-on-chip units.",
    sector: "Technology",
    industry: "Semiconductors",
    logo: "💚",
    marketCap: 3200000000000,
    peRatio: 65.3
  }
};

const mockPrices: Record<string, number> = {
  GOOG: 178.35,
  TSLA: 248.50,
  MSFT: 425.22,
  AAPL: 195.89,
  NVDA: 140.14,
  SHE: 85.14,
  NACP: 32.85,
  ESGU: 112.47,
  ICLN: 14.23,
  SUSA: 89.45,
  ESGV: 82.33
};

/**
 * Fetch the latest quote for a given symbol.
 * Uses Alpha Vantage's GLOBAL_QUOTE endpoint when an API key is configured;
 * otherwise falls back to static mock data so the MVP still works offline.
 */
export async function getQuote(symbol: string): Promise<Quote | null> {
  const upperSymbol = symbol.toUpperCase();

  const cached = quoteCache.get(upperSymbol);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.quote;
  }

  // Generate mock quote based on mock price
  const mockPrice = mockPrices[upperSymbol];
  const generateMockQuote = (price: number): Quote => ({
    symbol: upperSymbol,
    price,
    currency: "USD",
    changePercent: (Math.random() - 0.5) * 4, // -2% to +2%
    lastUpdated: new Date().toISOString()
  });

  if (!env.stockApiKey) {
    if (mockPrice) {
      return generateMockQuote(mockPrice);
    }
    // For unknown symbols, generate a random price
    return generateMockQuote(50 + Math.random() * 200);
  }

  try {
    const response = await axios.get(env.stockApiBaseUrl, {
      params: {
        function: "GLOBAL_QUOTE",
        symbol: upperSymbol,
        apikey: env.stockApiKey
      }
    });

    const raw = response.data?.["Global Quote"];
    if (!raw || !raw["05. price"]) {
      console.log(`[StockService] No data for ${upperSymbol}, using mock`);
      return generateMockQuote(mockPrice || 100);
    }

    const price = Number(raw["05. price"]);
    const changePercentRaw = raw["10. change percent"] as string | undefined;
    const changePercent = changePercentRaw
      ? Number(changePercentRaw.replace("%", ""))
      : 0;

    const quote: Quote = {
      symbol: upperSymbol,
      price: Number.isFinite(price) ? price : mockPrice || 100,
      currency: "USD",
      changePercent: Number.isFinite(changePercent) ? changePercent : 0,
      lastUpdated: new Date().toISOString()
    };

    quoteCache.set(upperSymbol, { quote, fetchedAt: Date.now() });
    return quote;
  } catch (error) {
    console.error(`[StockService] Error fetching quote for ${upperSymbol}:`, error);
    return generateMockQuote(mockPrice || 100);
  }
}

/**
 * Fetch historical price data for a symbol.
 * Uses Alpha Vantage TIME_SERIES_DAILY_ADJUSTED or falls back to mock data.
 */
export async function getHistoricalData(
  symbol: string,
  period: TimePeriod
): Promise<HistoricalDataPoint[]> {
  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `${upperSymbol}-${period}`;

  const cached = historyCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < HISTORY_CACHE_TTL_MS) {
    return cached.data;
  }

  const currentQuote = await getQuote(upperSymbol);
  const currentPrice = currentQuote?.price || 100;

  if (!env.stockApiKey) {
    console.log(`[StockService] No API key, generating mock history for ${upperSymbol}`);
    return generateMockHistory(upperSymbol, currentPrice, period);
  }

  try {
    // Use appropriate function based on period
    const isLongTerm = ["1Y", "5Y"].includes(period);
    const functionName = isLongTerm
      ? "TIME_SERIES_WEEKLY_ADJUSTED"
      : "TIME_SERIES_DAILY_ADJUSTED";
    const outputSize = period === "5Y" ? "full" : "compact";

    const response = await axios.get(env.stockApiBaseUrl, {
      params: {
        function: functionName,
        symbol: upperSymbol,
        outputsize: outputSize,
        apikey: env.stockApiKey
      }
    });

    const timeSeriesKey = isLongTerm
      ? "Weekly Adjusted Time Series"
      : "Time Series (Daily)";
    const timeSeries = response.data?.[timeSeriesKey];

    if (!timeSeries) {
      console.log(`[StockService] No historical data for ${upperSymbol}, using mock`);
      return generateMockHistory(upperSymbol, currentPrice, period);
    }

    // Parse and filter based on period
    const periodDays: Record<TimePeriod, number> = {
      "1D": 1,
      "1W": 7,
      "1M": 30,
      "6M": 180,
      "1Y": 365,
      "5Y": 1825
    };

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays[period]);

    const dataPoints: HistoricalDataPoint[] = Object.entries(timeSeries)
      .filter(([date]) => new Date(date) >= cutoffDate)
      .map(([date, values]: [string, Record<string, string>]) => ({
        date,
        open: Number(values["1. open"]),
        high: Number(values["2. high"]),
        low: Number(values["3. low"]),
        close: Number(values["4. close"]),
        volume: Number(values["6. volume"] || values["5. volume"])
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (dataPoints.length > 0) {
      historyCache.set(cacheKey, { data: dataPoints, fetchedAt: Date.now() });
      return dataPoints;
    }

    return generateMockHistory(upperSymbol, currentPrice, period);
  } catch (error) {
    console.error(`[StockService] Error fetching history for ${upperSymbol}:`, error);
    return generateMockHistory(upperSymbol, currentPrice, period);
  }
}

/**
 * Fetch company overview/info from Alpha Vantage.
 */
export async function getCompanyInfo(symbol: string): Promise<CompanyInfo | null> {
  const upperSymbol = symbol.toUpperCase();

  const cached = infoCache.get(upperSymbol);
  if (cached && Date.now() - cached.fetchedAt < INFO_CACHE_TTL_MS) {
    return cached.info;
  }

  // Check mock data first
  const mockInfo = mockCompanyInfo[upperSymbol];

  if (!env.stockApiKey) {
    if (mockInfo) return mockInfo;
    // Return basic info for unknown symbols
    return {
      symbol: upperSymbol,
      name: upperSymbol,
      description: `Stock symbol ${upperSymbol}`,
      sector: "Unknown",
      industry: "Unknown"
    };
  }

  try {
    const response = await axios.get(env.stockApiBaseUrl, {
      params: {
        function: "OVERVIEW",
        symbol: upperSymbol,
        apikey: env.stockApiKey
      }
    });

    const data = response.data;
    if (!data || !data.Symbol) {
      console.log(`[StockService] No company info for ${upperSymbol}, using mock`);
      return mockInfo || {
        symbol: upperSymbol,
        name: upperSymbol,
        description: `Stock symbol ${upperSymbol}`,
        sector: "Unknown",
        industry: "Unknown"
      };
    }

    const info: CompanyInfo = {
      symbol: data.Symbol,
      name: data.Name || upperSymbol,
      description: data.Description || "",
      sector: data.Sector || "Unknown",
      industry: data.Industry || "Unknown",
      logo: mockCompanyInfo[upperSymbol]?.logo,
      marketCap: data.MarketCapitalization ? Number(data.MarketCapitalization) : undefined,
      peRatio: data.PERatio ? Number(data.PERatio) : undefined,
      dividendYield: data.DividendYield ? Number(data.DividendYield) : undefined
    };

    infoCache.set(upperSymbol, { info, fetchedAt: Date.now() });
    return info;
  } catch (error) {
    console.error(`[StockService] Error fetching info for ${upperSymbol}:`, error);
    return mockInfo || {
      symbol: upperSymbol,
      name: upperSymbol,
      description: `Stock symbol ${upperSymbol}`,
      sector: "Unknown",
      industry: "Unknown"
    };
  }
}

/**
 * Search for companies by query string.
 */
export async function searchCompanies(
  query: string
): Promise<{ symbol: string; name: string }[]> {
  if (!env.stockApiKey) {
    // Return mock results based on query
    const allMock = Object.entries(mockCompanyInfo).map(([symbol, info]) => ({
      symbol,
      name: info.name
    }));
    const q = query.toLowerCase();
    return allMock.filter(
      (c) =>
        c.symbol.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
    );
  }

  try {
    const response = await axios.get(env.stockApiBaseUrl, {
      params: {
        function: "SYMBOL_SEARCH",
        keywords: query,
        apikey: env.stockApiKey
      }
    });

    const matches = response.data?.bestMatches || [];
    return matches.slice(0, 10).map(
      (m: { "1. symbol": string; "2. name": string }) => ({
        symbol: m["1. symbol"],
        name: m["2. name"]
      })
    );
  } catch (error) {
    console.error(`[StockService] Error searching for ${query}:`, error);
    return [];
  }
}


