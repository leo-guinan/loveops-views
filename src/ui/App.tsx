import React, { useState, useEffect } from "react";
import { OnboardingFlow } from "./onboarding/OnboardingFlow";
import { UserHome } from "./pages/UserHome";
import { MatchDetail } from "./pages/MatchDetail";
import { Screen7PaymentSuccess } from "./onboarding/Screen7PaymentSuccess";
import { Screen7PaymentCancel } from "./onboarding/Screen7PaymentCancel";
import "./styles/onboarding.css";

type AppState = "onboarding" | "home" | "match" | "payment-success" | "payment-cancel";

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
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);

  // Check for payment redirect on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");
    const userId = urlParams.get("userId");
    const path = window.location.pathname;

    if (path === "/payment/success" && sessionId && userId) {
      setPaymentSessionId(sessionId);
      setCurrentUserId(userId);
      setAppState("payment-success");
    } else if (path === "/payment/cancel" && userId) {
      setCurrentUserId(userId);
      setAppState("payment-cancel");
    }
  }, []);

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

  const handlePaymentComplete = () => {
    // Clear URL params and proceed to account creation
    window.history.replaceState({}, "", "/");
    setAppState("onboarding");
    // The onboarding flow will continue from where it left off
  };

  const handlePaymentCancel = () => {
    // Clear URL params and return to paywall
    window.history.replaceState({}, "", "/");
    setAppState("onboarding");
  };

  return (
    <div className="app-container">
      {appState === "onboarding" && <OnboardingFlow onComplete={handleOnboardingComplete} userId={currentUserId} />}
      {appState === "payment-success" && paymentSessionId && currentUserId && (
        <Screen7PaymentSuccess
          sessionId={paymentSessionId}
          userId={currentUserId}
          onComplete={handlePaymentComplete}
        />
      )}
      {appState === "payment-cancel" && currentUserId && (
        <Screen7PaymentCancel
          userId={currentUserId}
          onBack={handlePaymentCancel}
        />
      )}
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

