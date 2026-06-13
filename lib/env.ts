type RuntimeEnv = {
  nodeEnv: 'development' | 'test' | 'production';
  siteUrl: string;
  isProduction: boolean;
  // Chapa
  chapaSecretKey?: string;
  chapaWebhookSecret?: string;
  chapaVerifyBaseUrl: string;
  // Supabase
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  supabaseReceiptsBucket: string;
  // Contact form
  formspreeEndpoint?: string;
  resendApiKey?: string;
  contactToEmail?: string;
};

function trim(value: string | undefined) {
  const cleaned = value?.trim();
  return cleaned ? (cleaned.startsWith('=') ? cleaned.slice(1) : cleaned) : undefined;
}

function normalizeSiteUrl() {
  const explicit = trim(process.env.NEXT_PUBLIC_SITE_URL);
  const vercelUrl = trim(process.env.VERCEL_URL);

  // If explicit URL is definitely a placeholder, favor VERCEL_URL.
  // We exclude 'everydaythings.vercel.app' if it's the actual intended domain.
  const isPlaceholder = !explicit || explicit.includes('your-domain.com');

  if (explicit && !isPlaceholder) {
    let url = explicit;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url.replace(/\/$/, '');
  }

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
    chapaVerifyBaseUrl: trim(process.env.CHAPA_VERIFY_BASE_URL) ?? 'https://api.chapa.co/v1/transaction/verify',
    supabaseUrl: trim(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseServiceRoleKey: trim(process.env.SUPABASE_SERVICE_ROLE_KEY),
    supabaseReceiptsBucket: trim(process.env.SUPABASE_RECEIPTS_BUCKET) ?? 'receipts',
    formspreeEndpoint: trim(process.env.FORMSPREE_ENDPOINT),
    resendApiKey: trim(process.env.RESEND_API_KEY),
    contactToEmail: trim(process.env.CONTACT_TO_EMAIL),
  };
}

export function isConfiguredSecret(value: string | undefined, prefix?: string): value is string {
  if (!value) return false;
  if (value.includes('replace_me')) return false;
  if (prefix && !value.startsWith(prefix)) return false;
  return true;
}

export function hasSupabaseReadEnv(env: RuntimeEnv): boolean {
  return Boolean(env.supabaseUrl && !env.supabaseUrl.includes('replace-me'));
}

export function hasSupabaseWriteEnv(env: RuntimeEnv): boolean {
  return hasSupabaseReadEnv(env) && Boolean(env.supabaseServiceRoleKey);
}
