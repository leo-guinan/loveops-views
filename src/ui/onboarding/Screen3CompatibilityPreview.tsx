import React from "react";

type Props = {
  compatibility: {
    emotionalRhythm: string;
    communication: string;
    preferences: string;
  };
  onContinue: () => void;
};

export const Screen3CompatibilityPreview: React.FC<Props> = ({ compatibility, onContinue }) => {
  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h2>Your Compatibility Preview</h2>
        </div>
        
        <div className="compatibility-card">
          <div className="compatibility-insight">
            {compatibility.emotionalRhythm}
          </div>
          
          <div className="compatibility-insight">
            {compatibility.communication}
          </div>
          
          <div className="compatibility-insight">
            {compatibility.preferences}
          </div>
        </div>
        
        <p className="onboarding-subheader" style={{ marginTop: '2rem' }}>
          This should feel scary accurate.
        </p>
        
        <button className="cta-primary" onClick={onContinue}>
          Continue → Generate My Spark Intro
        </button>
      </div>
    </div>
  );
};

