type RuntimeEnv = {
  nodeEnv: 'development' | 'test' | 'production';
  siteUrl: string;
  isProduction: boolean;
  // Chapa (replaces Stripe)
  chapaSecretKey?: string;
  chapaWebhookSecret?: string;
  // Supabase
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  // Contact form
  formspreeEndpoint?: string;
  resendApiKey?: string;
  contactToEmail?: string;
  // Admin
  adminUploadPassword?: string;
};

function trim(value: string | undefined) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function normalizeSiteUrl() {
  const explicit = trim(process.env.NEXT_PUBLIC_SITE_URL);
  if (explicit) return explicit.replace(/\/$/, '');

  const vercelUrl = trim(process.env.VERCEL_URL);
  if (vercelUrl) return `https://${vercelUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;

  return 'http://localhost:3000';
}

export function getServerEnv(): RuntimeEnv {
  const nodeEnv =
    process.env.NODE_ENV === 'production'
      ? 'production'
      : process.env.NODE_ENV === 'test'
        ? 'test'
        : 'development';

  return {
    nodeEnv,
    isProduction: nodeEnv === 'production',
    siteUrl: normalizeSiteUrl(),
    chapaSecretKey: trim(process.env.CHAPA_SECRET_KEY),
    chapaWebhookSecret: trim(process.env.CHAPA_WEBHOOK_SECRET),
    supabaseUrl: trim(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseServiceRoleKey: trim(process.env.SUPABASE_SERVICE_ROLE_KEY),
    formspreeEndpoint: trim(process.env.FORMSPREE_ENDPOINT),
    resendApiKey: trim(process.env.RESEND_API_KEY),
    contactToEmail: trim(process.env.CONTACT_TO_EMAIL),
    adminUploadPassword: trim(process.env.ADMIN_UPLOAD_PASSWORD),
  };
}

export function isConfiguredSecret(value: string | undefined, prefix?: string): value is string {
  if (!value) return false;
  if (value.includes('replace_me')) return false;
  if (prefix && !value.startsWith(prefix)) return false;
  return true;
}
