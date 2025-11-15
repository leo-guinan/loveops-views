import React, { useState } from "react";

type Props = {
  onComplete: (signals: string[]) => void;
  onBack: () => void;
};

export const DateMeDocScreen9Signals: React.FC<Props> = ({ onComplete, onBack }) => {
  const [items, setItems] = useState<string[]>([""]);

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, ""]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    const validItems = items.filter((item) => item.trim());
    if (validItems.length >= 5) {
      onComplete(validItems);
    }
  };

  const validItems = items.filter((item) => item.trim());

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h2>Signals we might be a good match</h2>
        </div>

        <p className="onboarding-subheader">
          Share 5–10 bullets for the reader to self-identify. What signals compatibility?
        </p>

        <div style={{ marginBottom: "2rem" }}>
          {items.map((item, index) => (
            <div key={index} style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                value={item}
                onChange={(e) => handleItemChange(index, e.target.value)}
                placeholder={`Signal ${index + 1}`}
                className="onboarding-input"
                autoFocus={index === 0}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && item.trim() && index === items.length - 1) {
                    handleAddItem();
                  }
                }}
              />
              {items.length > 1 && (
                <button
                  className="cta-secondary"
                  onClick={() => handleRemoveItem(index)}
                  style={{ padding: "0.5rem 1rem" }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button className="cta-secondary" onClick={handleAddItem} style={{ marginTop: "0.5rem" }}>
            + Add another
          </button>
        </div>

        <button
          className="cta-primary"
          onClick={handleSubmit}
          disabled={validItems.length < 5}
        >
          Continue ({validItems.length}/5 minimum)
        </button>

        <button className="cta-secondary" onClick={onBack} style={{ marginTop: "1rem" }}>
          ← Back
        </button>
      </div>
    </div>
  );
};

