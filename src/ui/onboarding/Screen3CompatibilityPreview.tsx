import React from "react";

type Props = {
  compatibility: {
    emotionalRhythm: string;
    communication: string;
    preferences: string;
  };
  finalReport?: string;
  onContinue: () => void;
};

export const Screen3CompatibilityPreview: React.FC<Props> = ({ compatibility, finalReport, onContinue }) => {
  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h2>Your Compatibility Preview</h2>
        </div>
        
        {finalReport ? (
          // Show synthesized report if available
          <div className="compatibility-card">
            <div className="compatibility-report" style={{ 
              whiteSpace: 'pre-wrap', 
              lineHeight: '1.6',
              fontSize: '1.1rem',
              padding: '1.5rem',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              {finalReport}
            </div>
            
            {/* Also show individual insights */}
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 600 }}>Key Insights</h3>
              <div className="compatibility-insight">
                <strong>Emotional Rhythm:</strong> {compatibility.emotionalRhythm}
              </div>
              
              <div className="compatibility-insight">
                <strong>Communication:</strong> {compatibility.communication}
              </div>
              
              <div className="compatibility-insight">
                <strong>Preferences:</strong> {compatibility.preferences}
              </div>
            </div>
          </div>
        ) : (
          // Fallback to individual insights if no report
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
        )}
        
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

