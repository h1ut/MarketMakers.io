import { Router } from "express";
import { impactCategories } from "../data/impacts";

export const impactsRouter = Router();

impactsRouter.get("/", (_req, res) => {
  res.json(impactCategories);
});


