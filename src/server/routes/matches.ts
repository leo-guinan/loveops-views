import { Router, Request, Response } from "express";
import { WorldModelService } from "../../services/WorldModelService";
import { PolicyService } from "../../services/PolicyService";

export function createMatchesRouter(
  worldModel: WorldModelService,
  policy: PolicyService
): Router {
  const router = Router();

  router.get("/:matchId/compatibility", async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      const { userId1, userId2 } = req.query;

      if (!userId1 || !userId2) {
        return res.status(400).json({ 
          error: "userId1 and userId2 query parameters are required" 
        });
      }

      const compatibility = await worldModel.getMatchCompatibilityState(
        userId1 as string,
        userId2 as string
      );
      res.json(compatibility);
    } catch (error) {
      console.error("Error fetching match compatibility:", error);
      res.status(500).json({ error: "Failed to fetch match compatibility" });
    }
  });

  router.get("/:matchId/details", async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      // TODO: Implement match details endpoint
      res.json({ matchId, message: "Match details endpoint - to be implemented" });
    } catch (error) {
      console.error("Error fetching match details:", error);
      res.status(500).json({ error: "Failed to fetch match details" });
    }
  });

  return router;
}

