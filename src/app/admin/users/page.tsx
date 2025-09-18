// src/app/admin/users/page.tsx
'use client';

import { useEffect, useState } from "react";

type User = { id: string; email: string; full_name: string; role: string };
type ApiError = { error: string };

const isApiError = (value: unknown): value is ApiError =>
  typeof value === "object" &&
  value !== null &&
  "error" in value &&
  typeof (value as { error: unknown }).error === "string";

const isUser = (value: unknown): value is User => {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.full_name === "string" &&
    typeof candidate.role === "string"
  );
};

const isUserArray = (value: unknown): value is User[] =>
  Array.isArray(value) && value.every(isUser);

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("user");
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const response = await fetch("/api/admin/users");
      const payload: unknown = await response.json();
      if (!response.ok) {
        setErr(isApiError(payload) ? payload.error : "Failed to load users");
        return;
      }
      if (!isUserArray(payload.users)) {
        setErr("Unexpected response from server");
        return;
      }
      setUsers(payload.users);
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : "Failed to load users");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function add() {
    const body = {
      email: email.trim(),
      password: password.trim(),
      full_name: fullName.trim(),
      role,
    };

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload: unknown = await response.json();
      if (!response.ok || isApiError(payload)) {
        const message = isApiError(payload) ? payload.error : `Add failed (HTTP ${response.status})`;
        alert(message);
        return;
      }
      setEmail("");
      setPassword("");
      setFullName("");
      setRole("user");
      void load();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to add user");
    }
  }

  async function update(user: User) {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      const payload: unknown = await response.json();
      if (!response.ok || isApiError(payload)) {
        const message = isApiError(payload) ? payload.error : `Update failed (HTTP ${response.status})`;
        alert(message);
        return;
      }
      void load();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to update user");
    }
  }

  async function remove(userId: string) {
    if (!confirm("Delete this user? This action cannot be undone.")) return;

    try {
      const response = await fetch(`/api/admin/users?user_id=${userId}`, { method: "DELETE" });
      const payload: unknown = await response.json();
      if (!response.ok || isApiError(payload)) {
        const message = isApiError(payload) ? payload.error : `Delete failed (HTTP ${response.status})`;
        alert(message);
        return;
      }
      void load();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to delete user");
    }
  }

  function editField<K extends keyof User>(id: string, field: K, value: User[K]) {
    setUsers(prev =>
      prev.map(user => {
        if (user.id !== id) return user;
        return { ...user, [field]: value };
      }),
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Admin • Users</h1>

      {err && <div className="p-3 border rounded text-red-600">{err}</div>}

      <div className="p-4 border rounded">
        <div className="text-lg font-medium mb-3">Create User</div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <input
            className="border rounded px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="Full Name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
          />
          <select
            className="border rounded px-3 py-2"
            value={role}
            onChange={e => setRole(e.target.value)}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={add} className="border rounded px-3 py-2 hover:bg-gray-50">
            Add
          </button>
        </div>
      </div>

      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Full Name</th>
              <th className="text-left p-2">Role</th>
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t">
                <td className="p-2">
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={user.email}
                    onChange={e => editField(user.id, "email", e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={user.full_name}
                    onChange={e => editField(user.id, "full_name", e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <select
                    className="border rounded px-2 py-1"
                    value={user.role}
                    onChange={e => editField(user.id, "role", e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="p-2 text-right space-x-2">
                  <button onClick={() => update(user)} className="border rounded px-2 py-1 hover:bg-gray-50">
                    Save
                  </button>
                  <button onClick={() => remove(user.id)} className="border rounded px-2 py-1 hover:bg-gray-50">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={4}>
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
