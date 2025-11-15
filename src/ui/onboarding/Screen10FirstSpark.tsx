import React from "react";

type Props = {
  spark: {
    intro: string;
    question: string;
    anecdote: string;
  };
  onCurious: () => void;
  onNotForMe: () => void;
};

export const Screen10FirstSpark: React.FC<Props> = ({ spark, onCurious, onNotForMe }) => {
  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h2>Your First Spark</h2>
        </div>
        
        <div className="compatibility-card">
          <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', lineHeight: 1.8 }}>
            "{spark.intro}"
          </p>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <strong style={{ color: 'var(--loveops-text-primary)' }}>Spark Question:</strong>
            <p style={{ marginTop: '0.5rem', color: 'var(--loveops-text-soft)' }}>
              {spark.question}
            </p>
          </div>
          
          <div>
            <strong style={{ color: 'var(--loveops-text-primary)' }}>Anecdote Fragment:</strong>
            <p style={{ marginTop: '0.5rem', color: 'var(--loveops-text-soft)', fontStyle: 'italic' }}>
              {spark.anecdote}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button className="cta-primary" onClick={onCurious} style={{ flex: 1 }}>
            I'm curious →
          </button>
          <button className="cta-secondary" onClick={onNotForMe} style={{ flex: 1 }}>
            Not for me
          </button>
        </div>
      </div>
    </div>
  );
};

