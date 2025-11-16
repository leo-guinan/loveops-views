/**
 * Onboarding State Machine
 * Manages valid state transitions and prevents invalid states
 */

export enum OnboardingScreen {
  LANDING = 0,
  DOC_UPLOAD = 1,
  PROCESSING = 2,
  COMPATIBILITY_PREVIEW = 3,
  SPARK_INTRO = 4,
  ARCHETYPE_PREVIEW = 5,
  PAYWALL = 6,
  ACCOUNT_CREATION = 8,
  ENGINE_LIVE = 9,
  FIRST_SPARK = 10,
  INVITE_FRIEND = 11,
  DASHBOARD = 12,
}

export interface OnboardingStateData {
  uploadedFile?: File;
  isProcessing?: boolean;
  creatingDoc?: boolean;
  compatibility?: {
    emotionalRhythm: string;
    communication: string;
    preferences: string;
  };
  sparkIntro?: string;
  archetype?: {
    title: string;
    traits: string[];
  };
  finalReport?: string;
  accountData?: {
    photo?: File;
    name: string;
    pronouns: string;
    city: string;
    pacing: string;
    email?: string;
  };
  userId?: string;
  referralCode?: string;
  paymentCompleted?: boolean;
  analysisCompleted?: boolean;
}

export class OnboardingStateMachine {
  private currentScreen: OnboardingScreen;
  private data: OnboardingStateData;

  constructor(initialScreen?: OnboardingScreen, initialData?: OnboardingStateData) {
    // Restore from sessionStorage if available
    const paymentComplete = typeof window !== 'undefined' && sessionStorage.getItem("loveops_paymentComplete") === "true";
    const storedUserId = typeof window !== 'undefined' ? sessionStorage.getItem("loveops_userId") : null;
    const storedCompatibility = typeof window !== 'undefined' ? sessionStorage.getItem("loveops_compatibility") : null;
    const storedSparkIntro = typeof window !== 'undefined' ? sessionStorage.getItem("loveops_sparkIntro") : null;
    const storedArchetype = typeof window !== 'undefined' ? sessionStorage.getItem("loveops_archetype") : null;
    const storedFinalReport = typeof window !== 'undefined' ? sessionStorage.getItem("loveops_finalReport") : null;

    // Determine initial screen based on state
    if (paymentComplete && storedCompatibility) {
      // Payment completed and analysis done - show compatibility report
      this.currentScreen = OnboardingScreen.COMPATIBILITY_PREVIEW;
      this.data = {
        ...initialData,
        userId: storedUserId || initialData?.userId,
        compatibility: storedCompatibility ? JSON.parse(storedCompatibility) : initialData?.compatibility,
        sparkIntro: storedSparkIntro || initialData?.sparkIntro,
        archetype: storedArchetype ? JSON.parse(storedArchetype) : initialData?.archetype,
        finalReport: storedFinalReport || initialData?.finalReport,
        analysisCompleted: true,
        paymentCompleted: true,
      };
    } else if (initialScreen !== undefined) {
      this.currentScreen = initialScreen;
      this.data = initialData || {};
    } else if (storedUserId) {
      // User exists but no payment - show paywall
      this.currentScreen = OnboardingScreen.PAYWALL;
      this.data = {
        ...initialData,
        userId: storedUserId,
        analysisCompleted: !!storedCompatibility,
        compatibility: storedCompatibility ? JSON.parse(storedCompatibility) : initialData?.compatibility,
        sparkIntro: storedSparkIntro || initialData?.sparkIntro,
        archetype: storedArchetype ? JSON.parse(storedArchetype) : initialData?.archetype,
        finalReport: storedFinalReport || initialData?.finalReport,
      };
    } else {
      // Start from beginning
      this.currentScreen = OnboardingScreen.LANDING;
      this.data = initialData || {};
    }
  }

  getCurrentScreen(): OnboardingScreen {
    return this.currentScreen;
  }

  getData(): OnboardingStateData {
    return { ...this.data };
  }

  /**
   * Transition to a new screen with validation
   */
  transitionTo(screen: OnboardingScreen, data?: Partial<OnboardingStateData>): boolean {
    if (!this.canTransitionTo(screen)) {
      console.warn(`Invalid transition from ${this.currentScreen} to ${screen}`);
      return false;
    }

    this.currentScreen = screen;
    if (data) {
      this.data = { ...this.data, ...data };
    }

    // Persist important state
    this.persistState();

    return true;
  }

