import React, { useState } from "react";

type Props = {
  onComplete: (reachOut: string) => void;
  onBack: () => void;
};

export const DateMeDocScreen10ReachOut: React.FC<Props> = ({ onComplete, onBack }) => {
  const [reachOut, setReachOut] = useState("");

  const handleSubmit = () => {
    if (reachOut.trim()) {
      onComplete(reachOut.trim());
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h2>How to reach out</h2>
        </div>

        <p className="onboarding-subheader">
          Write a simple invitation and suggested prompt for how people should reach out to you.
        </p>

        <div style={{ marginBottom: "2rem" }}>
          <textarea
            value={reachOut}
            onChange={(e) => setReachOut(e.target.value)}
            placeholder="If this resonates, reach out by..."
            className="onboarding-textarea"
            rows={6}
            autoFocus
          />
        </div>

        <button className="cta-primary" onClick={handleSubmit} disabled={!reachOut.trim()}>
          Continue
        </button>

        <button className="cta-secondary" onClick={onBack} style={{ marginTop: "1rem" }}>
          ← Back
        </button>
      </div>
    </div>
  );
};

