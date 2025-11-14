import React, { useState } from "react";
import { UserHome } from "./pages/UserHome";
import { MatchDetail } from "./pages/MatchDetail";

type AppState = "home" | "match";

type MatchState = {
  matchId: string;
  userId1: string;
  userId2: string;
};

export const App: React.FC = () => {
  // In a real app, this would come from authentication
  const [currentUserId] = useState<string>("user-123");
  const [appState, setAppState] = useState<AppState>("home");
  const [matchState, setMatchState] = useState<MatchState | null>(null);

  const handleMatchSelect = (matchId: string) => {
    // In a real app, you'd fetch the match details to get userId2
    setMatchState({
      matchId,
      userId1: currentUserId,
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
      {appState === "home" && (
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

