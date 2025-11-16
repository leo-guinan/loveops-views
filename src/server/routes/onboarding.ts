import { Router, Request, Response } from "express";
import multer from "multer";
import * as fs from "fs";
import * as path from "path";
import { WorldModelService } from "../../services/WorldModelService";
import { PolicyService } from "../../services/PolicyService";
import { QueueService } from "../../services/QueueService";
import { DocumentAnalysisService } from "../../services/DocumentAnalysisService";
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
  const documentAnalysis = new DocumentAnalysisService();

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
      const queuesDir = process.env.VQ_QUEUES_DIR || "/var/queues";
      const queueName = "loveops-events-ingest";
      const queuePath = path.join(queuesDir, queueName);
      
      // Check each state directory for the job
      const states = ["ready", "in_progress", "done", "dead", "scheduled"];
      let jobState: string | null = null;
      let jobPayload: any = null;
      
      for (const state of states) {
        const statePath = path.join(queuePath, state, `${jobId}.json`);
        if (fs.existsSync(statePath)) {
          jobState = state;
          try {
            const content = fs.readFileSync(statePath, "utf-8");
            const job = JSON.parse(content);
            jobPayload = job.payload;
          } catch (error) {
            console.error(`Error reading job file ${statePath}:`, error);
          }
          break;
        }
      }
      
      if (!jobState) {
        // Job not found in any state - might have been processed and cleaned up
        // or never existed
        return res.json({
          jobId,
          status: "not_found",
          message: "Job not found in queue",
        });
      }
      
      // Map queue states to API status
      let status: string;
      let results: any = null;
      
      if (jobState === "done") {
        status = "completed";
        
        // Extract insights from the processed job
        // The job payload contains the document data
        let insights = null;
        if (jobPayload?.file?.data) {
          try {
            // Decode document text
            const documentText = Buffer.from(jobPayload.file.data, 'base64').toString('utf-8');
            // Analyze document to extract compatibility insights
            insights = await documentAnalysis.analyzeDocument(documentText);
          } catch (error) {
            console.error("Error analyzing document:", error);
            // Fallback to basic success message
            insights = {
              compatibility: {
                emotionalRhythm: "Document processed successfully.",
                communication: "Your profile has been created.",
                preferences: "Ready to find matches.",
              },
            };
          }
        }
        
        results = {
          success: true,
          message: "Document processed successfully",
          ...insights,
          // Include finalReport if available
          finalReport: insights?.finalReport,
        };
      } else if (jobState === "dead") {
        status = "failed";
        results = {
          error: "Job failed after maximum retries",
        };
      } else if (jobState === "in_progress") {
        status = "processing";
      } else if (jobState === "ready" || jobState === "scheduled") {
        status = "queued";
      } else {
        status = "unknown";
      }
      
      res.json({
        jobId,
        status,
        queueState: jobState,
        results,
      });
    } catch (error) {
      console.error("Error checking job status:", error);
      res.status(500).json({ error: "Failed to check job status" });
    }
  });

  return router;
}

