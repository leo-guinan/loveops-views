import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

export class QueueService {
  private queuePath: string;

  constructor(queuePath?: string) {
    // Use environment variable or default path (base queue path, not including "ready")
    this.queuePath = queuePath || process.env.QUEUE_PATH || "/var/queues/loveops-events-ingest";
    this.ensureQueueDirectory();
  }

  private ensureQueueDirectory() {
    try {
      if (!fs.existsSync(this.queuePath)) {
        fs.mkdirSync(this.queuePath, { recursive: true });
      }
    } catch (error) {
      console.error(`Failed to create queue directory: ${error}`);
      // Fallback to local queue directory if /var/queues doesn't exist
      if (this.queuePath.startsWith("/var/")) {
        const localPath = path.join(process.cwd(), "queues", "loveops-events-ingest");
        this.queuePath = localPath;
        fs.mkdirSync(this.queuePath, { recursive: true });
        console.log(`Using local queue directory: ${this.queuePath}`);
      }
    }
  }

  /**
   * Enqueue a job to the queue
   * Creates a JSON file in the queue directory with job data
   */
  async enqueue(jobType: string, payload: any): Promise<string> {
    const jobId = randomUUID();
    // Match QueueJob format expected by world-model processor
    const jobData = {
      id: jobId,
      payload,
      attempts: 0,
      createdAt: new Date().toISOString()
    };

    // Write to ready directory (in-process queue format)
    const readyDir = path.join(this.queuePath, "ready");
    const fileName = `${jobId}.json`;
    const filePath = path.join(readyDir, fileName);

    try {
      // Ensure ready directory exists
      if (!fs.existsSync(readyDir)) {
        fs.mkdirSync(readyDir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, JSON.stringify(jobData, null, 2), "utf-8");
      console.log(`Job enqueued: ${jobId} to ${filePath}`);
      return jobId;
    } catch (error) {
      console.error(`Failed to enqueue job: ${error}`);
      throw new Error(`Failed to enqueue job: ${error}`);
    }
  }

  /**
   * Enqueue a document processing job to loveops-events-ingest queue
   * This queue is processed by world-model service
   */
  async enqueueDocumentProcessing(
    userId: string,
    fileData: {
      filename: string;
      mimetype: string;
      buffer: Buffer;
      size: number;
    }
  ): Promise<string> {
    // Enqueue to loveops-events-ingest queue (processed by world-model)
    // The world-model service will process this and extract events from the document
    const jobPayload = {
      userId,
      file: {
        filename: fileData.filename,
        mimetype: fileData.mimetype,
        size: fileData.size,
        // Store base64 encoded buffer for now (or use file storage)
        data: fileData.buffer.toString("base64"),
      },
      type: "document_upload",
    };

    return this.enqueue("document_processing", jobPayload);
  }

  /**
   * Enqueue a matching job to loveops-policy-matching queue
   * This queue is processed by views service (in-process)
   */
  async enqueueMatchingJob(userId: string): Promise<string> {
    const jobPayload = {
      userId,
    };

    // Use the matching queue path
    const matchingQueuePath = process.env.QUEUE_PATH?.replace(
      "loveops-events-ingest",
      "loveops-policy-matching"
    ) || "/var/queues/loveops-policy-matching/ready";

    return this.enqueueToPath(matchingQueuePath, "matching_request", jobPayload);
  }

  /**
   * Enqueue a coaching job to loveops-policy-coaching queue
   * This queue is processed by views service (in-process)
   */
  async enqueueCoachingJob(matchId: string, senderId: string): Promise<string> {
    const jobPayload = {
      matchId,
      senderId,
    };

    const coachingQueuePath = process.env.QUEUE_PATH?.replace(
      "loveops-events-ingest",
      "loveops-policy-coaching"
    ) || "/var/queues/loveops-policy-coaching/ready";

    return this.enqueueToPath(coachingQueuePath, "coaching_request", jobPayload);
  }

  /**
   * Enqueue a notification job to loveops-notifications queue
   * This queue is processed by views service (in-process)
   */
  async enqueueNotificationJob(
    userId: string,
    type: string,
    payload: any
  ): Promise<string> {
    const jobPayload = {
      userId,
      type,
      payload,
    };

    const notificationsQueuePath = process.env.QUEUE_PATH?.replace(
      "loveops-events-ingest",
      "loveops-notifications"
    ) || "/var/queues/loveops-notifications/ready";

    return this.enqueueToPath(notificationsQueuePath, "notification", jobPayload);
  }

  /**
   * Helper to enqueue to a specific path without creating a new instance
   */
  private async enqueueToPath(queuePath: string, jobType: string, payload: any): Promise<string> {
    // Ensure directory exists
    try {
      if (!fs.existsSync(queuePath)) {
        fs.mkdirSync(queuePath, { recursive: true });
      }
    } catch (error) {
      console.error(`Failed to create queue directory ${queuePath}:`, error);
      // Fallback to local queue directory if /var/queues doesn't exist
      if (queuePath.startsWith("/var/")) {
        const queueName = queuePath.split("/").slice(-2, -1)[0]; // Extract queue name
        const localPath = path.join(process.cwd(), "queues", queueName, "ready");
        queuePath = localPath;
        fs.mkdirSync(queuePath, { recursive: true });
        console.log(`Using local queue directory: ${queuePath}`);
      }
    }

    const jobId = randomUUID();
    // Match QueueJob format expected by in-process processors
    const jobData = {
      id: jobId,
      payload,
      attempts: 0,
      createdAt: new Date().toISOString()
    };

    // Ensure ready directory exists
    const readyDir = path.join(queuePath, "ready");
    if (!fs.existsSync(readyDir)) {
      fs.mkdirSync(readyDir, { recursive: true });
    }
    
    const fileName = `${jobId}.json`;
    const filePath = path.join(readyDir, fileName);

    try {
      fs.writeFileSync(filePath, JSON.stringify(jobData, null, 2), "utf-8");
      console.log(`Job enqueued: ${jobId} to ${filePath}`);
      return jobId;
    } catch (error) {
      console.error(`Failed to enqueue job: ${error}`);
      throw new Error(`Failed to enqueue job: ${error}`);
    }
  }
}

