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
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Upload Statement</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Account Name</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="e.g. Cherry's Techcombank"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">PDF File</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {busy ? 'Uploading…' : 'Upload'}
        </button>
      </form>

      {error && (
        <div className="text-red-600 mt-2">
          {error}
        </div>
      )}

      {result !== null && (
        <pre className="mt-3 p-3 bg-gray-50 border rounded text-sm overflow-auto">
{JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}