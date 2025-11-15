import { Router, Request, Response } from "express";
import { PolicyService } from "../../services/PolicyService";
import { QueueService } from "../../services/QueueService";

export function createCoachingRouter(policy: PolicyService): Router {
  const router = Router();
  const queueService = new QueueService();

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
      
      // Enqueue coaching job to loveops-policy-coaching queue
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

