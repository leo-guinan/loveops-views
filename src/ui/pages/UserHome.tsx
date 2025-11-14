import React, { useState, useEffect } from "react";
import { MatchList } from "../components/MatchList";
import { EmotionalDashboard } from "../components/EmotionalDashboard";
import { UserProfileState, EmotionalLoadState } from "loveops-world-model";

type DashboardState = {
  profile: UserProfileState;
  interaction: any;
  emotional: EmotionalLoadState;
  safety: any;
};

type Props = {
  userId: string;
  onMatchSelect: (matchId: string) => void;
};

export const UserHome: React.FC<Props> = ({ userId, onMatchSelect }) => {
  const [dashboardState, setDashboardState] = useState<DashboardState | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
    loadMatches();
  }, [userId]);

  const loadDashboard = async () => {
    try {
      const response = await fetch(`/api/user/${userId}/dashboard`);
      if (!response.ok) throw new Error("Failed to load dashboard");
      const data = await response.json();
      setDashboardState(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    try {
      const response = await fetch(`/api/user/${userId}/matches/recommend`, {
        method: "POST"
      });
      if (!response.ok) throw new Error("Failed to load matches");
      const data = await response.json();
      setMatches(data);
    } catch (err) {
      console.error("Failed to load matches:", err);
    }
  };

  if (loading) {
    return <div className="user-home loading">Loading...</div>;
  }

  if (error) {
    return <div className="user-home error">Error: {error}</div>;
  }

  return (
    <div className="user-home">
      <header>
        <h1>Welcome back!</h1>
        {dashboardState?.profile && (
          <p>User: {dashboardState.profile.name || userId}</p>
        )}
      </header>

      <div className="dashboard-content">
        {dashboardState?.emotional && (
          <section className="emotional-section">
            <EmotionalDashboard emotionalState={dashboardState.emotional} />
          </section>
        )}

        <section className="matches-section">
          <MatchList matches={matches} onMatchSelect={onMatchSelect} />
        </section>
      </div>
    </div>
  );
};

