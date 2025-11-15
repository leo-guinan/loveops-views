import React, { useState } from "react";

type Props = {
  onComplete: (figuringOut: string) => void;
  onBack: () => void;
};

export const DateMeDocScreen7FiguringOut: React.FC<Props> = ({ onComplete, onBack }) => {
  const [figuringOut, setFiguringOut] = useState("");

  const handleSubmit = () => {
    if (figuringOut.trim()) {
      onComplete(figuringOut.trim());
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h2>What I'm still figuring out</h2>
        </div>

        <p className="onboarding-subheader">
          Share a few honest unknowns you're open to exploring together.
        </p>

        <div style={{ marginBottom: "2rem" }}>
          <textarea
            value={figuringOut}
            onChange={(e) => setFiguringOut(e.target.value)}
            placeholder="I'm still exploring..."
            className="onboarding-textarea"
            rows={6}
            autoFocus
          />
        </div>

        <button className="cta-primary" onClick={handleSubmit} disabled={!figuringOut.trim()}>
          Continue
        </button>

        <button className="cta-secondary" onClick={onBack} style={{ marginTop: "1rem" }}>
          ← Back
        </button>
      </div>
    </div>
  );
};

