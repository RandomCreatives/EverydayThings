'use client';

import { useState } from 'react';

export function AdminUploadGate({ isDisabled = false }: { isDisabled?: boolean }) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(
    isDisabled ? 'Admin upload is disabled until ADMIN_UPLOAD_PASSWORD is configured.' : null
  );

  async function unlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setNotice(null);

    try {
      const response = await fetch('/api/admin/upload-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !payload.ok) throw new Error(payload.error ?? 'Unable to unlock upload panel.');

      window.location.reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to unlock upload panel.');
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-3 py-10 md:px-5">
      <form onSubmit={unlock} className="grid gap-4 border border-black p-4 font-mono text-[11px] uppercase tracking-[0.08em]">
        <h1>LOCAL UPLOAD PANEL</h1>
        <p className="text-gray-600">Protected production route. Enter the upload password.</p>
        <label className="grid gap-1">
          PASSWORD
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="border border-black bg-white p-3 outline-none"
            type="password"
            disabled={isDisabled || isLoading}
            autoComplete="current-password"
          />
        </label>
        <button className="w-fit bg-black px-5 py-3 text-white disabled:bg-gray-500" type="submit" disabled={isDisabled || isLoading}>
          {isLoading ? '[ CHECKING ]' : '[ UNLOCK ]'}
        </button>
        {notice ? <p className="text-gray-600">{notice}</p> : null}
      </form>
    </main>
  );
}
