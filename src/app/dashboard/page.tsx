import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Community Finance Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 rounded border">Total IN (date filter coming)</div>
        <div className="p-4 rounded border">Total OUT</div>
        <div className="p-4 rounded border">Net</div>
      </div>
      <div className="mt-4">
        <Link href="/transactions" className="underline">View Transactions (coming)</Link>
      </div>
    </div>
  );
}