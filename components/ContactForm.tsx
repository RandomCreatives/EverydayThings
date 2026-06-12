'use client';

import { useState } from 'react';

type ContactState = 'idle' | 'loading' | 'success' | 'error';

export function ContactForm() {
  const [state, setState] = useState<ContactState>('idle');
  const [notice, setNotice] = useState<string | null>(null);

  async function submitContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setState('loading');
    setNotice(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          message: formData.get('message')
        })
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? 'Unable to send inquiry.');
      }

      form.reset();
      setState('success');
      setNotice(payload.message ?? 'Inquiry received.');
    } catch (error) {
      setState('error');
      setNotice(error instanceof Error ? error.message : 'Unable to send inquiry.');
    }
  }

  return (
    <form className="grid max-w-xl gap-3 font-mono text-[11px] uppercase tracking-[0.08em]" onSubmit={submitContact}>
      <label className="grid gap-1">
        NAME
        <input className="border border-black bg-white p-3 outline-none" name="name" required minLength={2} />
      </label>
      <label className="grid gap-1">
        EMAIL
        <input className="border border-black bg-white p-3 outline-none" name="email" type="email" required />
      </label>
      <label className="grid gap-1">
        MESSAGE
        <textarea className="min-h-36 border border-black bg-white p-3 outline-none" name="message" required minLength={10} />
      </label>
      <button className="w-fit bg-black px-5 py-3 text-white disabled:bg-gray-500" type="submit" disabled={state === 'loading'}>
        {state === 'loading' ? '[ SENDING ]' : '[ SEND ]'}
      </button>
      {notice ? (
        <p className={state === 'success' ? 'text-black' : 'text-gray-600'} role="status">
          {state === 'success' ? '[ SUCCESS ] ' : '[ ERROR ] '}
          {notice}
        </p>
      ) : null}
    </form>
  );
}
