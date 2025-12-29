import { Company } from "../types";

// A small curated set of example companies/ETFs tagged by impact category.
// These are illustrative only; this app is NOT investment advice.

export const companies: Company[] = [
  {
    id: "goog",
    symbol: "GOOG",
    name: "Alphabet Inc.",
    logo: "🔍",
    sector: "Technology",
    description:
      "Parent company of Google, investing in clean energy, AI research, and digital infrastructure.",
    impactCategories: ["broad", "environmental", "social", "workplaceEquality"],
    baseScores: {
      environmental: 85,
      socialImpact: 88,
      laborPractices: 82,
      corporateImpact: 90,
      genderEquality: 78,
      payEquality: 76,
      shortTermProfitability: 92,
      longTermProfitability: 95
    }
  },
  {
    id: "tesla",
    symbol: "TSLA",
    name: "Tesla Inc.",
    logo: "⚡",
    sector: "Automotive",
    description:
      "Electric vehicle and clean energy company focused on accelerating the world's transition to sustainable energy.",
    impactCategories: ["broad", "environmental"],
    baseScores: {
      environmental: 95,
      socialImpact: 80,
      laborPractices: 68,
      corporateImpact: 92,
      genderEquality: 70,
      payEquality: 68,
      shortTermProfitability: 75,
      longTermProfitability: 88
    }
  },
  {
    id: "microsoft",
    symbol: "MSFT",
    name: "Microsoft Corp.",
    logo: "🪟",
    sector: "Technology",
    description:
      "Cloud, productivity, and software leader with strong climate commitments and workplace programs.",
    impactCategories: [
      "broad",
      "environmental",
      "social",
      "workplaceEquality",
      "genderEquality"
    ],
    baseScores: {
      environmental: 90,
      socialImpact: 86,
      laborPractices: 88,
      corporateImpact: 92,
      genderEquality: 84,
      payEquality: 82,
      shortTermProfitability: 93,
      longTermProfitability: 96
    }
  },
  {
    id: "apple",
    symbol: "AAPL",
    name: "Apple Inc.",
    logo: "🍎",
    sector: "Technology",
    description:
      "Consumer electronics and services company with growing renewable energy and supply chain initiatives.",
    impactCategories: ["broad", "environmental", "social"],
    baseScores: {
      environmental: 88,
      socialImpact: 85,
      laborPractices: 80,
      corporateImpact: 90,
      genderEquality: 78,
      payEquality: 80,
      shortTermProfitability: 95,
      longTermProfitability: 94
    }
  },
  {
    id: "nvidia",
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    logo: "💚",
    sector: "Semiconductors",
    description:
      "Graphics and AI computing company powering data centers, gaming, and autonomous systems.",
    impactCategories: ["broad", "social", "workplaceEquality"],
    baseScores: {
      environmental: 80,
      socialImpact: 87,
      laborPractices: 82,
      corporateImpact: 88,
      genderEquality: 76,
      payEquality: 74,
      shortTermProfitability: 96,
      longTermProfitability: 93
    }
  },
  {
    id: "she",
    symbol: "SHE",
    name: "SPDR SSGA Gender Diversity Index ETF",
    logo: "♀️",
    sector: "ETF",
    description:
      "ETF tracking U.S. large-cap companies with higher levels of gender diversity in senior leadership.",
    impactCategories: ["broad", "genderEquality", "workplaceEquality"],
    baseScores: {
      environmental: 78,
      socialImpact: 88,
      laborPractices: 90,
      corporateImpact: 86,
      genderEquality: 96,
      payEquality: 92,
      shortTermProfitability: 78,
      longTermProfitability: 84
    }
  },
  {
    id: "nacp",
    symbol: "NACP",
    name: "Impact Shares NAACP Minority Empowerment ETF",
    logo: "✊",
    sector: "ETF",
    description:
      "ETF focused on racial justice, investing in companies with strong diversity, equity, and inclusion metrics.",
    impactCategories: ["broad", "racialJustice", "workplaceEquality"],
    baseScores: {
      environmental: 75,
      socialImpact: 94,
      laborPractices: 92,
      corporateImpact: 88,
      genderEquality: 90,
      payEquality: 90,
      shortTermProfitability: 70,
      longTermProfitability: 82
    }
  },
  {
    id: "esgu",
    symbol: "ESGU",
    name: "iShares ESG Aware MSCI USA ETF",
    logo: "🌍",
    sector: "ETF",
    description:
      "Broad U.S. equity ETF with a tilt toward companies with positive ESG characteristics.",
    impactCategories: ["broad", "environmental", "social"],
    baseScores: {
      environmental: 88,
      socialImpact: 86,
      laborPractices: 84,
      corporateImpact: 86,
      genderEquality: 82,
      payEquality: 80,
      shortTermProfitability: 80,
      longTermProfitability: 88
    }
  }
];


