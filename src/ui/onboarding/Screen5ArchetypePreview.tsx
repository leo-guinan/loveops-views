import React from "react";

type Props = {
  archetype: {
    title: string;
    traits: string[];
  };
  onContinue: () => void;
};

export const Screen5ArchetypePreview: React.FC<Props> = ({ archetype, onContinue }) => {
  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h2>Match Archetype Preview</h2>
        </div>
        
        <div className="archetype-grid">
          <div className="archetype-card">
            <div className="archetype-title">{archetype.title}</div>
            <p style={{ color: 'var(--loveops-text-soft)', marginBottom: '1rem' }}>
              People who resonate with you often:
            </p>
            {archetype.traits.map((trait, i) => (
              <div key={i} className="archetype-trait">
                • {trait}
              </div>
            ))}
          </div>
        </div>
        
        <button className="cta-primary" onClick={onContinue}>
          Start My Compatibility Engine → (paywall)
        </button>
      </div>
    </div>
  );
};

