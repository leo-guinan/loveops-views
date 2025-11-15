import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

export class QueueService {
  private queuePath: string;

  constructor(queuePath?: string) {
    // Use environment variable or default path
    this.queuePath = queuePath || process.env.QUEUE_PATH || "/var/queues/loveops-events-ingest/ready";
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
        const localPath = path.join(process.cwd(), "queues", "loveops-events-ingest", "ready");
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
    const jobData = {
      id: jobId,
      type: jobType,
      payload,
      createdAt: new Date().toISOString(),
      status: "ready",
    };

    const fileName = `${jobId}.json`;
    const filePath = path.join(this.queuePath, fileName);

    try {
      fs.writeFileSync(filePath, JSON.stringify(jobData, null, 2), "utf-8");
      console.log(`Job enqueued: ${jobId} to ${filePath}`);
      return jobId;
    } catch (error) {
      console.error(`Failed to enqueue job: ${error}`);
      throw new Error(`Failed to enqueue job: ${error}`);
    }
  }

  /**
   * Enqueue a document processing job
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
    // Store file data temporarily or pass reference
    // For now, we'll include metadata and let the worker fetch the file
    // In production, you might want to store the file in S3 or similar first
    
    const jobPayload = {
      userId,
      file: {
        filename: fileData.filename,
        mimetype: fileData.mimetype,
        size: fileData.size,
        // Store base64 encoded buffer for now (or use file storage)
        data: fileData.buffer.toString("base64"),
      },
    };

    return this.enqueue("document_processing", jobPayload);
  }
}

