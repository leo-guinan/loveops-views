import React from "react";

type Props = {
  userId: string;
  onBack: () => void;
};

export const Screen7PaymentCancel: React.FC<Props> = ({ userId, onBack }) => {
  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h2>Payment Cancelled</h2>
        </div>
        
        <p className="onboarding-subheader">
          Your payment was cancelled. You can return to complete your activation at any time.
        </p>
        
        <button className="cta-primary" onClick={onBack}>
          Return to Activation
        </button>
        
        <button className="cta-secondary" onClick={() => window.location.href = "/"}>
          Return to Home
        </button>
      </div>
    </div>
  );
};

