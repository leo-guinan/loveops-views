/**
 * Authentication Service
 * Handles Twitter OAuth and user session management
 */

import { QueueService } from "./QueueService";
import { LoveopsRhizomeClient } from "../types/loveops-policy";
import { DatingEventType } from "../types/loveops-world-model";

export interface TwitterUser {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
}

export interface UserSession {
  userId: string;
  twitterId: string;
  twitterUsername: string;
  displayName: string;
  profileImageUrl?: string;
  createdAt: Date;
}

export class AuthService {
  constructor(
    private rhizomeClient: LoveopsRhizomeClient,
    private queueService: QueueService
  ) {}

  /**
   * Create or get user from Twitter OAuth data
   * Creates a PROFILE_CREATED event if user doesn't exist
   */
  async createOrGetUser(twitterUser: TwitterUser): Promise<string> {
    // Generate userId from Twitter ID (consistent across logins)
    const userId = `twitter:${twitterUser.id}`;

    // Check if user already exists by querying their events
    const existingEvents = await this.rhizomeClient.getEventsForUser(userId);
    
    if (existingEvents.length === 0) {
      // New user - create PROFILE_CREATED event
      const profileEvent = {
        id: `profile-created-${userId}-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "auth:twitter_oauth",
        actorId: userId,
        domain: "profile" as const,
        type: DatingEventType.PROFILE_CREATED,
        payload: {
          twitterId: twitterUser.id,
          twitterUsername: twitterUser.username,
          displayName: twitterUser.displayName,
          profileImageUrl: twitterUser.profileImageUrl,
          createdAt: new Date().toISOString(),
        },
        confidence: 1.0,
      };

      // Enqueue to events-ingest queue (processed by world-model)
      await this.queueService.enqueue("profile_created", profileEvent);
      
      console.log(`✅ Created new user: ${userId} (Twitter: @${twitterUser.username})`);
    } else {
      console.log(`✅ Existing user logged in: ${userId} (Twitter: @${twitterUser.username})`);
    }

    return userId;
  }

  /**
   * Build user session from Twitter user data
   */
  buildSession(twitterUser: TwitterUser, userId: string): UserSession {
    return {
      userId,
      twitterId: twitterUser.id,
      twitterUsername: twitterUser.username,
      displayName: twitterUser.displayName,
      profileImageUrl: twitterUser.profileImageUrl,
      createdAt: new Date(),
    };
  }
}

