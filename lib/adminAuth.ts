import { createHmac, timingSafeEqual } from 'node:crypto';
import { getServerEnv } from './env';

export const ADMIN_UPLOAD_COOKIE = 'admin_upload_session';

function getSigningSecret() {
  const env = getServerEnv();
  return env.adminUploadPassword ?? 'development-admin-upload-disabled';
}

export function isAdminUploadConfigured() {
  const env = getServerEnv();
  return Boolean(env.adminUploadPassword);
}

export function createAdminUploadToken() {
  return createHmac('sha256', getSigningSecret()).update('admin-upload-v1').digest('hex');
}

export function verifyAdminUploadToken(token: string | undefined) {
  if (!token || !isAdminUploadConfigured()) return false;

  const expected = createAdminUploadToken();
  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expected);

  if (tokenBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(tokenBuffer, expectedBuffer);
}

export function verifyAdminUploadPassword(password: string) {
  const env = getServerEnv();
  if (!env.adminUploadPassword) return false;

  const submittedBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(env.adminUploadPassword);

  if (submittedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(submittedBuffer, expectedBuffer);
}
