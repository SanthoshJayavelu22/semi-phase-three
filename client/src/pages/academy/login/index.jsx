import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import authService from '../../../api/auth';
import InstitutionalLayout from '../../institute/InstitutionalLayout';
import AcademyLoginForm from '../components/AcademyLogin';
import Toast from '../../../Components/Toast';

/**
 * Academy Login Page  (/academy/login)
 * ──────────────────────────────────────
 * Standalone login page for the Academic Board Portal.
 * Stores session to localStorage and navigates to dashboard on success.
 */
export default function AcademyLoginPage() {
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ email: '', password: '', rememberMe: false });
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    const stored = localStorage.getItem('semi_board_user');
    if (stored) {
      navigate('/academy/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async e => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginForm.email || !loginForm.password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login({
        email: loginForm.email,
        password: loginForm.password,
      });

      const data = response.data || response;
      const userToken = data.accessToken || data.token || data.data?.accessToken;
      const userRefreshToken = data.refreshToken || data.data?.refreshToken;

      const userSession = {
        email: data.user?.email || loginForm.email,
        role: data.user?.role || 'board',
        ...data.user,
      };

      if (userToken) {
        localStorage.setItem('token', userToken);
        localStorage.setItem('semi_token', userToken);
      }
      if (userRefreshToken) {
        localStorage.setItem('refreshToken', userRefreshToken);
      }
      localStorage.setItem('semi_board_user', JSON.stringify(userSession));

      navigate('/academy/dashboard', { replace: true });
    } catch (err) {
      setErrorMsg(
        err.parsedMessage || err.message || 'Access Denied. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <InstitutionalLayout portalType="academy" hideHeaderFooter={false}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow flex flex-col justify-center w-full">
        <AcademyLoginForm
          loginForm={loginForm}
          setLoginForm={setLoginForm}
          errorMsg={null}       /* errors shown via Toast below */
          handleLogin={handleLogin}
          isLoading={isLoading}
        />
      </div>
      {errorMsg && <Toast message={errorMsg} type="error" onClose={() => setErrorMsg(null)} />}
    </InstitutionalLayout>
  );
}
