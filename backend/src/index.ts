import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { impactsRouter } from "./routes/impacts";
import { recommendationsRouter } from "./routes/recommendations";
import { companyRouter } from "./routes/company";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin === "*" ? undefined : env.corsOrigin
  })
);
app.use(express.json());

// Root route with API info
app.get("/", (_req, res) => {
  res.json({
    name: "MarketMakers Impact Investing API",
    version: "1.0.0",
    endpoints: {
      health: "GET /api/health",
      impacts: "GET /api/impacts",
      recommendations: "GET /api/recommendations?impact={category}",
      company: "GET /api/company/:symbol?impact={category}"
    }
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    environment: env.nodeEnv
  });
});

app.use("/api/impacts", impactsRouter);
app.use("/api/recommendations", recommendationsRouter);
app.use("/api/company", companyRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

const port = env.port;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Impact investing API listening on port ${port}`);
});


