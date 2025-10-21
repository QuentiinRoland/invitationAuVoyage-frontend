import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import ResetPasswordForm from './components/auth/ResetPasswordForm';

const RouterApp: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/reset-password/:uid/:token" element={<ResetPasswordForm />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </Router>
  );
};

export default RouterApp;


