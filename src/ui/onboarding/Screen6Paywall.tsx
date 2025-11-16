import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthProvider";

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
  const { authenticated, user, login, loading: authLoading } = useAuth();
  const [showClarity, setShowClarity] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Require authentication before payment
  useEffect(() => {
    if (!authLoading && !authenticated) {
      // User not authenticated, show login prompt
      // The component will show login button below
    }
  }, [authenticated, authLoading]);

  const handleWhyFee = () => {
    setShowClarity(true);
  };

  const handleActivate = async () => {
    // Require authentication before payment
    if (!authenticated) {
      alert("Please sign in with Twitter to continue with payment.");
      login();
      return;
    }
    
    setLoading(true);
    try {
      // Use authenticated user's email if available
      const userEmail = email || (user?.twitterUsername ? `${user.twitterUsername}@twitter` : undefined);
      
      const response = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.userId || userId, // Use authenticated userId if available
          email: userEmail,
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
        
        {!authenticated ? (
          <>
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#fff3cd', 
              borderRadius: '8px', 
              marginBottom: '1rem',
              border: '1px solid #ffc107'
            }}>
              <p style={{ margin: 0, color: '#856404', fontSize: '0.9rem' }}>
                <strong>Sign in required:</strong> Please sign in with Twitter to activate your profile and ensure your progress is saved.
              </p>
            </div>
            <button 
              className="cta-primary" 
              onClick={login}
              disabled={authLoading}
            >
              {authLoading ? "Signing in..." : "Sign in with Twitter"}
            </button>
          </>
        ) : (
          <>
            {user && (
              <div style={{ 
                padding: '0.75rem', 
                backgroundColor: '#d4edda', 
                borderRadius: '8px', 
                marginBottom: '1rem',
                fontSize: '0.9rem',
                color: '#155724'
              }}>
                ✓ Signed in as @{user.twitterUsername}
              </div>
            )}
            <button 
              className="cta-primary" 
              onClick={handleActivate}
              disabled={loading}
            >
              {loading ? "Redirecting to payment..." : "Activate for $100"}
            </button>
          </>
        )}
        
        <button className="cta-secondary" onClick={handleWhyFee}>
          Why is there an onboarding fee?
        </button>
      </div>
    </div>
  );
};

