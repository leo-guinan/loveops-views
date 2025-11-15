import React from "react";

type Props = {
  sparkIntro: string;
  onContinue: () => void;
};

export const Screen4SparkIntro: React.FC<Props> = ({ sparkIntro, onContinue }) => {
  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h2>Your Spark Intro</h2>
        </div>
        
        <div className="spark-intro-card">
          <div className="spark-intro-text">
            "{sparkIntro}"
          </div>
        </div>
        
        <p className="onboarding-subheader" style={{ marginTop: '2rem' }}>
          This is the kind of opener that attracts people who will actually resonate with you.
        </p>
        
        <button className="cta-primary" onClick={onContinue}>
          Show Me My Resonance Type →
        </button>
      </div>
    </div>
  );
};

