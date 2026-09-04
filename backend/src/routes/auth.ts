import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.get("/auth/me", requireAuth, (req, res) => {
  res.json({
    userId: req.auth?.userId,
  });
});
