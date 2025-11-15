import React, { useState } from "react";

type Props = {
  onInvite: (email: string) => void;
  onSkip: () => void;
};

export const Screen11InviteFriend: React.FC<Props> = ({ onInvite, onSkip }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onInvite(email);
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h2>Want a friend to help?</h2>
        </div>
        
        <p className="onboarding-subheader">
          Add someone you trust as a LoveOps Steward to refine your sparks.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Friend's Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
            />
          </div>
          
          <button type="submit" className="cta-primary">
            Invite Friend
          </button>
          
          <button type="button" className="cta-secondary" onClick={onSkip}>
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
};

