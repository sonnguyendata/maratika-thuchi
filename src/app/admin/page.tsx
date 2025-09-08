import Link from 'next/link';

export default function AdminHome() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <ul className="list-disc ml-6">
        <li><Link href="/admin/upload">Upload Statements</Link></li>
        <li><Link href="/admin/categorize">Categorize Transactions (coming soon)</Link></li>
      </ul>
    </div>
  );
}