import React, { useState } from "react";

type Props = {
  onActivate: () => void;
  onWhyFee: () => void;
};

const FEATURES = [
  "Full Compatibility Map",
  "Expanded spark intros",
  "The LoveOps Funnel (micro-intros → resonance → reveal)",
  "Friend-Spark Engine",
  "Concierge-Designed dates",
  "Access to the Success Bounty model",
];

export const Screen6Paywall: React.FC<Props> = ({ onActivate, onWhyFee }) => {
  const [showClarity, setShowClarity] = useState(false);

  const handleWhyFee = () => {
    setShowClarity(true);
  };

  if (showClarity) {
    return (
      <div className="onboarding-container">
        <div className="onboarding-card">
          <div className="onboarding-header">
            <h2>Why is there an onboarding fee?</h2>
          </div>
          
          <p className="onboarding-subheader" style={{ textAlign: 'left', marginBottom: '2rem' }}>
            We charge one fee to ensure intentional, high-signal users and cover compute & analysis costs — not your attention.
          </p>
          
          <p style={{ color: 'var(--loveops-text-soft)', marginBottom: '2rem' }}>
            This fee helps us maintain a community of people who are serious about finding meaningful connections, 
            and covers the computational resources needed to analyze your relational architecture and generate 
            personalized compatibility vectors.
          </p>
          
          <button className="cta-primary" onClick={() => setShowClarity(false)}>
            I understand
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h2>Activate Your LoveOps Profile</h2>
        </div>
        
        <p className="onboarding-subheader">
          To begin meeting people who match your relational architecture, activate your LoveOps profile.
        </p>
        
        <div className="feature-list">
          {FEATURES.map((feature, i) => (
            <div key={i} className="feature-item">
              <span className="feature-icon">✓</span>
              <span className="feature-text">{feature}</span>
            </div>
          ))}
        </div>
        
        <button className="cta-primary" onClick={onActivate}>
          Activate for $100
        </button>
        
        <button className="cta-secondary" onClick={handleWhyFee}>
          Why is there an onboarding fee?
        </button>
      </div>
    </div>
  );
};

