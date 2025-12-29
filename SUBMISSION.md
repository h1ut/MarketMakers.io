# Quick Copy-Paste for Hackathon Submission

## Inspiration
The world needs democratized ESG investing. We built MarketMakers to help anyone invest in companies aligned with their values using AI-powered real-time analysis. Traditional ESG data is expensive and outdated - we made it free and instant.

## What it does
MarketMakers is an AI-powered platform that analyzes companies based on 8 ESG metrics using Google Gemini, real-time news, and live stock data. Users choose their impact preference (Environmental, Gender Equality, etc.) and discover top-rated companies with detailed scores and explanations.

## How we built it
- **Frontend:** React + TypeScript + Vite with custom SVG charts
- **Backend:** Node.js + Express API with intelligent caching
- **AI:** Google Gemini analyzes news sentiment and generates ESG scores
- **Data:** Alpha Vantage (stocks), News API (articles), custom scoring algorithms

## Challenges
1. Making AI scores truly unique per company (fixed with better prompting)
2. API rate limits (solved with smart caching + fallbacks)
3. Real-time chart performance (built custom SVG generator)
4. Gemini response consistency (regex parsing for JSON extraction)

## Accomplishments
✅ Real AI-powered ESG scoring that works for ANY company
✅ Beautiful, responsive UI with live data
✅ Smart caching system (2-min TTL)
✅ Historical charts (1D-5Y)
✅ Complete TypeScript type safety

## What we learned
- AI prompt engineering for consistent structured outputs
- Integrating multiple APIs with graceful degradation
- ESG investing principles and financial data APIs
- SVG path generation and data visualization
- Building production-ready MVPs quickly

## What's next
- User authentication and watchlists
- Portfolio optimization (impact + returns)
- Mobile app
- Real brokerage integration
- Proprietary ML model

## Built with
React, TypeScript, Node.js, Express, Google Gemini API, Alpha Vantage API, News API, Vite, Axios, SVG

## Links
- GitHub: https://github.com/YOUR_USERNAME/market-makers
- Demo: [Add deployment link]
- Video: [Add video link]

