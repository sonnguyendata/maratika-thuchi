'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [accountName, setAccountName] = useState('');
  const [status, setStatus] = useState<string>('');

  async function handleUpload() {
    if (!file || !accountName) { setStatus('Choose file and account.'); return; }
    setStatus('Uploading...');

    const fd = new FormData();
    fd.append('file', file);
    fd.append('accountName', accountName);

    const res = await fetch('/api/statements/create', {
      method: 'POST',
      body: fd,
    });

    const json = await res.json();
    if (!res.ok) {
      setStatus(json?.error ?? 'Upload failed');
      return;
    }
    setStatus(`Done: ${json.inserted ?? 0} transactions`);
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Upload Statement</h1>

      <input
        className="border rounded px-3 py-2 w-full"
        placeholder="Account name"
        value={accountName}
        onChange={e => setAccountName(e.target.value)}
      />

      <input
        type="file"
        accept="application/pdf"
        onChange={e => setFile(e.target.files?.[0] ?? null)}
      />

      <button onClick={handleUpload} className="border rounded px-3 py-2">
        Upload & Parse
      </button>

      <div className="text-sm text-gray-600">{status}</div>
    </div>
  );
}