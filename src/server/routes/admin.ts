import { Router, Request, Response } from "express";
import { WorldModelService } from "../../services/WorldModelService";
import { PolicyService } from "../../services/PolicyService";

export function createAdminRouter(
  worldModel: WorldModelService,
  policy: PolicyService
): Router {
  const router = Router();

  // Health check endpoint
  router.get("/health", async (req: Request, res: Response) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      services: {
        worldModel: "connected",
        policy: "connected"
      }
    });
  });

  // System stats endpoint
  router.get("/stats", async (req: Request, res: Response) => {
    try {
      // TODO: Implement actual stats collection
      res.json({
        users: 0,
        matches: 0,
        interactions: 0,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  return router;
}

