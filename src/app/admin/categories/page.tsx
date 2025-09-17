'use client';

import { useEffect, useState } from "react";

type CategoryType = "income" | "expense";
type Category = { id: number; name: string; type: CategoryType; target_amount: number | null };
type ApiError = { error: string };

const isCategoryType = (value: unknown): value is CategoryType => value === "income" || value === "expense";

const isApiError = (value: unknown): value is ApiError =>
  typeof value === "object" &&
  value !== null &&
  "error" in value &&
  typeof (value as { error: unknown }).error === "string";

const isCategory = (value: unknown): value is Category => {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "number" &&
    typeof candidate.name === "string" &&
    isCategoryType(candidate.type) &&
    (candidate.target_amount === null || typeof candidate.target_amount === "number")
  );
};

const isCategoryArray = (value: unknown): value is Category[] =>
  Array.isArray(value) && value.every(isCategory);

const parseTargetInput = (value: string): number | null | undefined => {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
};

const formatTargetValue = (value: number | null): string => (value === null ? "" : String(value));

export default function CategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("income");
  const [target, setTarget] = useState<number | "">("");
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const response = await fetch("/api/admin/categories");
      const payload: unknown = await response.json();
      if (!response.ok) {
        setErr(isApiError(payload) ? payload.error : "Failed to load categories");
        return;
      }
      if (!isCategoryArray(payload)) {
        setErr(isApiError(payload) ? payload.error : "Unexpected response from server");
        return;
      }
      setRows(payload);
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : "Failed to load categories");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function add() {
    const body = {
      name: name.trim(),
      type,
      target_amount: target === "" ? null : target,
    };

    try {
      const response = await fetch("/api/admin/categories", {
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
      setName("");
      setType("income");
      setTarget("");
      void load();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to add category");
    }
  }

  async function save(row: Category) {
    try {
      const response = await fetch(`/api/admin/categories/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      const payload: unknown = await response.json();
      if (!response.ok || isApiError(payload)) {
        const message = isApiError(payload) ? payload.error : `Save failed (HTTP ${response.status})`;
        alert(message);
        return;
      }
      void load();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to save category");
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this category? It must not be used by any transaction.")) return;

    try {
      const response = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const payload: unknown = await response.json();
      if (!response.ok || isApiError(payload)) {
        const message = isApiError(payload) ? payload.error : `Delete failed (HTTP ${response.status})`;
        alert(message);
        return;
      }
      void load();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to delete category");
    }
  }

  function editField<K extends keyof Category>(id: number, field: K, value: Category[K]) {
    setRows(prev =>
      prev.map(row => {
        if (row.id !== id) return row;
        return { ...row, [field]: value };
      }),
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Admin • Categories</h1>

      {err && <div className="p-3 border rounded text-red-600">{err}</div>}

      <div className="p-4 border rounded">
        <div className="text-lg font-medium mb-3">Create Category</div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            className="border rounded px-3 py-2"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <select
            className="border rounded px-3 py-2"
            value={type}
            onChange={e => {
              const next = e.target.value;
              if (isCategoryType(next)) {
                setType(next);
              }
            }}
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input
            className="border rounded px-3 py-2"
            placeholder="Target amount (optional)"
            value={target}
            onChange={e => {
              const parsed = parseTargetInput(e.target.value);
              if (parsed === undefined) {
                return;
              }
              setTarget(parsed === null ? "" : parsed);
            }}
          />
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
                  <select
                    className="border rounded px-2 py-1"
                    value={r.type}
                    onChange={e => {
                      const next = e.target.value;
                      if (isCategoryType(next)) {
                        editField(r.id, "type", next);
                      }
                    }}
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </td>
                <td className="p-2">
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={r.name}
                    onChange={e => editField(r.id, "name", e.target.value)}
                  />
                </td>
                <td className="p-2 text-right">
                  <input
                    className="border rounded px-2 py-1 text-right"
                    value={formatTargetValue(r.target_amount)}
                    onChange={e => {
                      const parsed = parseTargetInput(e.target.value);
                      if (parsed === undefined) {
                        return;
                      }
                      editField(r.id, "target_amount", parsed);
                    }}
                  />
                </td>
                <td className="p-2 text-right space-x-2">
                  <button onClick={() => save(r)} className="border rounded px-2 py-1 hover:bg-gray-50">
                    Save
                  </button>
                  <button onClick={() => remove(r.id)} className="border rounded px-2 py-1 hover:bg-gray-50">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={4}>
                  No categories yet.
                </td>
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
