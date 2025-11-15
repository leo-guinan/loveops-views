import React, { useState } from "react";

type Props = {
  onComplete: (whoYouAre: string) => void;
  onBack: () => void;
};

export const DateMeDocScreen2WhoYouAre: React.FC<Props> = ({ onComplete, onBack }) => {
  const [whoYouAre, setWhoYouAre] = useState("");

  const handleSubmit = () => {
    if (whoYouAre.trim()) {
      onComplete(whoYouAre.trim());
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h2>Who are you in relationships?</h2>
        </div>

        <p className="onboarding-subheader">
          Write a short paragraph about who you are in relationships. What makes you, you?
        </p>

        <div style={{ marginBottom: "2rem" }}>
          <textarea
            value={whoYouAre}
            onChange={(e) => setWhoYouAre(e.target.value)}
            placeholder="I'm someone who..."
            className="onboarding-textarea"
            rows={6}
            autoFocus
          />
        </div>

        <button className="cta-primary" onClick={handleSubmit} disabled={!whoYouAre.trim()}>
          Continue
        </button>

        <button className="cta-secondary" onClick={onBack} style={{ marginTop: "1rem" }}>
          ← Back
        </button>
      </div>
    </div>
  );
};

