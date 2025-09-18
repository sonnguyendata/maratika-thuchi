'use client';

import { useEffect, useState } from "react";
import Layout from '@/components/Layout';

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
    <Layout 
      title="Manage Categories" 
      description="Create, edit, and organize transaction categories to better understand your spending patterns"
    >
      <div className="max-w-4xl space-y-6">
        {err && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-red-400">{err}</p>
          </div>
        )}

        {/* Create Category Form */}
        <div className="rounded-2xl bg-surface-1/50 backdrop-blur-sm border border-surface-2 p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">Create Category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <input
              className="rounded-xl bg-surface-2/50 border border-surface-2 px-4 py-3 text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-soft/50 focus:border-accent-soft transition-all duration-200"
              placeholder="Category Name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <select
              className="rounded-xl bg-surface-2/50 border border-surface-2 px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-soft/50 focus:border-accent-soft transition-all duration-200"
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
              className="rounded-xl bg-surface-2/50 border border-surface-2 px-4 py-3 text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent-soft/50 focus:border-accent-soft transition-all duration-200"
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
            <button 
              onClick={add} 
              className="rounded-xl bg-gradient-to-r from-accent-soft to-accent-warm text-white py-3 font-medium hover:shadow-lg hover:shadow-accent-soft/25 transition-all duration-200"
            >
              Add Category
            </button>
          </div>
        </div>

        {/* Categories Table */}
        <div className="rounded-2xl bg-surface-1/50 backdrop-blur-sm border border-surface-2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2/30">
                <tr>
                  <th className="text-left p-4 font-medium text-foreground">Type</th>
                  <th className="text-left p-4 font-medium text-foreground">Name</th>
                  <th className="text-right p-4 font-medium text-foreground">Target</th>
                  <th className="text-right p-4 font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-t border-surface-2">
                    <td className="p-4">
                      <select
                        className="rounded-lg bg-surface-2/50 border border-surface-2 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-soft/50 focus:border-accent-soft transition-all duration-200"
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
                    <td className="p-4">
                      <input
                        className="rounded-lg bg-surface-2/50 border border-surface-2 px-3 py-2 text-foreground w-full focus:outline-none focus:ring-2 focus:ring-accent-soft/50 focus:border-accent-soft transition-all duration-200"
                        value={r.name}
                        onChange={e => editField(r.id, "name", e.target.value)}
                      />
                    </td>
                    <td className="p-4 text-right">
                      <input
                        className="rounded-lg bg-surface-2/50 border border-surface-2 px-3 py-2 text-foreground text-right w-24 focus:outline-none focus:ring-2 focus:ring-accent-soft/50 focus:border-accent-soft transition-all duration-200"
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
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => save(r)} 
                        className="rounded-lg bg-accent-soft/20 text-accent-soft px-3 py-2 hover:bg-accent-soft/30 transition-all duration-200"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => remove(r.id)} 
                        className="rounded-lg bg-red-500/20 text-red-400 px-3 py-2 hover:bg-red-500/30 transition-all duration-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td className="p-8 text-center text-foreground/60" colSpan={4}>
                      No categories yet. Create your first category above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-sm text-foreground/60">
          💡 Tip: If a category is &quot;in use by transactions&quot;, delete will be blocked to protect data integrity.
        </div>
      </div>
    </Layout>
  );
}