  /**
   * Check if transition to screen is valid
   */
  canTransitionTo(screen: OnboardingScreen): boolean {
    const current = this.currentScreen;

    // Define valid transitions
    const validTransitions: Record<OnboardingScreen, OnboardingScreen[]> = {
      [OnboardingScreen.LANDING]: [OnboardingScreen.DOC_UPLOAD],
      [OnboardingScreen.DOC_UPLOAD]: [OnboardingScreen.PROCESSING, OnboardingScreen.LANDING],
      [OnboardingScreen.PROCESSING]: [OnboardingScreen.COMPATIBILITY_PREVIEW, OnboardingScreen.DOC_UPLOAD],
      [OnboardingScreen.COMPATIBILITY_PREVIEW]: [OnboardingScreen.SPARK_INTRO],
      [OnboardingScreen.SPARK_INTRO]: [OnboardingScreen.ARCHETYPE_PREVIEW],
      [OnboardingScreen.ARCHETYPE_PREVIEW]: [OnboardingScreen.PAYWALL],
      [OnboardingScreen.PAYWALL]: [OnboardingScreen.COMPATIBILITY_PREVIEW, OnboardingScreen.ACCOUNT_CREATION], // Can go back to preview or forward to account
      [OnboardingScreen.ACCOUNT_CREATION]: [OnboardingScreen.ENGINE_LIVE],
      [OnboardingScreen.ENGINE_LIVE]: [OnboardingScreen.FIRST_SPARK],
      [OnboardingScreen.FIRST_SPARK]: [OnboardingScreen.INVITE_FRIEND],
      [OnboardingScreen.INVITE_FRIEND]: [OnboardingScreen.DASHBOARD],
      [OnboardingScreen.DASHBOARD]: [], // Terminal state
    };

    const allowed = validTransitions[current] || [];
    
    // Special case: Can always go to compatibility preview if analysis is completed
    if (screen === OnboardingScreen.COMPATIBILITY_PREVIEW && this.data.analysisCompleted) {
      return true;
    }

    // Special case: Can go to paywall if analysis is completed
    if (screen === OnboardingScreen.PAYWALL && this.data.analysisCompleted) {
      return true;
    }

    return allowed.includes(screen);
  }

  /**
   * Mark analysis as completed
   */
  markAnalysisCompleted(compatibility: any, sparkIntro?: string, archetype?: any, finalReport?: string): void {
    this.data.analysisCompleted = true;
    this.data.compatibility = compatibility;
    this.data.sparkIntro = sparkIntro;
    this.data.archetype = archetype;
    this.data.finalReport = finalReport;
    this.persistState();
  }

  /**
   * Mark payment as completed
   */
  markPaymentCompleted(): void {
    this.data.paymentCompleted = true;
    this.persistState();
  }

  /**
   * Persist state to sessionStorage
   */
  private persistState(): void {
    if (typeof window === 'undefined') return;

    if (this.data.userId) {
      sessionStorage.setItem("loveops_userId", this.data.userId);
    }

    if (this.data.compatibility) {
      sessionStorage.setItem("loveops_compatibility", JSON.stringify(this.data.compatibility));
    }

    if (this.data.sparkIntro) {
      sessionStorage.setItem("loveops_sparkIntro", this.data.sparkIntro);
    }

    if (this.data.archetype) {
      sessionStorage.setItem("loveops_archetype", JSON.stringify(this.data.archetype));
    }

    if (this.data.finalReport) {
      sessionStorage.setItem("loveops_finalReport", this.data.finalReport);
    }

    if (this.data.analysisCompleted) {
      sessionStorage.setItem("loveops_analysisCompleted", "true");
    }

    if (this.data.paymentCompleted) {
      sessionStorage.setItem("loveops_paymentComplete", "true");
    }
  }

  /**
   * Clear persisted state
   */
  clearPersistedState(): void {
    if (typeof window === 'undefined') return;

    sessionStorage.removeItem("loveops_userId");
    sessionStorage.removeItem("loveops_compatibility");
    sessionStorage.removeItem("loveops_sparkIntro");
    sessionStorage.removeItem("loveops_archetype");
    sessionStorage.removeItem("loveops_finalReport");
    sessionStorage.removeItem("loveops_analysisCompleted");
    sessionStorage.removeItem("loveops_paymentComplete");
  }

  /**
   * Get the next screen in the flow
   */
  getNextScreen(): OnboardingScreen | null {
    const validTransitions: Record<OnboardingScreen, OnboardingScreen[]> = {
      [OnboardingScreen.LANDING]: [OnboardingScreen.DOC_UPLOAD],
      [OnboardingScreen.DOC_UPLOAD]: [OnboardingScreen.PROCESSING],
      [OnboardingScreen.PROCESSING]: [OnboardingScreen.COMPATIBILITY_PREVIEW],
      [OnboardingScreen.COMPATIBILITY_PREVIEW]: [OnboardingScreen.SPARK_INTRO],
      [OnboardingScreen.SPARK_INTRO]: [OnboardingScreen.ARCHETYPE_PREVIEW],
      [OnboardingScreen.ARCHETYPE_PREVIEW]: [OnboardingScreen.PAYWALL],
      [OnboardingScreen.PAYWALL]: [OnboardingScreen.ACCOUNT_CREATION],
      [OnboardingScreen.ACCOUNT_CREATION]: [OnboardingScreen.ENGINE_LIVE],
      [OnboardingScreen.ENGINE_LIVE]: [OnboardingScreen.FIRST_SPARK],
      [OnboardingScreen.FIRST_SPARK]: [OnboardingScreen.INVITE_FRIEND],
      [OnboardingScreen.INVITE_FRIEND]: [OnboardingScreen.DASHBOARD],
      [OnboardingScreen.DASHBOARD]: [],
    };

    const next = validTransitions[this.currentScreen];
    return next && next.length > 0 ? next[0] : null;
  }

  /**
   * Check if we should show processing screen
   */
  shouldShowProcessing(): boolean {
    // Only show processing if we're on processing screen AND not already completed
    return this.currentScreen === OnboardingScreen.PROCESSING && !this.data.analysisCompleted;
  }

  /**
   * Check if we can show compatibility preview
   */
  canShowCompatibilityPreview(): boolean {
    return !!this.data.compatibility && this.data.analysisCompleted === true;
  }
}

