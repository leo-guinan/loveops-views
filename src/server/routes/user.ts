import { Router, Request, Response } from "express";
import { WorldModelService } from "../../services/WorldModelService";
import { PolicyService } from "../../services/PolicyService";

export function createUserRouter(
  worldModel: WorldModelService,
  policy: PolicyService
) {
  const router = Router();

  router.get("/:userId/dashboard", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const state = await worldModel.getUserDashboardState(userId);
      res.json(state);
    } catch (error) {
      console.error("Error fetching user dashboard:", error);
      res.status(500).json({ error: "Failed to fetch user dashboard" });
    }
  });

  router.post("/:userId/matches/recommend", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const recs = await policy.recommendMatchesForUser(userId);
      res.json(recs);
    } catch (error) {
      console.error("Error recommending matches:", error);
      res.status(500).json({ error: "Failed to recommend matches" });
    }
  });

  router.post("/:userId/matches/:matchId/suggest-opener", async (req: Request, res: Response) => {
    try {
      const { userId, matchId } = req.params;
      const suggestion = await policy.suggestMessage(matchId, userId);
      res.json(suggestion);
    } catch (error) {
      console.error("Error suggesting opener:", error);
      res.status(500).json({ error: "Failed to suggest opener" });
    }
  });

  return router;
}

