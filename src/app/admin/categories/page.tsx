'use client';

import { useEffect, useState } from "react";

type Category = { id: number; name: string; type: 'income'|'expense'; target_amount: number | null; };

export default function CategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<'income'|'expense'>('income');
  const [target, setTarget] = useState<number | ''>('');
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    const res = await fetch("/api/admin/categories").then(r => r.json());
    if (res?.error) setErr(res.error);
    else setRows(res);
  }

  useEffect(() => { load(); }, []);

  async function add() {
    const body = { name: name.trim(), type, target_amount: target === '' ? 0 : Number(target) };
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json());
    if (res?.error) { alert(res.error); return; }
    setName(""); setType('income'); setTarget('');
    load();
  }

  async function save(row: Category) {
    const res = await fetch(`/api/admin/categories/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    }).then(r => r.json());
    if (res?.error) alert(res.error);
    else load();
  }

  async function remove(id: number) {
    if (!confirm("Delete this category? It must not be used by any transaction.")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" }).then(r => r.json());
    if (res?.error) alert(res.error);
    else load();
  }

  function editField(id: number, field: keyof Category, value: any) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } as Category : r));
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Admin • Categories</h1>

      {err && <div className="p-3 border rounded text-red-600">{err}</div>}

      <div className="p-4 border rounded">
        <div className="text-lg font-medium mb-3">Create Category</div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Name"
                 value={name} onChange={e => setName(e.target.value)} />
          <select className="border rounded px-3 py-2"
                  value={type} onChange={e => setType(e.target.value as any)}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input className="border rounded px-3 py-2" placeholder="Target amount (optional)"
                 value={target} onChange={e => setTarget(e.target.value === '' ? '' : Number(e.target.value))} />
          <button onClick={add} className="border rounded px-3 py-2 hover:bg-gray-50">
            Add
          </button>
        </div>
      </div>

      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Name</th>
              <th className="text-right p-2">Target</th>
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-2">
                  <select className="border rounded px-2 py-1"
                          value={r.type}
                          onChange={e => editField(r.id, 'type', e.target.value as any)}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </td>
                <td className="p-2">
                  <input className="border rounded px-2 py-1 w-full"
                         value={r.name}
                         onChange={e => editField(r.id, 'name', e.target.value)} />
                </td>
                <td className="p-2 text-right">
                  <input className="border rounded px-2 py-1 text-right"
                         value={r.target_amount ?? 0}
                         onChange={e => editField(r.id, 'target_amount', Number(e.target.value))} />
                </td>
                <td className="p-2 text-right space-x-2">
                  <button onClick={() => save(r)} className="border rounded px-2 py-1 hover:bg-gray-50">Save</button>
                  <button onClick={() => remove(r.id)} className="border rounded px-2 py-1 hover:bg-gray-50">Delete</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={4}>No categories yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-500">
        Tip: If a category is “in use by transactions”, delete will be blocked to protect data.
      </div>
    </div>
  );
}
