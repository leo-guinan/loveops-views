import React from "react";

type Match = {
  matchId: string;
  userId: string;
  compatibility: number;
  name?: string;
  lastInteraction?: string;
};

type Props = {
  matches: Match[];
  onMatchSelect: (matchId: string) => void;
};

export const MatchList: React.FC<Props> = ({ matches, onMatchSelect }) => {
  if (matches.length === 0) {
    return (
      <div className="match-list empty">
        <p>No matches yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="match-list">
      <h3>Your Matches</h3>
      <ul>
        {matches.map((match) => (
          <li 
            key={match.matchId} 
            className="match-item"
            onClick={() => onMatchSelect(match.matchId)}
          >
            <div className="match-header">
              <span className="match-name">{match.name || `User ${match.userId}`}</span>
              <span className="match-compatibility">
                {Math.round(match.compatibility * 100)}% match
              </span>
            </div>
            {match.lastInteraction && (
              <div className="match-meta">
                Last interaction: {new Date(match.lastInteraction).toLocaleDateString()}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

