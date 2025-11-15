import React from "react";

type Props = {
  onUploadDoc: () => void;
  onNoDoc: () => void;
  onCreateDoc?: () => void;
};

export const Screen0Landing: React.FC<Props> = ({ onUploadDoc, onNoDoc, onCreateDoc }) => {
  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h1>LoveOps</h1>
          <h2>Dating without time-violence.</h2>
        </div>
        
        <div className="spark-line" />
        
        <p className="onboarding-subheader">
          Upload your Date-Me Doc and we'll generate your personalized spark intro.
        </p>
        
        <button className="cta-primary" onClick={onUploadDoc}>
          Upload Your Doc
        </button>
        
        {onCreateDoc && (
          <button className="cta-primary" onClick={onCreateDoc} style={{ marginTop: "1rem" }}>
            Create Date-Me Doc
          </button>
        )}
        
        <button className="cta-secondary" onClick={onNoDoc}>
          I don't have a doc yet.
        </button>
      </div>
    </div>
  );
};

