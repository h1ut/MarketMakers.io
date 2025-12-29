## MarketMakers – Impact Investing MVP

MarketMakers is a hackathon MVP that helps people discover companies and ETFs that align with the issues they care about (environment, social impact, racial justice, workplace and gender equality) without ignoring performance.

The app uses a **Node.js + TypeScript** backend and a **React + TypeScript (Vite)** frontend. The backend aggregates:

- **Real-time stock prices** from Alpha Vantage API
- **Real news articles** from News API (or mock data if no API key)
- **AI-powered scoring** using Google Gemini to analyze news sentiment and compute impact scores
- **Historical price data** for interactive charts with multiple time periods

### Key Features

- **Search any company** – Look up any stock symbol and get impact scores
- **Real-time AI scoring** – Gemini analyzes news articles to compute ESG impact scores
- **Historical charts** – View price charts for 1D, 1W, 1M, 6M, 1Y, or 5Y periods
- **Impact preferences** – Filter by Environmental, Social, Gender Equality, Racial Justice, etc.
- **Live prices** – Real stock quotes from Alpha Vantage (with mock fallback)

The frontend renders a dashboard similar to a modern brokerage UI where users:

- Choose an **impact preference**
- **Search any company** by name or symbol
- See **top recommended companies/ETFs** for that preference
- Explore a **portfolio summary card** with live price, impact score, and **interactive chart**
- Select **time periods** (1D to 5Y) for historical price data
- Inspect **score metrics tiles** (Environmental, Labor, Social, Gender, etc.) and the contributing news articles

---

## Project structure

- `backend/` – Node.js + Express + TypeScript API
  - `src/index.ts` – server entrypoint
  - `src/config/env.ts` – environment variable handling
  - `src/types.ts` – shared backend types
  - `src/data/impacts.ts` – impact categories (Broad, Environmental, Social, etc.)
  - `src/data/companies.ts` – curated list of companies/ETFs with baseline scores
  - `src/data/articles.ts` – mock article snippets per company
  - `src/services/stockPriceService.ts` – real-time quotes (with mock fallback)
  - `src/services/scoringService.ts` – heuristic + optional Gemini scoring
  - `src/routes/impacts.ts` – `GET /api/impacts`
  - `src/routes/recommendations.ts` – `GET /api/recommendations?impact=...`
  - `src/routes/company.ts` – `GET /api/company/:symbol`
- `frontend/` – React + TypeScript (Vite-style) SPA
  - `src/App.tsx` – main layout and dashboard
  - `src/api.ts` – typed API client
  - `src/styles.css` – theme (dark background + accent colors)
  - `src/main.tsx` – React entrypoint

---

## Prerequisites

- **Node.js** 18+ (recommended) installed on Windows
- **npm** (comes with Node.js)
- A free **Alpha Vantage** API key (optional but recommended for real quotes)
- A **Gemini API key** (optional, only needed if you want AI-adjusted scores)

---

## Setup – step-by-step commands (PowerShell)

All commands assume your project root is:

`D:\sites\Market Makers`

Run these **one at a time** in PowerShell.

### 1. Install backend dependencies

From the project root:

```powershell
cd "D:\sites\Market Makers"
cd backend
npm install
```

Environment variables (create a `.env` file inside `backend`):

```text
PORT=4000

# Alpha Vantage for stock data (free: 25 requests/day)
# Get free key at: https://www.alphavantage.co/support/#api-key
STOCK_API_KEY=your_alpha_vantage_key_here
STOCK_API_BASE_URL=https://www.alphavantage.co/query

# News API for real company news (free: 100 requests/day)
# Get free key at: https://newsapi.org/register
NEWS_API_KEY=your_news_api_key_here
NEWS_API_BASE_URL=https://newsapi.org/v2

# Google Gemini for AI-powered scoring (optional but recommended)
# Get free key at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_key_here

CORS_ORIGIN=http://localhost:5173
```

**Note:** The app works without any API keys using mock data. Add keys to enable:
- Real stock prices and historical data (Alpha Vantage)
- Real news articles (News API)
- AI-powered impact scoring (Gemini)

Start the backend in dev mode:

```powershell
cd "D:\sites\Market Makers\backend"
npm run dev
```

This will start the API at `http://localhost:4000`.

### 2. Install frontend dependencies

Open another PowerShell window for the frontend:

```powershell
cd "D:\sites\Market Makers"
cd frontend
npm install
```

Optional: create a `.env` file in `frontend` to override the backend URL (defaults to `http://localhost:4000`):

```text
VITE_API_BASE_URL=http://localhost:4000
```

Run the frontend dev server:

```powershell
cd "D:\sites\Market Makers\frontend"
npm run dev
```

