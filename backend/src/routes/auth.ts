import { Router } from "express";
import { getEntitlementSnapshot } from "../entitlements/index.js";
import { optionalAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.get("/auth/me", optionalAuth, async (req, res) => {
  try {
    const snapshot = await getEntitlementSnapshot(req.auth?.userId);
    res.json(snapshot);
  } catch (error) {
    console.error("Failed to load /auth/me:", error);
    res.status(500).json({ error: "Failed to load account" });
  }
});
