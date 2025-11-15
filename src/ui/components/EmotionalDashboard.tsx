import React from "react";
// Placeholder import - replace with actual package when available
// import { EmotionalLoadState } from "loveops-world-model";
import type { EmotionalLoadState } from "../../types/loveops-world-model";

type Props = {
  emotionalState: EmotionalLoadState;
};

export const EmotionalDashboard: React.FC<Props> = ({ emotionalState }) => {
  const {
    burnoutLevel,
    averageVibePast30d,
    averageSafetyPast30d,
    varianceOfExperiences,
    recommendedPaceAdjustment,
  } = emotionalState;

  return (
    <div className="emotional-dashboard">
      <h3>Emotional Load Dashboard</h3>
      
      <div className="burnout-level">
        <h4>Burnout Level</h4>
        <div className="load-indicator">
          <div 
            className="load-bar" 
            style={{ width: `${burnoutLevel * 100}%` }}
          />
          <span>{Math.round(burnoutLevel * 100)}%</span>
        </div>
      </div>

      <div className="metrics">
        <h4>Past 30 Days</h4>
        <ul>
          {averageVibePast30d !== null && (
            <li>Average Vibe: {averageVibePast30d.toFixed(2)}</li>
          )}
          {averageSafetyPast30d !== null && (
            <li>Average Safety: {averageSafetyPast30d.toFixed(2)}</li>
          )}
          {varianceOfExperiences !== null && (
            <li>Experience Variance: {varianceOfExperiences.toFixed(2)}</li>
          )}
        </ul>
      </div>

      <div className="recommendation">
        <h4>Recommended Pace</h4>
        <p>
          {recommendedPaceAdjustment === "slow_down" && "↓ Slow down"}
          {recommendedPaceAdjustment === "keep" && "→ Keep current pace"}
          {recommendedPaceAdjustment === "invite_reflection" && "💭 Invite reflection"}
          {recommendedPaceAdjustment === "opt_in_experiments" && "🧪 Opt into experiments"}
        </p>
      </div>
    </div>
  );
};

