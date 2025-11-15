import React, { useState } from "react";

type Props = {
  onPaymentComplete: () => void;
  onBack: () => void;
};

export const Screen7Payment: React.FC<Props> = ({ onPaymentComplete, onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    card: '',
    referralCode: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would process payment
    // For now, just proceed
    onPaymentComplete();
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h2>Complete Activation</h2>
        </div>
        
        <p className="onboarding-subheader" style={{ marginBottom: '2rem' }}>
          We charge one fee to ensure intentional, high-signal users and cover compute & analysis costs — not your attention.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Card</label>
            <input
              type="text"
              className="form-input"
              placeholder="1234 5678 9012 3456"
              value={formData.card}
              onChange={(e) => setFormData({ ...formData, card: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Referral Code (optional)</label>
            <input
              type="text"
              className="form-input"
              value={formData.referralCode}
              onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
            />
          </div>
          
          <button type="submit" className="cta-primary">
            Complete Activation
          </button>
          
          <button type="button" className="cta-secondary" onClick={onBack}>
            ← Back
          </button>
        </form>
      </div>
    </div>
  );
};

