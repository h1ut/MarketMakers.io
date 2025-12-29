# MarketMakers - Impact Investing Platform

## 💡 Inspiration

The world is changing, and investors want their money to reflect their values. But finding companies that align with environmental, social, and governance (ESG) goals while maintaining strong returns is incredibly difficult. Traditional ESG data is expensive, outdated, and hard to interpret for retail investors.

**We asked ourselves:** What if we could democratize impact investing by using AI to analyze real-time news and provide instant ESG scores for any company?

MarketMakers was born from this vision - to help anyone invest in companies that align with the causes they care about, without sacrificing performance goals.

## 🎯 What it does

MarketMakers is an AI-powered impact investing platform that helps users discover and evaluate companies based on ESG factors:

- **Choose Your Impact** - Select what matters most: Environmental, Social Justice, Gender Equality, Workplace Equality, or Broad ESG
- **AI-Powered Scoring** - Google Gemini analyzes real news articles and company data to compute 8 different impact scores (0-100 scale)
- **Real-Time Data** - Live stock prices, historical charts (1D to 5Y), and current news from major sources
- **Universal Search** - Search any publicly traded company and get instant impact analysis
- **Smart Recommendations** - See top-rated companies for your chosen impact category

### Core Features:
✅ Real-time stock prices via Alpha Vantage API  
✅ AI sentiment analysis of news articles (News API)  
✅ Gemini-powered ESG scoring based on company reputation and news  
✅ Interactive historical price charts with period selection  
✅ 8 impact dimensions: Environmental, Labor Practices, Social Impact, Gender Equality, Pay Equality, Corporate Governance, Short/Long-term Profitability  
✅ Company search across all public stocks  

## 🏗️ How we built it

### Architecture

**Frontend** (React + TypeScript + Vite)
- Single-page application with modern dark UI
- SVG-based historical charts generated from real price data
- Responsive design with smooth animations
- Real-time search with debouncing

**Backend** (Node.js + Express + TypeScript)
- RESTful API with intelligent caching (2-min TTL)
- Three-layer scoring system:
  1. **Sector baseline scores** - Industry-specific starting points
  2. **News analysis** - Keyword-based sentiment detection
  3. **Gemini AI refinement** - Comprehensive ESG analysis

### AI Scoring Pipeline

```
User Searches Company → Fetch Company Data (Alpha Vantage)
                      ↓
                Fetch Recent News (News API)
                      ↓
                Analyze Sentiment (Gemini AI)
                      ↓
             Generate ESG Scores (Gemini AI)
                      ↓
           Rank by Impact Category → Display Results
```

### Smart Prompting Strategy

We engineered Gemini prompts to:
- Emphasize **company-specific** analysis (not generic sector scores)
- Consider actual reputation and controversies
- Balance news sentiment with historical knowledge
- Use temperature=0.7 for variation between companies
- Return structured JSON for consistent parsing

## 🚀 Challenges we ran

### Challenge 1: Making Scores Truly Unique
**Problem:** Early iterations gave similar scores to all companies in the same sector.  
**Solution:** Enhanced Gemini prompt to explicitly request company-specific analysis, increased temperature, and added reputation questions.

### Challenge 2: API Rate Limits
**Problem:** Free APIs have strict rate limits (Alpha Vantage: 25/day, News API: 100/day).  
**Solution:** Implemented intelligent caching system, mock data fallbacks, and batched requests.

### Challenge 3: Real-time Chart Performance
**Problem:** Heavy charting libraries (Chart.js, Recharts) were overkill and slowed initial load.  
**Solution:** Built custom SVG path generator from historical data points - lightweight and fast.

### Challenge 4: Gemini Response Consistency
**Problem:** Gemini sometimes returned text with markdown instead of pure JSON.  
**Solution:** Added regex parsing (`/\{[\s\S]*\}/`) to extract JSON from any response format.

### Challenge 5: Windows Path Issues
**Problem:** Spaces in project path (`Market Makers`) broke PowerShell commands.  
**Solution:** Consistent use of quoted paths and individual command steps in README.

## 📚 What we learned

