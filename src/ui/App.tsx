import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { ProtectedRoute } from "./auth/ProtectedRoute";
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

const AppContent: React.FC = () => {
  const { user, authenticated, loading } = useAuth();
  const [appState, setAppState] = useState<AppState>("onboarding");
  const [currentUserId, setCurrentUserId] = useState<string | null>(user?.userId || null);
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);

  // Update userId when auth state changes
  useEffect(() => {
    if (authenticated && user) {
      setCurrentUserId(user.userId);
      // If user is authenticated and on onboarding, move to home
      if (appState === "onboarding") {
        setAppState("home");
      }
    } else if (!authenticated && !loading) {
      setCurrentUserId(null);
      setAppState("onboarding");
    }
  }, [authenticated, user, loading]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {appState === "onboarding" && (
        <OnboardingFlow onComplete={handleOnboardingComplete} userId={currentUserId} />
      )}
      {appState === "payment-success" && paymentSessionId && currentUserId && (
        <ProtectedRoute>
          <Screen7PaymentSuccess
            sessionId={paymentSessionId}
            userId={currentUserId}
            onComplete={handlePaymentComplete}
          />
        </ProtectedRoute>
      )}
      {appState === "payment-cancel" && currentUserId && (
        <ProtectedRoute>
          <Screen7PaymentCancel
            userId={currentUserId}
            onBack={handlePaymentCancel}
          />
        </ProtectedRoute>
      )}
      {appState === "home" && currentUserId && (
        <ProtectedRoute>
          <UserHome userId={currentUserId} onMatchSelect={handleMatchSelect} />
        </ProtectedRoute>
      )}
      {appState === "match" && matchState && (
        <ProtectedRoute>
          <MatchDetail
            matchId={matchState.matchId}
            userId1={matchState.userId1}
            userId2={matchState.userId2}
            onBack={handleBack}
          />
        </ProtectedRoute>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

