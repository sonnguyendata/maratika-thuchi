'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

type UserRow = {
  id: string;
  email: string | null;
  role: string;
  created_at?: string | null;
  _editing?: boolean;
  _newPassword?: string;
  _roleDraft?: string;
};

function getEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  };
}

export default function AdminUsersPage() {
  const router = useRouter();
  const env = getEnv();
  const supabase = useMemo(() => createClient(env.url, env.anon), [env.url, env.anon]);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // form for creating a new user
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleNew, setRoleNew] = useState('user');

  // Gate: only admins
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const role = data.user?.user_metadata?.role;
      if (role !== 'admin') router.replace('/login');
    });
  }, [router, supabase]);

  // Load users
  const loadUsers = async () => {
    setLoading(true);
    setMsg(null);
    const res = await fetch('/api/admin/users', { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok) {
      setMsg(`❌ ${json.error || 'Failed to load users'}`);
    } else {
      const rows: UserRow[] = (json.users || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        role: u.role ?? 'user',
        created_at: u.created_at ?? null,
      }));
      setUsers(rows);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const createUser = async () => {
    setLoading(true);
    setMsg(null);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email, password, role: roleNew }),
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg(`❌ ${json.error || 'Create failed'}`);
    } else {
      setMsg(`✅ Created ${email}`);
      setEmail('');
      setPassword('');
      setRoleNew('user');
      loadUsers();
    }
    setLoading(false);
  };

  const startEdit = (id: string) => {
    setUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, _editing: true, _roleDraft: u.role, _newPassword: '' } : u))
    );
  };

  const cancelEdit = (id: string) => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, _editing: false, _roleDraft: undefined, _newPassword: '' } : u)));
  };

  const saveEdit = async (row: UserRow) => {
    setLoading(true);
    setMsg(null);
    const payload: Record<string, unknown> = {};
    if (row._roleDraft && row._roleDraft !== row.role) payload.role = row._roleDraft;
    if (row._newPassword && row._newPassword.length >= 6) payload.password = row._newPassword;

    const res = await fetch(`/api/admin/users/${row.id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg(`❌ ${json.error || 'Update failed'}`);
    } else {
      setMsg('✅ Updated');
      loadUsers();
    }
    setLoading(false);
  };

  const deleteUser = async (row: UserRow) => {
    if (!confirm(`Delete ${row.email}?`)) return;
    setLoading(true);
    setMsg(null);
    const res = await fetch(`/api/admin/users/${row.id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) {
      setMsg(`❌ ${json.error || 'Delete failed'}`);
    } else {
      setMsg('✅ Deleted');
      setUsers(prev => prev.filter(u => u.id !== row.id));
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">👤 Admin · Users</h1>

      <div className="mb-6 border p-4 rounded bg-gray-50">
        <h2 className="font-semibold mb-3">Add New User</h2>
        <div className="flex flex-wrap gap-2">
          <input
            className="border p-2 rounded min-w-[220px]"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            className="border p-2 rounded min-w-[180px]"
            type="password"
            placeholder="password (min 6)"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <select
            className="border p-2 rounded"
            value={roleNew}
            onChange={e => setRoleNew(e.target.value)}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-60"
            onClick={createUser}
            disabled={loading || !email || password.length < 6}
          >
            {loading ? 'Working…' : 'Create'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">New user can sign in immediately.</p>
      </div>

      {msg && <div className="mb-4 p-3 rounded border bg-white">{msg}</div>}

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Role</th>
              <th className="p-2 border">New Password</th>
              <th className="p-2 border w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(row => (
              <tr key={row.id} className="odd:bg-white even:bg-gray-50">
                <td className="p-2 border">{row.email}</td>
                <td className="p-2 border">
                  {row._editing ? (
                    <select
                      className="border p-1 rounded"
                      value={row._roleDraft}
                      onChange={e =>
                        setUsers(prev =>
                          prev.map(u => (u.id === row.id ? { ...u, _roleDraft: e.target.value } : u))
                        )
                      }
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span className="px-2 py-1 rounded bg-gray-200">{row.role}</span>
                  )}
                </td>
                <td className="p-2 border">
                  {row._editing ? (
                    <input
                      className="border p-1 rounded"
                      type="password"
                      placeholder="leave blank to keep"
                      value={row._newPassword ?? ''}
                      onChange={e =>
                        setUsers(prev =>
                          prev.map(u => (u.id === row.id ? { ...u, _newPassword: e.target.value } : u))
                        )
                      }
                    />
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="p-2 border">
                  {row._editing ? (
                    <div className="flex gap-2">
                      <button
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                        onClick={() => saveEdit(row)}
                        disabled={loading}
                      >
                        Save
                      </button>
                      <button
                        className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded"
                        onClick={() => cancelEdit(row.id)}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                        onClick={() => startEdit(row.id)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                        onClick={() => deleteUser(row)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {users.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
