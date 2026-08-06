// backend/src/utils/sanitizeLogs.ts
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'verificationtoken',
  'resettoken',
  'otp',
  'secret',
  'api_secret',
  'razorpay_signature',
  'authorization',
  'cookie',
  'cvv',
  'cardnumber',
  'creditcard',
  'ssn',
  'pan',
  'privatekey',
  'apikey',
  'x-api-key',
];

/**
 * Escape HTML special characters so log data is safe if ever rendered in a
 * web UI (addresses Issue 11 — XSS via log viewer output).
 * NOTE: This is NOT a substitute for a proper output-encoding library in
 * production HTML rendering — it is a defence-in-depth measure only.
 */
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

/** Redact string values that look like JWT or Bearer tokens. */
const looksLikeToken = (value: unknown): boolean => {
  if (typeof value !== 'string') return false;
  // JWT: three base64url segments separated by dots
  if (/^[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}$/.test(value)) return true;
  // Bearer header value
  if (/^Bearer\s+\S{20,}/i.test(value)) return true;
  return false;
};

export const sanitizeLogData = (data: unknown): unknown => {
  if (typeof data === 'string') {
    if (looksLikeToken(data)) return '[REDACTED]';
    return escapeHtml(data);
  }

  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return (data as unknown[]).map(item => sanitizeLogData(item));
  }

  const sanitized: Record<string, unknown> = { ...(data as Record<string, unknown>) };

  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (looksLikeToken(sanitized[key])) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'string') {
      sanitized[key] = escapeHtml(sanitized[key] as string);
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  });

  return sanitized;
};
