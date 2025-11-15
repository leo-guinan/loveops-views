import React, { useState, useRef } from "react";

type Props = {
  onDocUploaded: (file: File) => void;
  onBack: () => void;
};

export const Screen1DocUpload: React.FC<Props> = ({ onDocUploaded, onBack }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    const validTypes = ['application/pdf', 'text/plain', 'text/markdown'];
    const validExtensions = ['.pdf', '.txt', '.md', '.markdown'];
    const fileName = file.name.toLowerCase();
    
    const isValidType = validTypes.includes(file.type) || 
                        validExtensions.some(ext => fileName.endsWith(ext));
    
    if (isValidType) {
      onDocUploaded(file);
    } else {
      alert('Please upload a PDF, markdown, or plain text file.');
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h2>Your story belongs here.</h2>
        </div>
        
        <p className="onboarding-subheader">
          We'll analyze your personality architecture and create your first spark intro.
        </p>
        
        <div
          className={`upload-area ${isDragging ? 'dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-icon">📄</div>
          <div className="upload-text">
            <strong>Drop your doc here</strong>
            <br />
            PDF, markdown, or plain text — no formatting needed.
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.markdown"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        <button className="cta-secondary" onClick={onBack}>
          ← Back
        </button>
      </div>
    </div>
  );
};

