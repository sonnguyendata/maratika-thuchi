// src/app/admin/upload/page.tsx
'use client';

import { useState } from 'react';

type ErrorPayload = { error: string };

const isErrorPayload = (value: unknown): value is ErrorPayload =>
  typeof value === 'object' && value !== null && 'error' in value && typeof (value as { error: unknown }).error === 'string';

export default function UploadPage() {
  const [accountName, setAccountName] = useState("Cherry's Techcombank");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<unknown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!file) {
      setError('Please choose a PDF file.');
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('accountName', accountName);

      const res = await fetch('/api/statements/create', {
        method: 'POST',
        body: fd, // don't set Content-Type manually
      });

      // Defensive parse: prefer JSON, else text
      const ct = res.headers.get('content-type') || '';
      let payload: unknown;
      if (ct.includes('application/json')) {
        try {
          payload = await res.json();
        } catch {
          // If body is empty or not valid JSON, fallback
          const txt = await res.text();
          payload = { raw: txt };
        }
      } else {
        const txt = await res.text();
        payload = { raw: txt };
      }

      if (!res.ok) {
        setError(isErrorPayload(payload) ? payload.error : `Upload failed (HTTP ${res.status})`);
      } else {
        setResult(payload);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="vajra-shell">
      <div className="vajra-container">
        <section className="vajra-panel">
          <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-start">
            <div className="space-y-4">
              <span className="vajra-kicker">Statement alchemy</span>
              <h1 className="vajra-heading text-[clamp(1.9rem,4vw,2.4rem)]">Upload a PDF for parsing</h1>
              <p className="vajra-subtext">
                The Vajra parser extracts each transaction, keeps duplicates at bay, and stores
                them with the uploaded statement. Choose a descriptive account name so monthly
                reports are easy to recognise.
              </p>

              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(251,238,221,0.68)]">
                    Account name
                  </label>
                  <input
                    className="vajra-field"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="e.g. Cherry’s Techcombank"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(251,238,221,0.68)]">
                    PDF file
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="block text-sm text-[rgba(251,238,221,0.75)]"
                  />
                  <p className="vajra-hint">We support bank statements up to 10&nbsp;MB.</p>
                </div>

                {error && (
                  <div className="vajra-toast" role="alert">
                    {error}
                  </div>
                )}

                <button type="submit" disabled={busy} className="vajra-button">
                  {busy ? 'Uploading…' : 'Upload statement'}
                </button>
              </form>
            </div>

            <aside className="space-y-4">
              <div className="vajra-stat-grid">
                <div className="vajra-stat">
                  <span className="vajra-stat__label">Latest action</span>
                  <span className="vajra-stat__value">PDF → rows</span>
                  <span className="vajra-hint">Automatically deduplicated by unique key.</span>
                </div>
                <div className="vajra-stat">
                  <span className="vajra-stat__label">Average parse</span>
                  <span className="vajra-stat__value">&lt; 5s</span>
                  <span className="vajra-hint">Time depends on PDF length.</span>
                </div>
              </div>

              {result !== null && (
                <div className="space-y-3">
                  <p className="vajra-kicker">Parser response</p>
                  <pre className="vajra-pre">{JSON.stringify(result, null, 2)}</pre>
                </div>
              )}
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}