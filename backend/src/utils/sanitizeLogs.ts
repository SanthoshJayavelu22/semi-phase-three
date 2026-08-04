// backend/src/utils/sanitizeLogs.ts
export const sanitizeLogData = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = [
    'password', 
    'token', 
    'accessToken', 
    'refreshToken', 
    'verificationToken', 
    'resetToken', 
    'otp', 
    'secret', 
    'api_secret', 
    'razorpay_signature'
  ];

  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogData(item));
  }

  const sanitized: Record<string, any> = { ...data };

  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  });

  return sanitized;
};
