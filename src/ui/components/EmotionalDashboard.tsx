import React from "react";
// Placeholder import - replace with actual package when available
// import { EmotionalLoadState } from "loveops-world-model";
import type { EmotionalLoadState } from "../../types/loveops-world-model";

type Props = {
  emotionalState: EmotionalLoadState;
};

export const EmotionalDashboard: React.FC<Props> = ({ emotionalState }) => {
  const { currentLoad, trends, riskFactors } = emotionalState;

  return (
    <div className="emotional-dashboard">
      <h3>Emotional Load Dashboard</h3>
      
      <div className="current-load">
        <h4>Current Load</h4>
        <div className="load-indicator">
          <div 
            className="load-bar" 
            style={{ width: `${currentLoad * 100}%` }}
          />
          <span>{Math.round(currentLoad * 100)}%</span>
        </div>
      </div>

      <div className="trends">
        <h4>Trends</h4>
        <ul>
          {trends.map((trend: { direction: "increasing" | "decreasing"; description: string }, i: number) => (
            <li key={i}>
              {trend.direction === "increasing" ? "↑" : "↓"} {trend.description}
            </li>
          ))}
        </ul>
      </div>

      {riskFactors.length > 0 && (
        <div className="risk-factors">
          <h4>Risk Factors</h4>
          <ul>
            {riskFactors.map((factor: string, i: number) => (
              <li key={i}>{factor}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

