import React, { useState } from 'react';
import RealLoginForm from './RealLoginForm';
import RealRegisterForm from './RealRegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot-password';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>(initialMode);

  if (!isOpen) return null;

  const handleSuccess = () => {
    onClose();
  };

  const switchToRegister = () => setMode('register');
  const switchToLogin = () => setMode('login');
  const switchToForgotPassword = () => setMode('forgot-password');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative max-w-md w-full">
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-background rounded-full p-2 shadow-lg hover:bg-accent z-10 border border-border"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {mode === 'login' ? (
          <RealLoginForm 
            onSuccess={handleSuccess} 
            onSwitchToRegister={switchToRegister}
            onSwitchToForgotPassword={switchToForgotPassword}
          />
        ) : mode === 'register' ? (
          <RealRegisterForm onSuccess={handleSuccess} onSwitchToLogin={switchToLogin} />
        ) : (
          <ForgotPasswordForm onBack={switchToLogin} />
        )}
      </div>
    </div>
  );
};

export default AuthModal;
