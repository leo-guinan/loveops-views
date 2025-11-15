// Placeholder imports - replace with actual packages when available
// import { MatchingEngine } from "loveops-policy/dist/engines/matching/MatchingEngine";
// import { CoachingEngine } from "loveops-policy/dist/engines/coaching/CoachingEngine";
import { MatchingEngine, CoachingEngine } from "../../types/loveops-policy";

export class PolicyService {
  constructor(
    private matching: MatchingEngine,
    private coaching: CoachingEngine
  ) {}

  recommendMatchesForUser(userId: string) {
    return this.matching.recommendForUser(userId);
  }

  suggestMessage(matchId: string, senderId: string) {
    return this.coaching.suggestMessage(matchId, senderId);
  }

  getCoachingInsights(userId: string) {
    return this.coaching.getInsightsForUser(userId);
  }
}

