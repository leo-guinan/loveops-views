import React, { useState } from "react";

type Props = {
  onComplete: (data: {
    photo?: File;
    name: string;
    pronouns: string;
    city: string;
    pacing: string;
  }) => void;
};

export const Screen8AccountCreation: React.FC<Props> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    pronouns: '',
    city: '',
    pacing: 'normal',
  });
  const [photo, setPhoto] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      photo: photo || undefined,
      ...formData,
    });
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h2>Complete Your Profile</h2>
        </div>
        
        <p className="onboarding-subheader" style={{ marginBottom: '2rem' }}>
          These questions feel like settings, not hurdles.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Photo (optional)</label>
            <input
              type="file"
              accept="image/*"
              className="form-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPhoto(file);
              }}
            />
          </div>
          
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
            <label className="form-label">Pronouns</label>
            <input
              type="text"
              className="form-input"
              placeholder="she/her, he/him, they/them, etc."
              value={formData.pronouns}
              onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">City</label>
            <input
              type="text"
              className="form-input"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Preferred Pacing</label>
            <select
              className="form-input"
              value={formData.pacing}
              onChange={(e) => setFormData({ ...formData, pacing: e.target.value })}
              required
            >
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
            </select>
          </div>
          
          <button type="submit" className="cta-primary">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

