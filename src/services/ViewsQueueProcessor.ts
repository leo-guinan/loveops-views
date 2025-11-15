import { QueueProcessor, Job } from "./QueueProcessor";
import { WorldModelService } from "./WorldModelService";
import { PolicyService } from "./PolicyService";
import { QueueService } from "./QueueService";

/**
 * Views service queue processor
 * Processes queues assigned to the views service:
 * - loveops-policy-matching
 * - loveops-policy-coaching
 * - loveops-notifications
 * - loveops-metrics
 */
export class ViewsQueueProcessor extends QueueProcessor {
  constructor(
    private worldModel: WorldModelService,
    private policy: PolicyService
  ) {
    super();
  }

  protected async processJob(queueName: string, job: Job): Promise<boolean> {
    try {
      switch (queueName) {
        case "loveops-policy-matching":
          return await this.processMatchingJob(job);
        
        case "loveops-policy-coaching":
          return await this.processCoachingJob(job);
        
        case "loveops-notifications":
          return await this.processNotificationJob(job);
        
        case "loveops-metrics":
          return await this.processMetricsJob(job);
        
        default:
          console.warn(`Unknown queue: ${queueName}`);
          return false;
      }
    } catch (error) {
      console.error(`Error processing job ${job.id} from ${queueName}:`, error);
      return false;
    }
  }

  private async processMatchingJob(job: Job): Promise<boolean> {
    try {
      const { userId } = job.payload;
      
      // Use policy library to generate matches
      const matches = await this.policy.recommendMatchesForUser(userId);
      
      const queueService = new QueueService();
      
      // Emit MATCH_CREATED events for each match to loveops-events-ingest queue
      // (processed by world-model service)
      for (const match of matches) {
        // TODO: Create MATCH_CREATED event and enqueue to loveops-events-ingest
        console.log(`Match created: ${match.userId} <-> ${match.candidateId}`);
        
        // Emit notification job
        await queueService.enqueueNotificationJob(
          userId,
          "match_created",
          { matchId: match.candidateId, compatibility: match.compatibility }
        );
      }
      
      return true;
    } catch (error) {
      console.error("Error processing matching job:", error);
      return false;
    }
  }

  private async processCoachingJob(job: Job): Promise<boolean> {
    try {
      const { matchId, senderId } = job.payload;
      
      // Use policy library to generate coaching suggestion
      const suggestion = await this.policy.suggestMessage(matchId, senderId);
      
      // Emit notification job
      const queueService = new QueueService();
      await queueService.enqueueNotificationJob(
        senderId,
        "message_suggestion",
        { matchId, suggestion }
      );
      
      return true;
    } catch (error) {
      console.error("Error processing coaching job:", error);
      return false;
    }
  }

  private async processNotificationJob(job: Job): Promise<boolean> {
    try {
      const { userId, type, payload } = job.payload;
      
      // TODO: Send notification (email, push, etc.)
      console.log(`Notification for ${userId}: ${type}`, payload);
      
      return true;
    } catch (error) {
      console.error("Error processing notification job:", error);
      return false;
    }
  }

  private async processMetricsJob(job: Job): Promise<boolean> {
    try {
      const { metric, value, tags } = job.payload;
      
      // TODO: Write metrics to metrics/last_deploy/queues.json or services.json
      console.log(`Metric: ${metric} = ${value}`, tags);
      
      return true;
    } catch (error) {
      console.error("Error processing metrics job:", error);
      return false;
    }
  }
}

