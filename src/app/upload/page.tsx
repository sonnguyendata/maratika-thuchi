'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [accountName, setAccountName] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus('Please choose a PDF file.');
      return;
    }

    setBusy(true);
    setStatus(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('accountName', accountName);

      const res = await fetch('/api/statements/create', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error ?? 'Upload failed.');
      } else {
        setStatus(`✅ Uploaded. statement_id=${data.statementId}`);
      }
    } catch (err: any) {
      setStatus(err?.message ?? 'Unexpected error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-xl rounded-lg border bg-white p-5 shadow">
        <h1 className="mb-4 text-xl font-semibold">Upload bank statement (PDF)</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Account name (optional)</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="e.g. BIDV Checking"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">PDF file</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {busy ? 'Uploading…' : 'Upload'}
          </button>
        </form>

        {status && <p className="mt-4 text-sm">{status}</p>}
      </div>
    </main>
  );
}
