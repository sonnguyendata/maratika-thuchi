// src/app/admin/upload/page.tsx
'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';

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
    <Layout 
      title="Upload Statement" 
      description="Parse bank statement PDFs and extract transaction data automatically"
    >
      <div className="max-w-2xl">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="rounded-2xl bg-surface-1/50 backdrop-blur-sm border border-surface-2 p-6">
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">Statement Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Account Name</label>
                <input
                  className="w-full rounded-xl bg-surface-2/50 border border-surface-2 px-4 py-3 text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-soft/50 focus:border-accent-soft transition-all duration-200"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Cherry's Techcombank"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">PDF File</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="w-full rounded-xl bg-surface-2/50 border border-surface-2 px-4 py-3 text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-accent-soft/20 file:text-accent-soft hover:file:bg-accent-soft/30 transition-all duration-200"
                  />
                </div>
                <p className="text-sm text-foreground/60 mt-2">
                  Supports Vietnamese bank statements with DD/MM/YYYY date format
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-accent-soft to-accent-warm text-white py-3 font-medium disabled:opacity-60 hover:shadow-lg hover:shadow-accent-soft/25 transition-all duration-200 disabled:hover:shadow-none"
          >
            {busy ? 'Uploading…' : 'Upload Statement'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {result !== null && (
          <div className="mt-6 rounded-2xl bg-surface-1/50 backdrop-blur-sm border border-surface-2 p-6">
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">Upload Result</h3>
            <pre className="text-sm text-foreground/80 overflow-auto bg-surface-2/30 rounded-xl p-4">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Layout>
  );
}