import { NextResponse } from 'next/server';
import { getServerEnv, isConfiguredSecret } from '@/lib/env';

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeContactPayload(payload: ContactPayload) {
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const message = typeof payload.message === 'string' ? payload.message.trim() : '';

  if (name.length < 2 || name.length > 120) return { error: 'Name must be between 2 and 120 characters.' };
  if (!isValidEmail(email) || email.length > 180) return { error: 'Enter a valid email address.' };
  if (message.length < 10 || message.length > 4000) return { error: 'Message must be between 10 and 4000 characters.' };

  return { value: { name, email, message } };
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as ContactPayload | null;

  if (!payload) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const result = normalizeContactPayload(payload);

  if ('error' in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  const { name, email, message } = result.value;
  const env = getServerEnv();

  try {
    if (env.formspreeEndpoint) {
      const response = await fetch(env.formspreeEndpoint, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, source: 'minimal-photo-archive' })
      });

      if (!response.ok) throw new Error('Formspree delivery failed.');
    } else if (isConfiguredSecret(env.resendApiKey, 're_') && env.contactToEmail) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Portfolio Contact <onboarding@resend.dev>',
          to: [env.contactToEmail],
          reply_to: email,
          subject: `Portfolio inquiry from ${name}`,
          text: `Name: ${name}\nEmail: ${email}\n\n${message}`
        })
      });

      if (!response.ok) throw new Error('Resend delivery failed.');
    } else {
      console.log('CONTACT_FORM_SIMULATION', { name, email, message });
    }

    return NextResponse.json({ ok: true, message: 'Inquiry received.' });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unable to send inquiry.' },
      { status: 502 }
    );
  }
}
