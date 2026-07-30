export const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

const PAYMENT_STORAGE_KEY = 'semi_payment_state';

export const savePaymentState = (state) => {
  try {
    sessionStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify({
      ...state,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.warn('Failed to save payment state:', e);
  }
};

export const getPaymentState = () => {
  try {
    const data = sessionStorage.getItem(PAYMENT_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
        return parsed;
      }
      sessionStorage.removeItem(PAYMENT_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Failed to get payment state:', e);
  }
  return null;
};

export const clearPaymentState = () => {
  sessionStorage.removeItem(PAYMENT_STORAGE_KEY);
};

export const initiateRazorpayPayment = async ({
  orderId,
  amount,
  currency = 'INR',
  keyId,
  name = 'Semi Phase 3',
  description = 'Payment Transaction',
  prefill = {},
  onSuccess,
  onDismiss,
  onFailure,
  paymentType = 'institute',
  additionalData = {},
}) => {
  const res = await loadRazorpay();

  if (!res) {
    alert('Razorpay SDK failed to load. Are you online?');
    if (onDismiss) onDismiss();
    return;
  }

  savePaymentState({
    orderId,
    amount,
    currency,
    paymentType,
    additionalData,
    prefill,
    description,
    status: 'initiated',
  });

  const options = {
    key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: amount.toString(),
    currency,
    name,
    description,
    order_id: orderId,
    handler: function (response) {
      clearPaymentState();
      if (onSuccess) onSuccess(response);
    },
    prefill: {
      name: prefill.name || '',
      email: prefill.email || '',
      contact: prefill.contact || ''
    },
    theme: {
      color: '#0146d8'
    },
    modal: {
      ondismiss: function () {
        if (onDismiss) onDismiss();
      }
    }
  };

  const paymentObject = new window.Razorpay(options);

  if (onFailure) {
    paymentObject.on('payment.failed', function (response) {
      if (onFailure) onFailure(response.error);
    });
  }

  paymentObject.open();
};

export const checkPendingPayment = async (checkStatusFn, onRecovered, onError) => {
  const pendingState = getPaymentState();
  if (!pendingState) return;

  try {
    const result = await checkStatusFn(pendingState);
    if (result && result.paymentStatus === 'Completed') {
      clearPaymentState();
      if (onRecovered) onRecovered(result);
    } else {
      if (onError) onError('Payment is still being processed. Please wait or try again.');
    }
  } catch (error) {
    console.error('Failed to check pending payment:', error);
    if (onError) onError('Failed to verify payment status. Please try again.');
  }
};