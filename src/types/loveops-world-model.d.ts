// Placeholder type definitions for loveops-world-model
// Replace with actual package imports when available

export interface UserProfileState {
  name?: string;
  [key: string]: any;
}

export interface InteractionHistoryState {
  [key: string]: any;
}

export interface EmotionalLoadState {
  currentLoad: number;
  trends: Array<{
    direction: "increasing" | "decreasing";
    description: string;
  }>;
  riskFactors: string[];
}

export interface TrustSafetyState {
  [key: string]: any;
}

export interface MatchCompatibilityState {
  axes: {
    valuesAlignment: number;
    lifestyleOverlap: number;
    communicationStyleFit: number;
    riskOfTimeViolence: number;
  };
  explanation: string[];
}

