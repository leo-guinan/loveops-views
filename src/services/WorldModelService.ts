import {
  LoveopsRhizomeClient,
} from "loveops-policy/dist/adapters/rhizome/LoveopsRhizomeClient";
import {
  UserProfileState,
  InteractionHistoryState,
  EmotionalLoadState,
  TrustSafetyState,
} from "loveops-world-model";

export class WorldModelService {
  constructor(private client: LoveopsRhizomeClient) {}

  async getUserDashboardState(userId: string) {
    const events = await this.client.getEventsForUser(userId);

    const profile = await this.client.evalView<UserProfileState>(
      "UserProfileStateView",
      events
    );
    const interaction = await this.client.evalView<InteractionHistoryState>(
      "InteractionHistoryView",
      events
    );
    const emotional = await this.client.evalView<EmotionalLoadState>(
      "EmotionalLoadView",
      events
    );
    const safety = await this.client.evalView<TrustSafetyState>(
      "TrustSafetyView",
      events
    );

    return { profile, interaction, emotional, safety };
  }

  async getMatchCompatibilityState(userId1: string, userId2: string) {
    const events1 = await this.client.getEventsForUser(userId1);
    const events2 = await this.client.getEventsForUser(userId2);
    const allEvents = [...events1, ...events2];

    return await this.client.evalView(
      "MatchCompatibilityView",
      allEvents,
      { userId1, userId2 }
    );
  }
}

