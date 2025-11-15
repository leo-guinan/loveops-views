import React, { useState } from "react";

type Props = {
  onComplete: (howToStart: string) => void;
  onBack: () => void;
};

export const DateMeDocScreen8HowToStart: React.FC<Props> = ({ onComplete, onBack }) => {
  const [howToStart, setHowToStart] = useState("");

  const handleSubmit = () => {
    if (howToStart.trim()) {
      onComplete(howToStart.trim());
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h2>How I like to start</h2>
        </div>

        <p className="onboarding-subheader">
          Describe your ideal first contact and pacing. How do you prefer to begin?
        </p>

        <div style={{ marginBottom: "2rem" }}>
          <textarea
            value={howToStart}
            onChange={(e) => setHowToStart(e.target.value)}
            placeholder="I like to start by..."
            className="onboarding-textarea"
            rows={6}
            autoFocus
          />
        </div>

        <button className="cta-primary" onClick={handleSubmit} disabled={!howToStart.trim()}>
          Continue
        </button>

        <button className="cta-secondary" onClick={onBack} style={{ marginTop: "1rem" }}>
          ← Back
        </button>
      </div>
    </div>
  );
};

