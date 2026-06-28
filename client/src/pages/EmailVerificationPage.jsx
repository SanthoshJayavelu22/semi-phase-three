import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import Toast from '../Components/Toast';
import authService from '../api/auth';

const EmailVerificationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided. Please check your email link.');
        return;
      }

      try {
        setStatus('verifying');
        setMessage('Verifying your email address...');
        
        // Call the API with the token
        const response = await authService.verifyEmail(token);
        
        // Check if verification was successful
        if (response.status === 200) {
          setStatus('success');
          setMessage('Your email has been verified successfully! You can now login to your account.');
          
          // Update user in localStorage if exists
          const storedUser = localStorage.getItem('semi_user');
          if (storedUser) {
            try {
              const user = JSON.parse(storedUser);
              user.emailVerified = true;
              localStorage.setItem('semi_user', JSON.stringify(user));
              setEmail(user.email || '');
            } catch (e) {
              console.warn('Could not update user in localStorage:', e);
            }
          }
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/institute/login');
          }, 3000);
        }
      } catch (err) {
        console.error('Verification error:', err);
        
        // Check for specific error responses
        if (err.response?.status === 400) {
          setStatus('error');
          setMessage('The verification link is invalid or has already been used. Please try registering again.');
        } else if (err.response?.status === 404) {
          setStatus('error');
          setMessage('Verification token not found. The link may have expired.');
        } else {
          setStatus('error');
          setMessage(err.response?.data?.message || err.message || 'Verification failed. Please try again.');
        }
      }
    };

    verifyEmail();
  }, [token, navigate]);

  const handleResendVerification = async () => {
    try {
      // Get user email from localStorage
      const storedUser = localStorage.getItem('semi_user');
      if (!storedUser) {
        setToast({ message: 'Please register again to receive a new verification email.', type: 'warning' });
        setTimeout(() => navigate('/institute/register'), 3000);
        return;
      }
      
      const user = JSON.parse(storedUser);
      await authService.forgotPassword(user.email);
      setToast({ message: 'A new verification email has been sent to your registered email address.', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to resend verification email. Please try again later.', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 text-center">
        
        {/* Logo/Brand */}
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center shadow-inner border border-blue-100">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Status Content */}
        {status === 'verifying' && (
          <>
            <div className="flex justify-center mb-6">
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Verifying Your Email</h2>
            <p className="text-gray-500 mt-2 text-sm font-medium">{message}</p>
            <div className="mt-6 bg-gray-50 rounded-xl p-4">
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
              <p className="text-xs text-gray-400 mt-2 font-semibold">Please wait while we verify your email address...</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border-4 border-green-100">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-gray-900">Email Verified!</h2>
            <p className="text-gray-600 mt-2 text-sm font-medium leading-relaxed">
              {message}
            </p>
            {email && (
              <div className="mt-3 bg-blue-50 rounded-xl p-3 text-xs font-bold text-blue-800">
                Verified Email: {email}
              </div>
            )}
            <div className="mt-6 flex flex-col gap-3">
              <div className="text-sm text-gray-400 font-medium">
                Redirecting to login in a few seconds...
              </div>
              <button
                onClick={() => navigate('/institute/login')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-colors shadow-md text-sm uppercase tracking-wider"
              >
                Go to Login Now
              </button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center border-4 border-red-100">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-gray-900">Verification Failed</h2>
            <p className="text-gray-600 mt-2 text-sm font-medium leading-relaxed">
              {message}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={handleResendVerification}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-colors shadow-md text-sm uppercase tracking-wider"
              >
                Resend Verification Email
              </button>
              <button
                onClick={() => navigate('/institute/register')}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-xl transition-colors text-sm uppercase tracking-wider"
              >
                Register Again
              </button>
              <button
                onClick={() => navigate('/institute/login')}
                className="text-sm text-gray-400 hover:text-gray-600 font-semibold transition-colors"
              >
                Back to Login
              </button>
            </div>
          </>
        )}
      </div>
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

export default EmailVerificationPage;