### Technical Skills
- **AI Prompt Engineering** - Crafting prompts that produce consistent, high-quality structured outputs
- **API Integration** - Combining multiple external APIs (Alpha Vantage, News API, Gemini) with graceful degradation
- **TypeScript Best Practices** - Full type safety across frontend/backend boundary
- **Caching Strategies** - Balancing freshness vs. API quota management
- **SVG Path Manipulation** - Generating dynamic visualizations without heavy dependencies

### Domain Knowledge
- **ESG Investing** - Understanding the 8 key dimensions of corporate impact
- **Financial APIs** - Working with real-time and historical market data
- **News Sentiment** - Analyzing how media coverage correlates with company behavior

### Product Insights
- Users want **simple explanations** of complex ESG data
- **Real-time updates** matter more than comprehensive historical analysis
- **Visual feedback** (color-coded scores, charts) drives engagement
- Impact investing is most valuable when it **doesn't sacrifice returns**

## 🎨 What's next for MarketMakers

### Short-term (Post-Hackathon)
- [ ] Add user authentication and saved watchlists
- [ ] Implement portfolio tracking with "paper trading"
- [ ] Enhanced news filtering by impact category
- [ ] Mobile-responsive improvements

### Medium-term
- [ ] Multi-criteria portfolio optimization (impact + risk/return)
- [ ] Historical ESG score tracking (trend analysis)
- [ ] Social features (share portfolios, follow investors)
- [ ] Integration with real brokerage APIs (Alpaca, Robinhood)

### Long-term Vision
- [ ] Build proprietary ML model trained on ESG outcomes
- [ ] Partner with impact-focused ETF providers
- [ ] Launch as production SaaS for retail investors
- [ ] Expand to international markets and carbon credit tracking

## 🌍 Impact Potential

If successful, MarketMakers could:
- **Democratize ESG investing** by making it accessible to everyone, not just institutional investors
- **Redirect capital** toward companies making positive change
- **Increase transparency** by making corporate impact data real-time and understandable
- **Empower retail investors** to vote with their dollars on the issues they care about

---

## 🛠️ Built With

### Core Technologies
- **React 18** - Frontend UI framework
- **TypeScript** - Type-safe JavaScript for frontend & backend
- **Node.js + Express** - Backend API server
- **Vite** - Lightning-fast frontend build tool

### AI & APIs
- **Google Gemini 1.5 Flash** - AI-powered ESG analysis and sentiment scoring
- **Alpha Vantage API** - Real-time stock quotes and historical data
- **News API** - Real-time company news aggregation

### Data & State Management
- **Axios** - HTTP client for API requests
- **In-memory caching** - Performance optimization with TTL
- **React Hooks** - Modern state management (useState, useEffect, useMemo, useCallback)

### Styling & UI
- **Custom CSS** - Dark theme with accent colors (#0B0E11, #F0B90B, #1E2329)
- **SVG** - Custom chart generation and logo rendering
- **Responsive Design** - Mobile-first approach

### DevOps & Tools
- **Git** - Version control
- **npm** - Package management
- **ESLint** - Code linting
- **dotenv** - Environment variable management

---

## 🔗 Try it Out

### GitHub Repository
[github.com/YOUR_USERNAME/market-makers](https://github.com/YOUR_USERNAME/market-makers)

### Quick Start
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/market-makers.git
cd market-makers

# Backend setup
cd backend
npm install
# Create .env with API keys (see README.md)
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev

# Open http://localhost:5173
```

### Live Demo
*(Add Vercel/Netlify deployment link here if you deploy)*

### Video Demo
*(Add YouTube/Loom video link here if you record one)*

---

## 📸 Screenshots

### Main Dashboard
![Dashboard](docs/dashboard-screenshot.png)
*Choose your impact preference and see AI-powered recommendations*

### Company Analysis
![Analysis](docs/company-analysis-screenshot.png)
*Deep dive into ESG scores with real-time news and charts*

### Historical Charts
![Charts](docs/charts-screenshot.png)
*Interactive price history from 1 day to 5 years*

---

## 👥 Team

Built with ❤️ for [Hackathon Name]

---

## 📄 License

MIT License - feel free to use this code for your own projects!

---

**Note:** This is a hackathon MVP. All data is for educational purposes only and should not be considered investment advice. Always do your own research before making financial decisions.

