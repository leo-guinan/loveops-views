import React from "react";
// Placeholder import - replace with actual package when available
// import { MatchCompatibilityState } from "loveops-world-model";
import type { MatchCompatibilityState } from "../../types/loveops-world-model";

type Props = {
  compatibility: MatchCompatibilityState;
};

export const CompatibilityMap: React.FC<Props> = ({ compatibility }) => {
  const { userA, userB, compatibilityScore, axes, explanation } = compatibility;

  // Simple text-based version; later: nice radar chart
  return (
    <div className="compatibility-map">
      <h3>Compatibility Overview</h3>
      <p>Match between {userA} and {userB}</p>
      <p><strong>Overall Compatibility: {Math.round(compatibilityScore * 100)}%</strong></p>
      <ul>
        <li>Values Alignment: {Math.round(axes.valuesAlignment * 100)}%</li>
        <li>Lifestyle Overlap: {Math.round(axes.lifestyleOverlap * 100)}%</li>
        <li>Communication Fit: {Math.round(axes.communicationStyleFit * 100)}%</li>
        <li>Time-Violence Risk: {Math.round(axes.riskOfTimeViolence * 100)}%</li>
      </ul>
      <h4>Why this match?</h4>
      <ul>
        {explanation.map((line: string, i: number) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
};