Vite will print a URL like `http://localhost:5173` – open that in your browser.

---

## How the scoring works

### 1. Impact preference

The backend exposes impact categories that map directly to the choices in the UI:

- Broad ESG
- Environmental
- Social Impact
- Racial Justice
- Workplace Equality
- Gender Equality

The frontend calls:

- `GET /api/impacts` to list categories
- `GET /api/recommendations?impact=environmental` to pull the top companies/ETFs for that preference
- `GET /api/company/:symbol?impact=...&period=1M` to get full company data with historical prices

### 2. Real News & AI Analysis

The system fetches **real news** about companies and uses **AI to score them**:

1. **News API** fetches recent articles about the company (title, description, source)
2. **Sentiment analysis** – keywords and Gemini analyze if news is positive/negative
3. **Impact scoring** – Gemini (if available) analyzes news to compute scores for:
   - Environmental Impact
   - Labor Practices
   - Social Impact
   - Gender Equality
   - Pay Equality
   - Corporate Governance
   - Short/Long-term Profitability

### 3. Scoring Pipeline

The **AI-powered model** (real computation with Gemini):

1. **Base scores** – Start from sector-based defaults (e.g., Tech companies score higher on innovation)
2. **News fetch** – Get recent news from News API (or mock data if no key)
3. **Gemini analysis** – Send news to Gemini with a prompt asking for ESG scores
4. **Fallback** – If no Gemini key, use keyword-based heuristic scoring
5. **Ranking** – Companies sorted by `overallImpactScore` based on selected impact category

Example Gemini prompt (simplified):
```
Company: Tesla Inc. (TSLA)
Sector: Automotive

Recent news:
1. "Tesla announces new battery recycling program"
2. "Workplace safety concerns raised at Fremont factory"

Analyze THIS SPECIFIC COMPANY based on its actual reputation.
Provide 0-100 scores for: environmental, laborPractices, socialImpact...
```

### Caching & Performance

- **Score caching**: Computed scores are cached for 2 minutes per company+impact combination
- Each company gets unique scores based on Gemini's knowledge of that specific company
- **Clear cache**: `DELETE /api/company/cache?symbol=TSLA` to force recomputation
- Higher temperature (0.7) ensures variation between different companies

---

## Frontend UX mapping

The main dashboard corresponds to your reference design:

- **Header**
  - App name "MarketMakers" with logo
  - **Search bar** – Search any company by name or symbol
- **Top section – Choose impact**
  - `ImpactSelector` UI is implemented inline in `App.tsx`
  - Selecting an impact triggers a reload of recommendations from `/api/recommendations`
- **Middle left – Portfolio summary**
  - Shows name, symbol, sector, live price, and overall impact score
  - **Period selector** (1D, 1W, 1M, 6M, 1Y, 5Y) for historical data
  - **Interactive chart** using real historical price data (SVG-based)
- **Middle right – Top companies list**
  - Uses the recommendations array, sorted by impact score
  - Clicking an item fetches `/api/company/:symbol` and updates the summary + metrics
- **Bottom – Score metrics grid**
  - 8 tiles: Environmental, Labor Practices, Social Impact, Gender Equality, Pay Equality, Corporate Activity Impact, Short Term Profitability, Long Term Profitability
  - Tile colors indicate high / mid / low (70+, 51–69, <50)
  - Below the tiles, related **article snippets** explain why scores look the way they do

The color palette matches the spec:

- Background: `#0B0E11`
- Primary accent: `#F0B90B`
- Surface/cards: `#1E2329`

---

## Extending this MVP

What's already implemented:

- ✅ Real news API integration
- ✅ AI-powered scoring with Gemini
- ✅ Historical price charts with period selection
- ✅ Company search functionality

Ideas you can pitch or build after the hackathon:

- Let users **save a profile** with their default impact preference and watchlist
- Add a simple **paper portfolio** (fake holdings) driven by these recommendations
- Introduce **portfolio optimization** features that balance impact scores vs. risk/return
- Expose more AI explanations: "Why did this company get a 42 on short-term profitability?"
- Add **real-time price updates** with WebSocket connections
- Implement **email alerts** when a company's impact score changes significantly

---

## Quick recap for running the app

1. In one PowerShell window:
   - `cd "D:\sites\Market Makers\backend"`
   - `npm install`
   - Create `.env` with your keys
   - `npm run dev`
2. In another PowerShell window:
   - `cd "D:\sites\Market Makers\frontend"`
   - `npm install`
   - (Optional) create `.env` with `VITE_API_BASE_URL`
   - `npm run dev`
3. Open `http://localhost:5173` and explore impact-driven recommendations.


