import { Router, Request, Response } from "express";
import { PolicyService } from "../../services/PolicyService";

export function createCoachingRouter(policy: PolicyService): Router {
  const router = Router();

  router.get("/:userId/insights", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const insights = await policy.getCoachingInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching coaching insights:", error);
      res.status(500).json({ error: "Failed to fetch coaching insights" });
    }
  });

  router.post("/:userId/matches/:matchId/suggest-message", async (req: Request, res: Response) => {
    try {
      const { userId, matchId } = req.params;
      const { context } = req.body; // optional context for message suggestion
      const suggestion = await policy.suggestMessage(matchId, userId);
      res.json(suggestion);
    } catch (error) {
      console.error("Error suggesting message:", error);
      res.status(500).json({ error: "Failed to suggest message" });
    }
  });

  return router;
}

