import { Router, Request, Response } from "express";
import { WorldModelService } from "../../services/WorldModelService";
import { PolicyService } from "../../services/PolicyService";
import { QueueService } from "../../services/QueueService";
import { requireAuth, getAuthenticatedUserId } from "./auth";

export function createUserRouter(
  worldModel: WorldModelService,
  policy: PolicyService
): Router {
  const router = Router();
  const queueService = new QueueService();

  // All routes require authentication
  router.use(requireAuth);

  router.get("/dashboard", async (req: Request, res: Response) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const state = await worldModel.getUserDashboardState(userId);
      res.json(state);
    } catch (error) {
      console.error("Error fetching user dashboard:", error);
      res.status(500).json({ error: "Failed to fetch user dashboard" });
    }
  });

  router.post("/matches/recommend", async (req: Request, res: Response) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Enqueue matching job to loveops-policy-matching queue
      // Views service will process this in-process
      const jobId = await queueService.enqueueMatchingJob(userId);
      
      res.json({
        jobId,
        status: "queued",
        message: "Match recommendation job queued. Results will be available shortly.",
      });
    } catch (error) {
      console.error("Error enqueueing matching job:", error);
      res.status(500).json({ error: "Failed to enqueue matching job" });
    }
  });

  router.post("/matches/:matchId/suggest-opener", async (req: Request, res: Response) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { matchId } = req.params;
      
      // Enqueue coaching job to loveops-policy-coaching queue
      // Views service will process this in-process
      const jobId = await queueService.enqueueCoachingJob(matchId, userId);
      
      res.json({
        jobId,
        status: "queued",
        message: "Message suggestion job queued. Results will be available shortly.",
      });
    } catch (error) {
      console.error("Error enqueueing coaching job:", error);
      res.status(500).json({ error: "Failed to enqueue coaching job" });
    }
  });

  return router;
}

