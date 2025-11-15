import React, { useState } from "react";
import { OnboardingFlow } from "./onboarding/OnboardingFlow";
import { UserHome } from "./pages/UserHome";
import { MatchDetail } from "./pages/MatchDetail";
import "./styles/onboarding.css";

type AppState = "onboarding" | "home" | "match";

type MatchState = {
  matchId: string;
  userId1: string;
  userId2: string;
};

export const App: React.FC = () => {
  // In a real app, this would come from authentication/localStorage
  const [appState, setAppState] = useState<AppState>("onboarding");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [matchState, setMatchState] = useState<MatchState | null>(null);

  const handleOnboardingComplete = (userId: string) => {
    setCurrentUserId(userId);
    setAppState("home");
  };

  const handleMatchSelect = (matchId: string) => {
    // In a real app, you'd fetch the match details to get userId2
    setMatchState({
      matchId,
      userId1: currentUserId || "user-default",
      userId2: "user-456" // placeholder
    });
    setAppState("match");
  };

  const handleBack = () => {
    setAppState("home");
    setMatchState(null);
  };

  return (
    <div className="app-container">
      {appState === "onboarding" && <OnboardingFlow onComplete={handleOnboardingComplete} />}
      {appState === "home" && currentUserId && (
        <UserHome userId={currentUserId} onMatchSelect={handleMatchSelect} />
      )}
      {appState === "match" && matchState && (
        <MatchDetail
          matchId={matchState.matchId}
          userId1={matchState.userId1}
          userId2={matchState.userId2}
          onBack={handleBack}
        />
      )}
    </div>
  );
};

