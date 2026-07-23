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
  onFailure
}) => {
  const res = await loadRazorpay();

  if (!res) {
    alert('Razorpay SDK failed to load. Are you online?');
    if (onDismiss) onDismiss();
    return;
  }

  const options = {
    key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: amount.toString(),
    currency,
    name,
    description,
    order_id: orderId,
    handler: function (response) {
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
