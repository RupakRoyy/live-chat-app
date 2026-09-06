import { Router } from "express";
import {
  getEntitlementSnapshot,
  parseOwnGender,
  setOwnGender,
} from "../entitlements/index.js";
import { requireAuth } from "../middleware/auth.js";

export const profileRouter = Router();

profileRouter.get("/profile", requireAuth, async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const snapshot = await getEntitlementSnapshot(userId);
    res.json(snapshot);
  } catch (error) {
    console.error("Failed to load /profile:", error);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

profileRouter.patch("/profile", requireAuth, async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const gender = parseOwnGender(req.body?.gender);
  if (!gender) {
    res.status(400).json({ error: "Invalid gender" });
    return;
  }

  try {
    const snapshot = await setOwnGender(userId, gender);
    res.json(snapshot);
  } catch (error) {
    console.error("Failed to update /profile:", error);
    res.status(500).json({ error: "Failed to save gender" });
  }
});
