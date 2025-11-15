import React, { useState, useEffect } from "react";
import { Screen0Landing } from "./Screen0Landing";
import { Screen1DocUpload } from "./Screen1DocUpload";
import { Screen2Processing } from "./Screen2Processing";
import { Screen3CompatibilityPreview } from "./Screen3CompatibilityPreview";
import { Screen4SparkIntro } from "./Screen4SparkIntro";
import { Screen5ArchetypePreview } from "./Screen5ArchetypePreview";
import { Screen6Paywall } from "./Screen6Paywall";
import { Screen8AccountCreation } from "./Screen8AccountCreation";
import { Screen9EngineLive } from "./Screen9EngineLive";
import { Screen10FirstSpark } from "./Screen10FirstSpark";
import { Screen11InviteFriend } from "./Screen11InviteFriend";
import { Screen12Dashboard } from "./Screen12Dashboard";

type OnboardingState = {
  screen: number;
  uploadedFile?: File;
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
  accountData?: {
    photo?: File;
    name: string;
    pronouns: string;
    city: string;
    pacing: string;
  };
  userId?: string;
};

type OnboardingFlowProps = {
  onComplete?: (userId: string) => void;
  userId?: string | null;
};

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, userId: existingUserId }) => {
  const [state, setState] = useState<OnboardingState>({ 
    screen: existingUserId ? 6 : 0, // If returning from payment, start at paywall
    userId: existingUserId || undefined,
  });

  // Call onComplete when reaching dashboard
  useEffect(() => {
    if (state.screen === 12 && state.userId && onComplete) {
      onComplete(state.userId);
    }
  }, [state.screen, state.userId, onComplete]);

  // Mock data generators - in real app, these would come from API
  const generateCompatibility = () => ({
    emotionalRhythm: "You move through relationships with a steady emotional rhythm and a strong preference for depth over novelty.",
    communication: "You communicate with clarity, warmth, and intellectual curiosity.",
    preferences: "You thrive most with people who enjoy slow-burn conversations, shared meaning, and low-pressure environments.",
  });

  const generateSparkIntro = () => 
    "A thoughtful, creative mind who prefers meaningful conversation over small talk, and values emotional stability over spectacle.";

  const generateArchetype = () => ({
    title: "The Introspective Explorer",
    traits: [
      "communicate with patience",
      "enjoy intimate, low-noise spaces",
      "value emotional clarity",
      "share your depth-first orientation",
    ],
  });

  const generateFirstSpark = () => ({
    intro: "Someone who shares your warmth, loves curious conversation, and values emotional steadiness.",
    question: "What's a conversation that changed how you see something?",
    anecdote: "They mentioned how a late-night talk about childhood memories revealed more about compatibility than months of dating profiles.",
  });

  const handleScreen0Upload = () => setState({ ...state, screen: 1 });
  const handleScreen0NoDoc = () => {
    // For now, just proceed to doc upload
    setState({ ...state, screen: 1 });
  };

  const handleScreen1Upload = (file: File) => {
    setState({ ...state, screen: 2, uploadedFile: file });
  };

  const handleScreen2Complete = () => {
    setState({
      ...state,
      screen: 3,
      compatibility: generateCompatibility(),
    });
  };

  const handleScreen3Continue = () => {
    setState({
      ...state,
      screen: 4,
      sparkIntro: generateSparkIntro(),
    });
  };

  const handleScreen4Continue = () => {
    setState({
      ...state,
      screen: 5,
      archetype: generateArchetype(),
    });
  };

  const handleScreen5Continue = () => {
    setState({ ...state, screen: 6 });
  };

  const handleScreen6PaymentComplete = () => {
    // Payment completed via Stripe redirect, proceed to account creation
    setState({ ...state, screen: 8 });
  };

  const handleScreen8Complete = (data: any) => {
    // Generate a mock userId
    const userId = `user-${Date.now()}`;
    setState({
      ...state,
      screen: 9,
      accountData: data,
      userId,
    });
  };

  const handleScreen9Continue = () => {
    setState({ ...state, screen: 10 });
  };

  const handleScreen10Curious = () => {
    setState({ ...state, screen: 11 });
  };

  const handleScreen10NotForMe = () => {
    // Refine model - for now, just proceed
    setState({ ...state, screen: 11 });
  };

  const handleScreen11Invite = (email: string) => {
    // Send invite - for now, just proceed
    setState({ ...state, screen: 12 });
  };

  const handleScreen11Skip = () => {
    setState({ ...state, screen: 12 });
  };

  const handleMatchSelect = (matchId: string) => {
    // Navigate to match detail - would use router in real app
    console.log('Navigate to match:', matchId);
  };

  switch (state.screen) {
    case 0:
      return <Screen0Landing onUploadDoc={handleScreen0Upload} onNoDoc={handleScreen0NoDoc} />;
    case 1:
      return <Screen1DocUpload onDocUploaded={handleScreen1Upload} onBack={() => setState({ ...state, screen: 0 })} />;
    case 2:
      return <Screen2Processing onComplete={handleScreen2Complete} />;
    case 3:
      return (
        <Screen3CompatibilityPreview
          compatibility={state.compatibility!}
          onContinue={handleScreen3Continue}
        />
      );
    case 4:
      return (
        <Screen4SparkIntro
          sparkIntro={state.sparkIntro!}
          onContinue={handleScreen4Continue}
        />
      );
    case 5:
      return (
        <Screen5ArchetypePreview
          archetype={state.archetype!}
          onContinue={handleScreen5Continue}
        />
      );
    case 6:
      return (
        <Screen6Paywall
          userId={state.userId || "temp-user"}
          email={state.accountData?.email}
          referralCode={state.referralCode}
          onPaymentComplete={handleScreen6PaymentComplete}
          onWhyFee={() => {}}
        />
      );
    case 8:
      return <Screen8AccountCreation onComplete={handleScreen8Complete} />;
    case 9:
      return <Screen9EngineLive onContinue={handleScreen9Continue} />;
    case 10:
      return (
        <Screen10FirstSpark
          spark={generateFirstSpark()}
          onCurious={handleScreen10Curious}
          onNotForMe={handleScreen10NotForMe}
        />
      );
    case 11:
      return (
        <Screen11InviteFriend
          onInvite={handleScreen11Invite}
          onSkip={handleScreen11Skip}
        />
      );
    case 12:
      return (
        <Screen12Dashboard
          userId={state.userId || "user-default"}
          onMatchSelect={handleMatchSelect}
        />
      );
    default:
      return <Screen0Landing onUploadDoc={handleScreen0Upload} onNoDoc={handleScreen0NoDoc} />;
  }
};

