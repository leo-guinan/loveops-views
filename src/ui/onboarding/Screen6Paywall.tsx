import React, { useState, useEffect } from "react";

type Props = {
  userId: string;
  email?: string;
  referralCode?: string;
  onPaymentComplete: () => void;
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

export const Screen6Paywall: React.FC<Props> = ({ userId, email, referralCode, onPaymentComplete, onWhyFee }) => {
  const [showClarity, setShowClarity] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleWhyFee = () => {
    setShowClarity(true);
  };

  const handleActivate = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          email: email || undefined, // Don't send empty string
          referralCode: referralCode || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || errorData.details || "Failed to create checkout session");
      }

      const data = await response.json();
      
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received from server");
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to start payment process: ${errorMessage}\n\nPlease check your browser console for details.`);
      setLoading(false);
    }
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
        
        <button 
          className="cta-primary" 
          onClick={handleActivate}
          disabled={loading}
        >
          {loading ? "Redirecting to payment..." : "Activate for $100"}
        </button>
        
        <button className="cta-secondary" onClick={handleWhyFee}>
          Why is there an onboarding fee?
        </button>
      </div>
    </div>
  );
};

