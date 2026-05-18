"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { Category } from "@/lib/types";

const emptyForm = { name: "", slug: "", emoji: "", order: "0" };

export default function CategoriesAdmin({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const slugify = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (c: Category) => {
    setForm({ name: c.name, slug: c.slug, emoji: c.emoji, order: String(c.order) });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const url = editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, order: Number(form.order) }),
    });

    const saved = await res.json();
    setLoading(false);

    if (res.ok) {
      if (editingId) {
        setCategories((cs) => cs.map((c) => (c.id === editingId ? saved : c)));
      } else {
        setCategories((cs) => [...cs, saved]);
      }
      setShowForm(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta categoría? También se eliminarán sus productos.")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    setCategories((cs) => cs.filter((c) => c.id !== id));
  };

  const moveCategory = async (index: number, direction: -1 | 1) => {
    const sorted = [...categories].sort((a, b) => a.order - b.order);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const current = sorted[index];
    const swapped = sorted[targetIndex];

    const updatedCurrent = { ...current, order: swapped.order };
    const updatedSwapped = { ...swapped, order: current.order };

    await Promise.all([
      fetch(`/api/admin/categories/${current.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: current.name, slug: current.slug, emoji: current.emoji, order: swapped.order }),
      }),
      fetch(`/api/admin/categories/${swapped.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: swapped.name, slug: swapped.slug, emoji: swapped.emoji, order: current.order }),
      }),
    ]);

    setCategories((cs) =>
      cs.map((c) => {
        if (c.id === current.id) return updatedCurrent;
        if (c.id === swapped.id) return updatedSwapped;
        return c;
      })
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Categorías</h2>
        <button
          onClick={openNew}
          className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <Plus size={16} /> Nueva categoría
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="font-bold text-lg mb-4">{editingId ? "Editar categoría" : "Nueva categoría"}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
                  <input
                    value={form.emoji}
                    onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                    placeholder="🛒"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-60"
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {categories.length === 0 ? (
          <p className="text-center text-gray-400 py-10">Sin categorías. ¡Creá la primera!</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {[...categories].sort((a, b) => a.order - b.order).map((c, index, sorted) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                <div className="flex flex-col gap-0.5">
                  <button
                    disabled={index === 0}
                    onClick={() => moveCategory(index, -1)}
                    className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed rounded"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    disabled={index === sorted.length - 1}
                    onClick={() => moveCategory(index, 1)}
                    className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed rounded"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl">
                  {c.emoji || "🏷️"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-800">{c.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{c.slug} · orden {c.order}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
