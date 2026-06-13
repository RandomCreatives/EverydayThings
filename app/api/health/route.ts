import { NextResponse } from 'next/server';
import { getPhotographs, getProjects } from '@/lib/data';
import { getServerEnv, hasSupabaseReadEnv, hasSupabaseWriteEnv, isConfiguredSecret } from '@/lib/env';

export async function GET() {
  const env = getServerEnv();
  const [photographs, projects] = await Promise.all([getPhotographs(), getProjects()]);

  return NextResponse.json({
    ok: true,
    environment: env.nodeEnv,
    siteUrl: env.siteUrl,
    counts: {
      photographs: photographs.length,
      projects: projects.length
    },
    integrations: {
      supabaseRead: hasSupabaseReadEnv(env) ? 'configured' : 'fallback-sample-data',
      supabaseWrite: hasSupabaseWriteEnv(env) ? 'configured' : 'disabled',
      chapa: isConfiguredSecret(env.chapaSecretKey) ? 'configured' : 'mock-verify',
      contact: env.formspreeEndpoint || isConfiguredSecret(env.resendApiKey, 're_') ? 'configured' : 'local-log'
    }
  });
}
