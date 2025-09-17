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
    <main className="vajra-shell">
      <div className="vajra-container">
        <section className="vajra-panel" data-tone="horizon">
          <div className="space-y-4">
            <span className="vajra-kicker">Category mandala</span>
            <h1 className="vajra-heading text-[clamp(1.9rem,4vw,2.4rem)]">Tune the flows of giving and spend</h1>
            <p className="vajra-subtext">
              Group transactions into meaningful families. Targets keep aspirations visible while
              inline edits maintain momentum during reconciliation.
            </p>
            {err && (
              <div className="vajra-toast" role="alert">
                {err}
              </div>
            )}
          </div>
        </section>

        <section className="vajra-panel">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="vajra-kicker">Create category</p>
                <p className="vajra-subtext text-sm">
                  Keep names short and purposeful. Targets are optional and accept whole numbers.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto]">
              <input
                className="vajra-field"
                placeholder="Category name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <select
                className="vajra-field"
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
                className="vajra-field"
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
              <button type="button" onClick={add} className="vajra-button" data-size="sm">
                Add
              </button>
            </div>
          </div>
        </section>

        <section className="vajra-panel">
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="vajra-kicker">Current categories</span>
              <span className="vajra-hint">Changes save per-row—no bulk submit required.</span>
            </div>

            <div className="vajra-table-wrapper overflow-x-auto">
              <table className="vajra-table">
                <thead>
                  <tr>
                    <th className="text-left">Type</th>
                    <th className="text-left">Name</th>
                    <th className="text-right">Target</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td>
                        <select
                          className="vajra-field vajra-field--compact"
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
                      <td>
                        <input
                          className="vajra-field vajra-field--compact"
                          value={r.name}
                          onChange={e => editField(r.id, "name", e.target.value)}
                        />
                      </td>
                      <td className="text-right">
                        <input
                          className="vajra-field vajra-field--compact text-right"
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
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => save(r)}
                            className="vajra-button vajra-button--ghost"
                            data-size="sm"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(r.id)}
                            className="vajra-button vajra-button--ghost"
                            data-size="sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center">
                        <span className="vajra-hint">No categories yet. Create your first one above.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="vajra-hint">
              Deleting a category that is attached to transactions will be blocked to keep history
              accurate. Reassign transactions first, then remove the category.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
