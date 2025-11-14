import React, { useState, useEffect } from "react";
import { CompatibilityMap } from "../components/CompatibilityMap";
import { MatchCompatibilityState } from "loveops-world-model";

type Props = {
  matchId: string;
  userId1: string;
  userId2: string;
  onBack: () => void;
};

export const MatchDetail: React.FC<Props> = ({ matchId, userId1, userId2, onBack }) => {
  const [compatibility, setCompatibility] = useState<MatchCompatibilityState | null>(null);
  const [messageSuggestion, setMessageSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMatchDetails();
  }, [matchId, userId1, userId2]);

  const loadMatchDetails = async () => {
    try {
      const response = await fetch(
        `/api/matches/${matchId}/compatibility?userId1=${userId1}&userId2=${userId2}`
      );
      if (!response.ok) throw new Error("Failed to load match details");
      const data = await response.json();
      setCompatibility(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load match details");
    } finally {
      setLoading(false);
    }
  };

  const loadMessageSuggestion = async () => {
    try {
      const response = await fetch(
        `/api/user/${userId1}/matches/${matchId}/suggest-opener`,
        { method: "POST" }
      );
      if (!response.ok) throw new Error("Failed to get message suggestion");
      const data = await response.json();
      setMessageSuggestion(data.suggestion || data.message || "No suggestion available");
    } catch (err) {
      console.error("Failed to load message suggestion:", err);
    }
  };

  if (loading) {
    return <div className="match-detail loading">Loading match details...</div>;
  }

  if (error) {
    return (
      <div className="match-detail error">
        <p>Error: {error}</p>
        <button onClick={onBack}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="match-detail">
      <header>
        <button onClick={onBack}>← Back</button>
        <h2>Match Details</h2>
        <p>Match ID: {matchId}</p>
      </header>

      {compatibility && (
        <section className="compatibility-section">
          <CompatibilityMap compatibility={compatibility} />
        </section>
      )}

      <section className="actions-section">
        <h3>Suggested Actions</h3>
        <button onClick={loadMessageSuggestion}>
          Get Message Suggestion
        </button>
        {messageSuggestion && (
          <div className="message-suggestion">
            <p><strong>Suggested opener:</strong></p>
            <p>{messageSuggestion}</p>
          </div>
        )}
      </section>
    </div>
  );
};

