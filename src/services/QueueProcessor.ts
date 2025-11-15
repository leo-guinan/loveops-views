import * as fs from "fs";
import * as path from "path";

export type Job = {
  id: string;
  type: string;
  payload: any;
  createdAt: string;
  status: string;
};

export type QueueConfig = {
  name: string;
  path: string;
  processor: string; // "world-model", "views", or "both"
  workers?: number;
  batchSize?: number;
  timeout?: number;
  retries?: number;
};

/**
 * Base QueueProcessor class for in-process queue processing
 * Services extend this to implement their specific job processing logic
 */
export abstract class QueueProcessor {
  private configs: QueueConfig[];
  private processing: Map<string, boolean> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    // Load queue configs from environment variable
    const configJson = process.env.VQ_QUEUE_CONFIG || "[]";
    try {
      const parsed = JSON.parse(configJson);
      // Ensure it's an array
      this.configs = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Failed to parse VQ_QUEUE_CONFIG:", error);
      this.configs = [];
    }
    
    // Validate configs are valid
    this.configs = this.configs.filter((config) => {
      return config && typeof config === "object" && config.name && config.path && config.processor;
    });
  }

  /**
   * Start processing queues assigned to this service
   */
  start(serviceName: string = "views") {
    // Ensure configs is an array
    if (!Array.isArray(this.configs)) {
      console.warn("VQ_QUEUE_CONFIG is not a valid array, using empty config");
      this.configs = [];
    }

    const assignedQueues = this.configs.filter(
      (config) => config && (config.processor === serviceName || config.processor === "both")
    );

    console.log(`Starting queue processor for service: ${serviceName}`);
    
    if (assignedQueues.length === 0) {
      console.warn(`No queues assigned to service: ${serviceName}. Check VQ_QUEUE_CONFIG environment variable.`);
      return;
    }

    console.log(`Assigned queues: ${assignedQueues.map((q) => q.name).join(", ")}`);

    for (const config of assignedQueues) {
      this.startProcessingQueue(config);
    }
  }

  /**
   * Stop processing all queues
   */
  stop() {
    for (const [queueName, interval] of this.intervals.entries()) {
      clearInterval(interval);
      this.intervals.delete(queueName);
    }
    this.processing.clear();
  }

  /**
   * Start processing a specific queue
   */
  private startProcessingQueue(config: QueueConfig) {
    const queueName = config.name;
    const queuePath = path.join(config.path, "ready");
    const inProgressPath = path.join(config.path, "in_progress");
    const donePath = path.join(config.path, "done");
    const deadPath = path.join(config.path, "dead");

    // Ensure directories exist
    [queuePath, inProgressPath, donePath, deadPath].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    const processQueue = async () => {
      if (this.processing.get(queueName)) {
        return; // Already processing
      }

      this.processing.set(queueName, true);

      try {
        const batchSize = config.batchSize || 1;
        const jobs = await this.getReadyJobs(queuePath, batchSize);

        for (const jobFile of jobs) {
          await this.processJobFile(
            jobFile,
            queuePath,
            inProgressPath,
            donePath,
            deadPath,
            config
          );
        }
      } catch (error) {
        console.error(`Error processing queue ${queueName}:`, error);
      } finally {
        this.processing.set(queueName, false);
      }
    };

    // Process immediately, then on interval
    processQueue();
    const interval = setInterval(processQueue, 1000); // Poll every second
    this.intervals.set(queueName, interval);
  }

  /**
   * Get ready jobs from queue directory
   */
  private async getReadyJobs(queuePath: string, batchSize: number): Promise<string[]> {
    try {
      const files = fs.readdirSync(queuePath);
      const jsonFiles = files
        .filter((file) => file.endsWith(".json"))
        .slice(0, batchSize)
        .map((file) => path.join(queuePath, file));

      return jsonFiles;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error(`Error reading queue directory ${queuePath}:`, error);
      }
      return [];
    }
  }

  /**
   * Process a single job file
   */
  private async processJobFile(
    jobFilePath: string,
    readyPath: string,
    inProgressPath: string,
    donePath: string,
    deadPath: string,
    config: QueueConfig
  ) {
    const fileName = path.basename(jobFilePath);
    const inProgressFile = path.join(inProgressPath, fileName);
    const doneFile = path.join(donePath, fileName);
    const deadFile = path.join(deadPath, fileName);

    try {
      // Move to in_progress
      fs.renameSync(jobFilePath, inProgressFile);

      // Read job
      const jobData = JSON.parse(fs.readFileSync(inProgressFile, "utf-8")) as Job;

      // Process job (implemented by subclass)
      const success = await this.processJob(config.name, jobData);

      if (success) {
        // Move to done
        fs.renameSync(inProgressFile, doneFile);
        console.log(`Job ${jobData.id} completed successfully`);
      } else {
        // Move to dead (or retry logic could go here)
        fs.renameSync(inProgressFile, deadFile);
        console.error(`Job ${jobData.id} failed`);
      }
    } catch (error) {
      console.error(`Error processing job file ${fileName}:`, error);
      try {
        // Move to dead on error
        if (fs.existsSync(inProgressFile)) {
          fs.renameSync(inProgressFile, deadFile);
        }
      } catch (moveError) {
        console.error(`Failed to move job to dead queue:`, moveError);
      }
    }
  }

  /**
   * Abstract method to be implemented by subclasses
   * Returns true if job processed successfully, false otherwise
   */
  protected abstract processJob(queueName: string, job: Job): Promise<boolean>;
}

