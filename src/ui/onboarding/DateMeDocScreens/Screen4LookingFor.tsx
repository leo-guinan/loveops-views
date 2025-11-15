import React, { useState } from "react";

type Props = {
  onComplete: (lookingFor: string) => void;
  onBack: () => void;
};

export const DateMeDocScreen4LookingFor: React.FC<Props> = ({ onComplete, onBack }) => {
  const [lookingFor, setLookingFor] = useState("");

  const handleSubmit = () => {
    if (lookingFor.trim()) {
      onComplete(lookingFor.trim());
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h2>What I'm looking for</h2>
        </div>

        <p className="onboarding-subheader">
          Describe the dynamic and kind of partner you want. What are you seeking?
        </p>

        <div style={{ marginBottom: "2rem" }}>
          <textarea
            value={lookingFor}
            onChange={(e) => setLookingFor(e.target.value)}
            placeholder="I'm looking for someone who..."
            className="onboarding-textarea"
            rows={6}
            autoFocus
          />
        </div>

        <button className="cta-primary" onClick={handleSubmit} disabled={!lookingFor.trim()}>
          Continue
        </button>

        <button className="cta-secondary" onClick={onBack} style={{ marginTop: "1rem" }}>
          ← Back
        </button>
      </div>
    </div>
  );
};

