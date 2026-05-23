"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormField, inputClass } from "@/components/ui/FormField";

type Category = "INVENTORY" | "EQUIPMENT";
type TabFilter = "ALL" | Category;

interface CatalogItem {
  id: string;
  name: string;
  category: Category;
  unit: string | null;
  minThreshold: number;
  _count: { inventoryItems: number; equipment: number };
}

const categoryConfig: Record<Category, { label: string; color: string; icon: string }> = {
  INVENTORY: { label: "מלאי",  color: "bg-blue-100 text-blue-700",   icon: "📦" },
  EQUIPMENT: { label: "ציוד",  color: "bg-orange-100 text-orange-700", icon: "🔧" },
};

const tabs: { key: TabFilter; label: string }[] = [
  { key: "ALL",       label: "כל הפריטים" },
  { key: "INVENTORY", label: "מלאי" },
  { key: "EQUIPMENT", label: "ציוד" },
];

// ── Add Form ────────────────────────────────────────────────────────────────

function AddForm({ onAdded }: { onAdded: (item: CatalogItem) => void }) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("INVENTORY");
  const [unit, setUnit] = useState("יחידות");
  const [minThreshold, setMinThreshold] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        category,
        unit: category === "INVENTORY" ? unit.trim() || "יחידות" : undefined,
        minThreshold: category === "INVENTORY" ? minThreshold : 0,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "שגיאה"); return; }

    onAdded({ ...data, _count: { inventoryItems: 0, equipment: 0 } });
    setName(""); setCategory("INVENTORY"); setUnit("יחידות"); setMinThreshold(0); setShow(false);
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        פריט חדש
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 space-y-4"
    >
      <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">פריט חדש בקטלוג</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-1">
          <FormField label="קטגוריה" required>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className={inputClass}
            >
              <option value="INVENTORY">📦 מלאי</option>
              <option value="EQUIPMENT">🔧 ציוד</option>
            </select>
          </FormField>
        </div>

        <div className="sm:col-span-1">
          <FormField label="שם הפריט" required>
            <input
              type="text"
              className={inputClass}
              placeholder={category === "INVENTORY" ? "מים בקבוקים" : "סורק ברקוד"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={1}
            />
          </FormField>
        </div>

        {category === "INVENTORY" && (
          <div className="sm:col-span-1">
            <FormField label="יחידת מידה">
              <input
                type="text"
                className={inputClass}
                placeholder="יחידות"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </FormField>
          </div>
        )}

        {category === "INVENTORY" && (
          <div className="sm:col-span-1">
            <FormField label="סף מינימום להתראה">
              <input
                type="number"
                min={0}
                className={inputClass}
                placeholder="0"
                value={minThreshold}
                onChange={(e) => setMinThreshold(parseInt(e.target.value) || 0)}
              />
            </FormField>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-xs flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
        >
          {loading ? "שומר..." : "הוסף לקטלוג"}
        </button>
        <button
          type="button"
          onClick={() => { setShow(false); setError(""); }}
          className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          ביטול
        </button>
      </div>
    </form>
  );
}

// ── Edit Row ─────────────────────────────────────────────────────────────────

function EditRow({
  item,
  onSaved,
  onCancel,
}: {
  item: CatalogItem;
  onSaved: (updated: CatalogItem) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [unit, setUnit] = useState(item.unit ?? "יחידות");
  const [minThreshold, setMinThreshold] = useState(item.minThreshold);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    setLoading(true);
    const res = await fetch(`/api/catalog/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        unit: item.category === "INVENTORY" ? unit.trim() || null : null,
        minThreshold: item.category === "INVENTORY" ? minThreshold : 0,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "שגיאה"); return; }
    onSaved({ ...item, name: data.name, unit: data.unit, minThreshold: data.minThreshold });
  }

  return (
    <tr className="bg-blue-50 dark:bg-blue-900/20">
      <td className="px-6 py-3" colSpan={5}>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 min-w-32 px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {item.category === "INVENTORY" && (
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="יחידת מידה"
              className="w-24 px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          {item.category === "INVENTORY" && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">סף:</span>
              <input
                type="number"
                min={0}
                value={minThreshold}
                onChange={(e) => setMinThreshold(parseInt(e.target.value) || 0)}
                className="w-16 text-center px-2 py-1.5 rounded-lg border border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {error && <span className="text-red-600 text-xs">{error}</span>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading || !name.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              {loading ? "..." : "שמור"}
            </button>
            <button
              onClick={onCancel}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CatalogManager({ initialItems }: { initialItems: CatalogItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<CatalogItem[]>(initialItems);
  const [tab, setTab] = useState<TabFilter>("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<Record<string, string>>({});

  const filtered = tab === "ALL" ? items : items.filter((i) => i.category === tab);

  function handleAdded(item: CatalogItem) {
    setItems((prev) =>
      [...prev, item].sort((a, b) =>
        a.category.localeCompare(b.category) || a.name.localeCompare(b.name, "he")
      )
    );
    router.refresh();
  }

  function handleSaved(updated: CatalogItem) {
    setItems((prev) =>
      prev
        .map((i) => (i.id === updated.id ? updated : i))
        .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name, "he"))
    );
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setDeleteError((prev) => ({ ...prev, [id]: "" }));

    const res = await fetch(`/api/catalog/${id}`, { method: "DELETE" });
    const data = await res.json();
    setDeletingId(null);

    if (!res.ok) {
      setDeleteError((prev) => ({ ...prev, [id]: data.error ?? "שגיאה במחיקה" }));
      return;
    }

    setItems((prev) => prev.filter((i) => i.id !== id));
    router.refresh();
  }

  const inventoryCount = items.filter((i) => i.category === "INVENTORY").length;
  const equipmentCount = items.filter((i) => i.category === "EQUIPMENT").length;

  return (
    <div className="space-y-5">
      {/* Add form */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <AddForm onAdded={handleAdded} />

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>📦 {inventoryCount} פריטי מלאי</span>
          <span>·</span>
          <span>🔧 {equipmentCount} פריטי ציוד</span>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {t.label}
            {t.key !== "ALL" && (
              <span className="mr-1.5 text-xs text-slate-400 dark:text-slate-500">
                ({t.key === "INVENTORY" ? inventoryCount : equipmentCount})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-3xl">📋</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">אין פריטים בקטלוג עדיין</p>
            <p className="text-slate-400 dark:text-slate-500 text-xs">הוסף פריט ראשון באמצעות הכפתור למעלה</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                <th className="text-right px-6 py-3 font-medium">שם הפריט</th>
                <th className="text-right px-6 py-3 font-medium">קטגוריה</th>
                <th className="text-right px-6 py-3 font-medium hidden sm:table-cell">יחידה</th>
                <th className="text-right px-6 py-3 font-medium hidden sm:table-cell">סף התראה</th>
                <th className="text-right px-6 py-3 font-medium hidden md:table-cell">שימוש</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {filtered.map((item) =>
                editingId === item.id ? (
                  <EditRow
                    key={item.id}
                    item={item}
                    onSaved={handleSaved}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    {/* Name */}
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-800 dark:text-slate-100">{item.name}</span>
                    </td>

                    {/* Category badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${categoryConfig[item.category].color}`}>
                        <span>{categoryConfig[item.category].icon}</span>
                        <span>{categoryConfig[item.category].label}</span>
                      </span>
                    </td>

                    {/* Unit */}
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                      {item.category === "INVENTORY" ? (item.unit ?? "יחידות") : "—"}
                    </td>

                    {/* Min threshold */}
                    <td className="px-6 py-4 hidden sm:table-cell">
                      {item.category === "INVENTORY" ? (
                        item.minThreshold > 0 ? (
                          <span className="text-orange-600 dark:text-orange-400 font-medium text-sm">
                            ≤ {item.minThreshold}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-xs">ללא</span>
                        )
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                      )}
                    </td>

                    {/* Usage count */}
                    <td className="px-6 py-4 hidden md:table-cell">
                      {(() => {
                        const count = item.category === "INVENTORY"
                          ? item._count.inventoryItems
                          : item._count.equipment;
                        return count > 0 ? (
                          <span className="text-slate-600 dark:text-slate-300 font-medium">
                            {count} נהגים
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-xs">לא בשימוש</span>
                        );
                      })()}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        {deleteError[item.id] && (
                          <span className="text-xs text-red-600 max-w-32 text-right">
                            {deleteError[item.id]}
                          </span>
                        )}
                        <button
                          onClick={() => { setEditingId(item.id); setDeleteError({}); }}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium transition-colors"
                        >
                          ערוך
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 text-xs transition-colors disabled:opacity-50"
                        >
                          {deletingId === item.id ? "..." : "מחק"}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        💡 לא ניתן למחוק פריט שנמצא בשימוש אצל נהגים
      </p>
    </div>
  );
}
