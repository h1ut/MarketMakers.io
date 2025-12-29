import { useEffect, useMemo, useState, useCallback } from "react";
import {
  CompanyDetailResponse,
  CompanyScores,
  HistoricalDataPoint,
  ImpactCategory,
  ImpactCategoryId,
  ImpactKey,
  ImpactScores,
  TimePeriod,
  SearchResult,
  fetchCompanyDetail,
  fetchHistoricalData,
  fetchImpactCategories,
  fetchRecommendations,
  searchCompanies
} from "./api";
import logoImg from "./medium.png";

type LoadingState = "idle" | "loading" | "error";

const IMPACT_LABELS: Record<ImpactKey, { label: string; sub: string }> = {
  environmental: { label: "Environmental Impact", sub: "Climate & emissions" },
  laborPractices: { label: "Labor Practices", sub: "Workers & safety" },
  socialImpact: { label: "Social Impact", sub: "Communities & data" },
  genderEquality: { label: "Gender Equality", sub: "Representation & bias" },
  payEquality: { label: "Pay Equality", sub: "Pay gaps & fairness" },
  corporateImpact: { label: "Corporate Activity Impact", sub: "Governance" },
  shortTermProfitability: {
    label: "Short Term Profitability",
    sub: "Current performance"
  },
  longTermProfitability: {
    label: "Long Term Profitability",
    sub: "Durability & moat"
  }
};

const IMPACT_ORDER: ImpactKey[] = [
  "environmental",
  "laborPractices",
  "socialImpact",
  "genderEquality",
  "payEquality",
  "corporateImpact",
  "shortTermProfitability",
  "longTermProfitability"
];

const TIME_PERIODS: { id: TimePeriod; label: string }[] = [
  { id: "1D", label: "1D" },
  { id: "1W", label: "1W" },
  { id: "1M", label: "1M" },
  { id: "6M", label: "6M" },
  { id: "1Y", label: "1Y" },
  { id: "5Y", label: "5Y" }
];

function formatPrice(quote: CompanyDetailResponse["quote"] | null): string {
  if (!quote) return "—";
  return `$${quote.price.toFixed(2)}`;
}

