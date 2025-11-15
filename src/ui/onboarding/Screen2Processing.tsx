import React, { useState, useEffect } from "react";

type Props = {
  onComplete: () => void;
};

const PROCESSING_STEPS = [
  "Reading your relational patterns…",
  "Mapping your values signature…",
  "Extracting your emotional cadence…",
  "Generating your personalized spark…",
  "Calibrating your compatibility vectors…",
];

export const Screen2Processing: React.FC<Props> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < PROCESSING_STEPS.length) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Wait a bit before completing
      const timer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, onComplete]);

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="processing-container">
          <div className="thought-threads">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="thread" />
            ))}
          </div>
          
          {PROCESSING_STEPS.map((step, index) => (
            <div
              key={index}
              className="processing-step"
              style={{
                opacity: index <= currentStep ? 1 : 0.3,
                fontWeight: index === currentStep ? 500 : 400,
              }}
            >
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

