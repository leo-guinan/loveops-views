import React, { useState } from "react";

type Props = {
  onComplete: (sureAbout: string) => void;
  onBack: () => void;
};

export const DateMeDocScreen6SureAbout: React.FC<Props> = ({ onComplete, onBack }) => {
  const [sureAbout, setSureAbout] = useState("");

  const handleSubmit = () => {
    if (sureAbout.trim()) {
      onComplete(sureAbout.trim());
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h2>What I'm sure about</h2>
        </div>

        <p className="onboarding-subheader">
          Share your life-direction certainties: kids, geography, relationship structure, growth.
        </p>

        <div style={{ marginBottom: "2rem" }}>
          <textarea
            value={sureAbout}
            onChange={(e) => setSureAbout(e.target.value)}
            placeholder="I'm certain about..."
            className="onboarding-textarea"
            rows={6}
            autoFocus
          />
        </div>

        <button className="cta-primary" onClick={handleSubmit} disabled={!sureAbout.trim()}>
          Continue
        </button>

        <button className="cta-secondary" onClick={onBack} style={{ marginTop: "1rem" }}>
          ← Back
        </button>
      </div>
    </div>
  );
};