function formatChange(quote: CompanyDetailResponse["quote"] | null): {
  text: string;
  positive: boolean;
  negative: boolean;
} {
  if (!quote) return { text: "—", positive: false, negative: false };
  const value = quote.changePercent;
  const text = `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  return { text, positive: value >= 0, negative: value < 0 };
}

function classifyMetric(score: number): "high" | "mid" | "low" {
  if (score >= 70) return "high";
  if (score >= 50) return "mid";
  return "low";
}

// Generate chart path from historical data
function generateChartPathFromData(data: HistoricalDataPoint[]): string {
  if (!data || data.length === 0) return "";
  
  const width = 600;
  const height = 200;
  const padding = 10;
  
  const prices = data.map((d) => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;
  
  let pathData = "";
  
  data.forEach((point, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((point.close - minPrice) / priceRange) * (height - 2 * padding);
    
    if (i === 0) {
      pathData = `M ${x} ${y}`;
    } else {
      pathData += ` L ${x} ${y}`;
    }
  });
  
  return pathData;
}

// Fallback chart generator when no historical data
function generateFallbackChartPath(symbol: string, changePercent: number): string {
  const points = 50;
  const width = 600;
  const height = 200;
  
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) {
    seed = ((seed << 5) - seed) + symbol.charCodeAt(i);
    seed |= 0;
  }
  
  const random = (n: number) => {
    const x = Math.sin(seed++ + n) * 10000;
    return x - Math.floor(x);
  };
  
  const trend = changePercent > 0 ? 1 : -1;
  const volatility = Math.abs(changePercent) / 2 + 1;
  
  let pathData = `M 0 ${height / 2}`;
  let currentY = height / 2;
  
  for (let i = 1; i < points; i++) {
    const x = (i / (points - 1)) * width;
    const trendEffect = (i / points) * trend * 60;
    const noise = (random(i) - 0.5) * volatility * 40;
    currentY = (height / 2) - trendEffect + noise;
    currentY = Math.max(10, Math.min(height - 10, currentY));
    pathData += ` L ${x} ${currentY}`;
  }
  
  return pathData;
}

export function App() {
  const [impactCategories, setImpactCategories] = useState<ImpactCategory[]>([]);
  const [selectedImpact, setSelectedImpact] =
    useState<ImpactCategoryId>("broad");
  const [recommendations, setRecommendations] = useState<CompanyScores[]>([]);
  const [selectedCompany, setSelectedCompany] =
    useState<CompanyDetailResponse | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("1M");
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [loadingRecommendations, setLoadingRecommendations] =
    useState<LoadingState>("idle");
  const [loadingCompany, setLoadingCompany] = useState<LoadingState>("idle");
  const [loadingChart, setLoadingChart] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchImpactCategories()
      .then(setImpactCategories)
      .catch(() => {
        setErrorMessage("Failed to load impact categories.");
      });
  }, []);

  useEffect(() => {
    setLoadingRecommendations("loading");
    setErrorMessage(null);

    fetchRecommendations(selectedImpact)
      .then((data) => {
        setRecommendations(data);
        setLoadingRecommendations("idle");

        if (data.length > 0) {
          const top = data[0];
          handleSelectCompany(top.company.symbol, selectedImpact, selectedPeriod);
        } else {
          setSelectedCompany(null);
        }
      })
      .catch(() => {
        setLoadingRecommendations("error");
        setErrorMessage("Failed to load recommendations.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImpact]);

  // Handle period change - fetch new historical data
  const handlePeriodChange = useCallback(
    async (period: TimePeriod) => {
      setSelectedPeriod(period);
      if (!selectedCompany) return;

      setLoadingChart(true);
      try {
        const result = await fetchHistoricalData(
          selectedCompany.company.symbol,
          period
        );
        setHistoricalData(result.data);
      } catch (err) {
        console.error("Failed to fetch historical data:", err);
      } finally {
        setLoadingChart(false);
      }
    },
    [selectedCompany]
  );

  // Search handler with debounce
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await searchCompanies(searchQuery);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (err) {
        console.error("Search failed:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  function handleSelectCompany(
    symbol: string,
    impactForCompany: ImpactCategoryId,
    period: TimePeriod = selectedPeriod
  ) {
    setLoadingCompany("loading");
    setShowSearchResults(false);
    setSearchQuery("");
    
    fetchCompanyDetail(symbol, impactForCompany, period)
      .then((detail) => {
        setSelectedCompany(detail);
        setHistoricalData(detail.historicalData || []);
        setLoadingCompany("idle");
      })
      .catch(() => {
        setLoadingCompany("error");
        setErrorMessage("Failed to load company details.");
      });
  }

  function handleSearchSelect(result: SearchResult) {
    handleSelectCompany(result.symbol, selectedImpact, selectedPeriod);
  }

  const selectedScores: ImpactScores | null = useMemo(() => {
    if (!selectedCompany) return null;
    return selectedCompany.scores;
  }, [selectedCompany]);

  const currentImpactLabel = useMemo(
    () =>
      impactCategories.find((c) => c.id === selectedImpact) ??
      ({
        id: selectedImpact,
        name: "Impact",
        description: ""
      } as ImpactCategory),
    [impactCategories, selectedImpact]
  );

  // Generate chart path from historical data or fallback
  const chartPath = useMemo(() => {
    if (historicalData.length > 0) {
      return generateChartPathFromData(historicalData);
    }
    if (selectedCompany) {
      return generateFallbackChartPath(
        selectedCompany.company.symbol,
        selectedCompany.quote?.changePercent ?? 0
      );
    }
    return "";
  }, [historicalData, selectedCompany]);

  return (
    <div className="app-root">
      <div className="app-shell">
        <header className="app-header">
          <div>
            <div className="badge">Impact-first investing, MVP</div>
            <h1 className="app-title">
              <img src={logoImg} alt="MarketMakers logo" className="app-logo-img" />
              MarketMakers
            </h1>
            <div className="app-subtitle">
              Choose what you care about most and discover companies that align
              with your values.
            </div>
          </div>
          
          {/* Search bar */}
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search any company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
            />
            {showSearchResults && searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((result) => (
                  <button
                    key={result.symbol}
                    className="search-result-item"
                    onClick={() => handleSearchSelect(result)}
                  >
                    <span className="search-result-symbol">{result.symbol}</span>
                    <span className="search-result-name">{result.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <section className="card">
          <div className="card-header">
            <div>
              <div className="card-title">1. Choose impact preference</div>
              <div className="card-subtitle">
                What impact do you want your portfolio to prioritize?
              </div>
            </div>
          </div>
          <div className="impact-selector">
            {impactCategories.map((impact) => (
              <button
                key={impact.id}
                className={
                  "impact-chip" +
                  (impact.id === selectedImpact ? " active" : "")
                }
                onClick={() => setSelectedImpact(impact.id)}
              >
                {impact.name}
              </button>
            ))}
          </div>
        </section>

        <main className="layout-main">
          <section className="card portfolio-grid">
            <div className="card-header">
              <div>
                <div className="card-title">2. Portfolio summary</div>
                <div className="card-subtitle">
                  Top company for your {currentImpactLabel.name.toLowerCase()}{" "}
                  preference.
                </div>
              </div>
              <span className="pill">
                Live prices + AI-driven impact scoring (demo)
              </span>
            </div>

            <div>
              <div className="company-meta">
                <div>
                  <div className="company-name">
                    {selectedCompany?.company.name ?? "Select a company"}
                  </div>
                  {selectedCompany && (
                    <div className="company-symbol">
                      {selectedCompany.company.symbol} ·{" "}
                      {selectedCompany.company.sector}
                    </div>
                  )}
                </div>
                {selectedCompany && (
                  <div className="pill">
                    Impact score: {selectedCompany.overallImpactScore}
                  </div>
                )}
              </div>
              <div className="price-row">
                <div className="price-value">
                  {formatPrice(selectedCompany?.quote ?? null)}
                </div>
                <div
                  className={
                    "price-change " +
                    (formatChange(selectedCompany?.quote ?? null).positive
                      ? "good"
                      : formatChange(selectedCompany?.quote ?? null).negative
                      ? "bad"
                      : "")
                  }
                >
                  {formatChange(selectedCompany?.quote ?? null).text}
                </div>
              </div>

              {selectedCompany && (
                <div className="chart-container">
                  {/* Period selector */}
                  <div className="period-selector">
                    {TIME_PERIODS.map((p) => (
                      <button
                        key={p.id}
                        className={
                          "period-btn" + (selectedPeriod === p.id ? " active" : "")
                        }
                        onClick={() => handlePeriodChange(p.id)}
                        disabled={loadingChart}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  
                  <div className="chart-placeholder">
                    {loadingChart ? (
                      <div className="chart-loading">Loading chart...</div>
                    ) : (
                      <svg
                        width="100%"
                        height="200"
                        viewBox="0 0 600 200"
                        preserveAspectRatio="none"
                        style={{ display: "block" }}
                      >
                        <defs>
                          <linearGradient
                            id="chartGradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                          >
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                          </linearGradient>
                        </defs>
                        <path
                          d={chartPath}
                          fill="none"
                          stroke="url(#chartGradient)"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                    <div className="chart-badge">
                      <span className="chart-dot" />
                      <span>
                        {historicalData.length > 0
                          ? `${selectedPeriod} • ${historicalData.length} points`
                          : "Demo chart"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  3. Top companies in "{currentImpactLabel.name}"
                </div>
                <div className="card-subtitle">
                  Sorted by impact score and short-term performance.
                </div>
              </div>
            </div>

            {loadingRecommendations === "loading" && (
              <div className="card-subtitle">Loading recommendations…</div>
            )}

            {loadingRecommendations === "error" && (
              <div className="card-subtitle">
                Something went wrong fetching recommendations.
              </div>
            )}

            {loadingRecommendations === "idle" && (
              <div className="top-list">
                {recommendations.map((item) => {
                  const isActive =
                    selectedCompany?.company.symbol === item.company.symbol;
                  return (
                    <button
                      key={item.company.id}
                      className={
                        "top-item" + (isActive ? " active" : "")
                      }
                      onClick={() =>
                        handleSelectCompany(
                          item.company.symbol,
                          selectedImpact
                        )
                      }
                    >
                      {item.company.logo && (
                        <div className="top-item-logo">{item.company.logo}</div>
                      )}
                      <div>
                        <div className="top-item-title">
                          {item.company.name}
                        </div>
                        <div className="top-item-symbol">
                          {item.company.symbol} ·{" "}
                          {item.company.sector}
                        </div>
                      </div>
                      <div className="top-item-price">
                        {item.quote
                          ? `$${item.quote.price.toFixed(2)}`
                          : "—"}
                      </div>
                      <div className="top-item-score">
                        {item.overallImpactScore}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>
        </main>

        <section className="layout-bottom card">
          <div className="card-header">
            <div>
              <div className="card-title">4. Score metrics</div>
              <div className="card-subtitle">
                We aggregate article data and financial signals to estimate the
                impact of this company across key metrics.
              </div>
            </div>
          </div>

          <div className="metrics-grid">
            {IMPACT_ORDER.map((key) => {
              const score = selectedScores?.[key] ?? 0;
              const bucket = classifyMetric(score);
              const classes =
                "metric-tile " +
                (bucket === "high"
                  ? "metric-high"
                  : bucket === "mid"
                  ? "metric-mid"
                  : "metric-low");
              return (
                <div key={key} className={classes}>
                  <div className="metric-score">{score}</div>
                  <div className="metric-label">
                    {IMPACT_LABELS[key].label}
                  </div>
                  <div className="metric-sub">{IMPACT_LABELS[key].sub}</div>
                </div>
              );
            })}
          </div>

          <div className="legend">
            <span className="legend-dot high" /> 70+ high impact
            <span className="legend-dot mid" /> 51–69 mixed impact
            <span className="legend-dot low" /> 50 and below low impact
          </div>

          {selectedCompany && selectedCompany.articles.length > 0 && (
            <div className="articles-list">
              {selectedCompany.articles.map((article) => (
                <div key={article.id} className="article-item">
                  <div className="article-title">{article.title}</div>
                  <div>{article.summary}</div>
                  <div className="article-meta">
                    <span
                      className={
                        article.sentiment === "positive"
                          ? "article-sentiment-positive"
                          : "article-sentiment-negative"
                      }
                    >
                      {article.sentiment === "positive"
                        ? "Positive"
                        : "Negative"}{" "}
                      signal
                    </span>
                    {article.url && (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noreferrer"
                        className="card-subtitle"
                      >
                        View source
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="footer-note">
            This is a demo. It uses a small curated dataset, a rules-based
            scoring model, and optionally Gemini to refine scores. It is not
            investment advice.
          </div>
          {errorMessage && (
            <div className="footer-note">Error: {errorMessage}</div>
          )}
        </section>
      </div>
    </div>
  );
}


