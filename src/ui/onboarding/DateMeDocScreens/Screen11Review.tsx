import React from "react";

type Props = {
  docText: string;
  onComplete: () => void;
  onBack: () => void;
};

export const DateMeDocScreen11Review: React.FC<Props> = ({ docText, onComplete, onBack }) => {
  const handleSubmit = () => {
    // Just pass the doc text to parent, let parent handle submission
    onComplete();
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h2>Review your Date-Me Doc</h2>
        </div>

        <p className="onboarding-subheader">Review your document before submitting.</p>

        <div
          style={{
            marginBottom: "2rem",
            padding: "1.5rem",
            backgroundColor: "var(--loveops-bg-soft)",
            borderRadius: "8px",
            maxHeight: "400px",
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            fontSize: "0.9rem",
            lineHeight: "1.6",
          }}
        >
          {docText}
        </div>

        <button className="cta-primary" onClick={handleSubmit}>
          Submit & Continue
        </button>

        <button className="cta-secondary" onClick={onBack} style={{ marginTop: "1rem" }}>
          ← Back
        </button>
      </div>
    </div>
  );
};

