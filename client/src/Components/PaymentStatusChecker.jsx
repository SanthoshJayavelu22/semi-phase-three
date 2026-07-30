import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { getPaymentState, clearPaymentState } from '../utils/razorpay';
import apiClient from '../api/apiClient';

export const PaymentStatusChecker = ({
  isOpen,
  onComplete,
  onRetry,
  onCancel,
  paymentType = 'institute',
  message = 'Verifying your payment...'
}) => {
  const [status, setStatus] = useState('checking');

  const terminalStatuses = ['completed', 'failed', 'no_payment'];

  useEffect(() => {
    if (!isOpen) return;

    const checkStatus = async () => {
      if (terminalStatuses.includes(status)) return;

      try {
        const pendingState = getPaymentState();
        if (!pendingState) {
          setStatus('no_payment');
          return;
        }

        const endpoint = paymentType === 'institute'
          ? `/institutes/payment/verify-order/${pendingState.orderId}`
          : `/academic/payment/verify-order/${pendingState.orderId}`;

        const params = paymentType !== 'institute' && pendingState.additionalData?.studentId
          ? { params: { studentId: pendingState.additionalData.studentId, purpose: pendingState.additionalData.purpose } }
          : {};

        const response = await apiClient.get(endpoint, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          ...params
        });
        const data = response.data?.data || response.data;

        if (data?.paymentStatus === 'Completed') {
          setStatus('completed');
          clearPaymentState();
          if (onComplete) onComplete(data);
        } else if (data?.paymentStatus === 'Pending') {
          setStatus('pending');
        } else {
          setStatus('failed');
        }
      } catch (error) {
        console.error('Status check failed:', error);
        setStatus('failed');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [isOpen, onComplete, paymentType, status]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-8 text-center">

        {status === 'checking' && (
          <>
            <div className="w-20 h-20 mx-auto mb-4">
              <Loader2 className="w-20 h-20 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Verifying Payment</h3>
            <p className="text-sm text-slate-500">{message}</p>
            <p className="text-xs text-slate-400 mt-4">This may take a few moments...</p>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="w-20 h-20 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
              <RefreshCw className="w-10 h-10 text-amber-600 animate-spin" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Payment Pending</h3>
            <p className="text-sm text-slate-500">Your payment is being processed. This usually takes a few seconds.</p>
            <div className="mt-6 flex gap-3 justify-center">
              <button
                onClick={() => setStatus('checking')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
              >
                Check Again
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {status === 'completed' && (
          <>
            <div className="w-20 h-20 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Payment Successful!</h3>
            <p className="text-sm text-slate-500">Your payment has been verified. You can now proceed.</p>
            <button
              onClick={() => {
                clearPaymentState();
                if (onComplete) onComplete();
              }}
              className="mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm uppercase tracking-wider transition-colors"
            >
              Continue
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-20 h-20 mx-auto mb-4 bg-rose-100 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-rose-600" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Payment Verification Failed</h3>
            <p className="text-sm text-slate-500">We couldn't verify your payment status. Please try again or contact support.</p>
            <div className="mt-6 flex gap-3 justify-center">
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
              >
                Retry Payment
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {status === 'no_payment' && (
          <>
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">No Pending Payment</h3>
            <p className="text-sm text-slate-500">No pending payment was found. Please initiate a new payment.</p>
            <button
              onClick={onCancel}
              className="mt-6 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm uppercase tracking-wider transition-colors"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
};