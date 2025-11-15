import React, { useEffect, useState } from "react";

type Props = {
  sessionId: string;
  userId: string;
  onComplete: () => void;
};

export const Screen7PaymentSuccess: React.FC<Props> = ({ sessionId, userId, onComplete }) => {
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/payment/verify?session_id=${sessionId}`);
        
        if (!response.ok) {
          throw new Error("Failed to verify payment");
        }

        const data = await response.json();
        
        if (data.success) {
          // Payment verified, proceed to next screen
          setTimeout(() => {
            onComplete();
          }, 1500);
        } else {
          setError("Payment verification failed. Please contact support.");
          setVerifying(false);
        }
      } catch (err) {
        console.error("Error verifying payment:", err);
        setError("Failed to verify payment. Please contact support.");
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, onComplete]);

  if (error) {
    return (
      <div className="onboarding-container">
        <div className="onboarding-card">
          <div className="onboarding-header">
            <h2>Payment Verification Error</h2>
          </div>
          <p className="onboarding-subheader" style={{ color: "var(--loveops-secondary)" }}>
            {error}
          </p>
          <button className="cta-primary" onClick={() => window.location.href = "/"}>
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="success-container">
          <div className="success-glow">
            <div className="success-icon">✓</div>
          </div>
          
          <div className="onboarding-header">
            <h2>Payment Successful!</h2>
          </div>
          
          <p className="onboarding-subheader">
            {verifying ? "Verifying your payment..." : "Your LoveOps profile has been activated."}
          </p>
        </div>
      </div>
    </div>
  );
};

