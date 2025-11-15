import { Router, Request, Response } from "express";
import multer from "multer";
import { WorldModelService } from "../../services/WorldModelService";
import { PolicyService } from "../../services/PolicyService";
import { QueueService } from "../../services/QueueService";
import { getAuthenticatedUserId } from "./auth";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown'];
    const allowedExtensions = ['.pdf', '.txt', '.md', '.markdown'];
    const fileName = file.originalname.toLowerCase();
    
    const isValidType = allowedTypes.includes(file.mimetype) || 
                        allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (isValidType) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload PDF, markdown, or plain text.'));
    }
  },
});

export function createOnboardingRouter(
  worldModel: WorldModelService,
  policy: PolicyService
): Router {
  const router = Router();
  const queueService = new QueueService();

  // Process Date-Me Doc upload - enqueue to VibeQueue
  router.post("/process-doc", upload.single("doc"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const file = req.file;
      // Use authenticated userId if available, fallback to body param (for temp users during onboarding)
      const userId = getAuthenticatedUserId(req) || req.body.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required or userId must be provided" });
      }

      // Enqueue the document processing job to VibeQueue
      const jobId = await queueService.enqueueDocumentProcessing(userId, {
        filename: file.originalname,
        mimetype: file.mimetype,
        buffer: file.buffer,
        size: file.size,
      });

      console.log(`Document processing job enqueued: ${jobId} for user ${userId}`);

      // Return immediately - processing happens asynchronously
      res.json({
        userId,
        jobId,
        status: "queued",
        message: "Document queued for processing. Results will be available shortly.",
      });
    } catch (error) {
      console.error("Error enqueueing document:", error);
      res.status(500).json({ error: "Failed to enqueue document for processing" });
    }
  });

  // Check job status (for polling by frontend)
  router.get("/job-status/:jobId", async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      
      // TODO: Check job status from queue or result storage
      // For now, return queued status
      // In production, you'd check:
      // - If job is still in queue (ready/processing)
      // - If job has completed (check results storage)
      // - If job failed (check error storage)
      
      res.json({
        jobId,
        status: "queued", // or "processing", "completed", "failed"
        // If completed, include results here
      });
    } catch (error) {
      console.error("Error checking job status:", error);
      res.status(500).json({ error: "Failed to check job status" });
    }
  });

  return router;
}

