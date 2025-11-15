/**
 * Login Page Component
 * Shows login options (Twitter OAuth)
 */

import React from 'react';
import { LoginButton } from './LoginButton';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">LoveOps</h1>
          <p className="text-gray-600">Conscious dating for intentional connections</p>
        </div>
        
        <div className="mb-6">
          <LoginButton />
        </div>
        
        <p className="text-sm text-gray-500 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

