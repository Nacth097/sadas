import crypto from 'crypto';

export const sha256 = (value) =>
  crypto.createHash('sha256').update(value).digest('hex');

export const hmacSha256 = (payload, secret) =>
  crypto.createHmac('sha256', secret).update(payload).digest('hex');

export const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left || ''), 'utf8');
  const rightBuffer = Buffer.from(String(right || ''), 'utf8');
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};
