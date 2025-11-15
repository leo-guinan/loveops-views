import React from "react";

type Props = {
  onContinue: () => void;
};

export const Screen9EngineLive: React.FC<Props> = ({ onContinue }) => {
  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="success-container">
          <div className="success-glow">
            <div className="success-icon">✨</div>
          </div>
          
          <div className="onboarding-header">
            <h2>Your Compatibility Engine is active.</h2>
          </div>
          
          <p className="onboarding-subheader">
            We've started preparing curated sparks matched to your relational architecture.
          </p>
          
          <button className="cta-primary" onClick={onContinue}>
            Meet My First Spark →
          </button>
        </div>
      </div>
    </div>
  );
};

