import { Router } from "express";
import { getProStatus } from "../entitlements/index.js";
import { requireAuth } from "../middleware/auth.js";

export const proRouter = Router();

proRouter.get("/pro/status", requireAuth, async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const status = await getProStatus(userId);
    res.json(status);
  } catch (error) {
    console.error("Failed to load Pro status:", error);
    res.status(500).json({ error: "Failed to load Pro status" });
  }
});
