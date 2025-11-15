// Type definitions for loveops-world-model
// These match the actual package structure

export type FactEvent = {
  id: string;
  timestamp: string; // ISO
  source: string; // "user:<id>", "system:matchmaker", etc.
  actorId?: string;
  targetId?: string;
  domain: string; // "profile" | "match" | "message" | ...
  type: string; // specific event type
  payload: any;
  confidence?: number; // 0–1
  meta?: Record<string, any>;
};

export type WorldViewParams = {
  asOf?: string; // default: now
  horizon?: string; // e.g. "30d"
  perspective?: string; // e.g. "user_self", "matchmaker_v1"
};

export type WorldView<State> = (
  events: FactEvent[],
  params?: WorldViewParams
) => State;

export type UserProfileState = {
  userId: string;
  core: {
    name?: string;
    age?: number;
    location?: string;
  };
  intent?: "long_term" | "casual" | "friendship" | "exploring";
  boundaries: string[];
  preferences: {
    distanceMiles?: number;
    ageRange?: [number, number];
    tags: string[];
  };
  lastUpdated?: string;
  profileCompletenessScore: number; // 0–1
};

export type InteractionHistoryState = {
  userId: string;
  matchesCount: number;
  messagesSent: number;
  messagesReceived: number;
  avgReplyLatencySec: number | null;
  ghostedRatio: number; // 0–1
  datesCompleted: number;
};

export type EmotionalLoadState = {
  userId: string;
  burnoutLevel: number; // 0–1
  averageVibePast30d: number | null;
  averageSafetyPast30d: number | null;
  varianceOfExperiences: number | null;
  recommendedPaceAdjustment:
    | "slow_down"
    | "keep"
    | "invite_reflection"
    | "opt_in_experiments";
  // Legacy compatibility - map recommendedPaceAdjustment to trends
  currentLoad?: number;
  trends?: Array<{
    direction: "increasing" | "decreasing";
    description: string;
  }>;
  riskFactors?: string[];
};

export type TrustSafetyState = {
  userId: string;
  trustScore: number; // 0–1
  reliabilityScore: number; // 0–1
  flags: string[];
};

export type MatchCompatibilityState = {
  userA: string;
  userB: string;
  compatibilityScore: number; // 0–1
  axes: {
    valuesAlignment: number;
    lifestyleOverlap: number;
    communicationStyleFit: number;
    riskOfTimeViolence: number; // 0–1, 1 = high risk
  };
  explanation: string[];
};

// Dating domain types
export type DatingDomain =
  | "profile"
  | "match"
  | "message"
  | "feedback"
  | "safety"
  | "system";

export enum DatingEventType {
  PROFILE_CREATED = "PROFILE_CREATED",
  PROFILE_FIELD_UPDATED = "PROFILE_FIELD_UPDATED",
  INTENT_DECLARED = "INTENT_DECLARED",
  BOUNDARY_DECLARED = "BOUNDARY_DECLARED",
  PROFILE_VIEWED = "PROFILE_VIEWED",
  LIKE_SUBMITTED = "LIKE_SUBMITTED",
  PASS_SUBMITTED = "PASS_SUBMITTED",
  MATCH_CREATED = "MATCH_CREATED",
  MATCH_ARCHIVED = "MATCH_ARCHIVED",
  MESSAGE_SENT = "MESSAGE_SENT",
  DATE_PLANNED = "DATE_PLANNED",
  DATE_CONFIRMED = "DATE_CONFIRMED",
  DATE_COMPLETED = "DATE_COMPLETED",
  POST_INTERACTION_FEEDBACK = "POST_INTERACTION_FEEDBACK",
  BURNOUT_STATE_REPORTED = "BURNOUT_STATE_REPORTED",
  DELIGHT_MOMENT = "DELIGHT_MOMENT",
  BLOCK_SUBMITTED = "BLOCK_SUBMITTED",
  REPORT_SUBMITTED = "REPORT_SUBMITTED",
  MODERATION_ACTION_TAKEN = "MODERATION_ACTION_TAKEN",
}

export type ProfileFieldUpdatedPayload = {
  field: "bio" | "photos" | "preferences" | "intent" | string;
  oldValue?: any;
  newValue: any;
};

export type PostInteractionFeedbackPayload = {
  matchId: string;
  raterId: string;
  vibeScore: number; // 1-5
  feltSafe: boolean;
  feltHeard: number; // 1-5
  desireToSeeAgain: number; // 1-5
  notes?: string;
};

export type IntentDeclaredPayload = {
  intent: "long_term" | "casual" | "friendship" | "exploring";
};

export type BoundaryDeclaredPayload = {
  tags: string[];
};

export type LikeSubmittedPayload = {
  likerId: string;
  likedId: string;
};

export type MatchCreatedPayload = {
  matchId: string;
  userA: string;
  userB: string;
};

export type MessageSentPayload = {
  matchId: string;
  senderId: string;
  recipientId: string;
  content: string;
  messageType?: "text" | "media" | "system";
};

export type DatePlannedPayload = {
  matchId: string;
  plannedDate: string; // ISO
  location?: string;
};

export type BurnoutStateReportedPayload = {
  userId: string;
  burnoutLevel: number; // 0-1
  reason?: string;
};

export type BlockSubmittedPayload = {
  blockerId: string;
  blockedId: string;
  reason?: string;
};

export type DatingEventPayload =
  | ProfileFieldUpdatedPayload
  | PostInteractionFeedbackPayload
  | IntentDeclaredPayload
  | BoundaryDeclaredPayload
  | LikeSubmittedPayload
  | MatchCreatedPayload
  | MessageSentPayload
  | DatePlannedPayload
  | BurnoutStateReportedPayload
  | BlockSubmittedPayload;

export type DatingFactEvent = FactEvent & {
  domain: DatingDomain;
  type: DatingEventType;
};

export function createDatingEvent<TPayload>(
  params: Omit<DatingFactEvent, "id" | "timestamp" | "payload"> & {
    payload: TPayload;
  }
): DatingFactEvent;
