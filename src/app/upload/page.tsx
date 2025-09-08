'use client';
import { useState } from 'react';
import { supabaseServerAdmin } from '@/lib/supabaseServer';

export default function UploadPage() {
  const supabase = supabaseServerAdmin();
  const [file, setFile] = useState<File | null>(null);
  const [accountName, setAccountName] = useState('Main Account');
  const [status, setStatus] = useState('');

  const onUpload = async () => {
    if (!file) return alert('Choose a PDF first.');
    setStatus('Uploading...');
    const key = `statements/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.pdf`;
    const { data, error } = await supabase.storage.from('statements').upload(key, file);
    if (error) { setStatus(error.message); return; }
    setStatus('Uploaded. Creating batch...');
    const res = await fetch('/api/statements/create', {
      method: 'POST',
      body: JSON.stringify({ accountName, filePath: key }),
    });
    if (!res.ok) { setStatus('Failed to create batch'); return; }
    const { statementId } = await res.json();
    setStatus('Parsing...');
    const p = await fetch(`/api/parse?statementId=${statementId}`, { method: 'POST' });
    if (!p.ok) { setStatus('Parse failed'); return; }
    const sum = await p.json();
    setStatus(`Done. New: ${sum.new}, Duplicates: ${sum.dup}, Errors: ${sum.err}`);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Upload Bank Statement (PDF)</h1>
      <div className="space-y-2">
        <input className="border p-2 rounded w-full" placeholder="Account name" value={accountName} onChange={e=>setAccountName(e.target.value)} />
        <input type="file" accept="application/pdf" onChange={e=>setFile(e.target.files?.[0] ?? null)} />
        <button onClick={onUpload} className="px-4 py-2 bg-black text-white rounded">Upload & Parse</button>
      </div>
      <div>{status}</div>
    </div>
  );
}