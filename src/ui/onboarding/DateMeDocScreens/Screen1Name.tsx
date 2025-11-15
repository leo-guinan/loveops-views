import React, { useState } from "react";

type Props = {
  onComplete: (name: string) => void;
  onCancel: () => void;
};

export const DateMeDocScreen1Name: React.FC<Props> = ({ onComplete, onCancel }) => {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (name.trim()) {
      onComplete(name.trim());
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h2>Let's create your Date-Me Doc</h2>
        </div>

        <p className="onboarding-subheader">Start by telling us your name.</p>

        <div style={{ marginBottom: "2rem" }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="onboarding-input"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === "Enter" && name.trim()) {
                handleSubmit();
              }
            }}
          />
        </div>

        <button className="cta-primary" onClick={handleSubmit} disabled={!name.trim()}>
          Continue
        </button>

        <button className="cta-secondary" onClick={onCancel} style={{ marginTop: "1rem" }}>
          Cancel
        </button>
      </div>
    </div>
  );
};

