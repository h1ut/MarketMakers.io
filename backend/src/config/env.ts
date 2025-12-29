import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  // Alpha Vantage for stock data (free: 25 requests/day)
  stockApiKey: process.env.STOCK_API_KEY ?? "",
  stockApiBaseUrl:
    process.env.STOCK_API_BASE_URL ?? "https://www.alphavantage.co/query",
  // News API for company news (free: 100 requests/day)
  newsApiKey: process.env.NEWS_API_KEY ?? "",
  newsApiBaseUrl:
    process.env.NEWS_API_BASE_URL ?? "https://newsapi.org/v2",
  // Gemini for AI scoring
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  corsOrigin: process.env.CORS_ORIGIN ?? "*"
};


