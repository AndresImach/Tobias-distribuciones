"use client";

import { useState, useRef } from "react";
import { Plus, Pencil, Trash2, Star, EyeOff, ImagePlus, X } from "lucide-react";
import type { Product, Category } from "@/lib/types";

type Props = {
  initialProducts: (Product & { category: Category })[];
  categories: Category[];
};

const emptyForm = {
  name: "",
  description: "",
  price: "",
  image: "",
  available: true,
  featured: false,
  categoryId: "",
};

export default function ProductsAdmin({ initialProducts, categories }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openNew = () => {
    setForm(emptyForm);
    setImagePreview("");
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (p: Product & { category: Category }) => {
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      image: p.image,
      available: p.available,
      featured: p.featured,
      categoryId: String(p.categoryId),
    });
    setImagePreview(p.image);
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setUploading(true);

    const data = new FormData();
    data.append("file", file);

    const res = await fetch("/api/admin/upload", { method: "POST", body: data });
    const json = await res.json();
    setUploading(false);

    if (res.ok) {
      setForm((f) => ({ ...f, image: json.url }));
    } else {
      setImagePreview(form.image);
      alert(json.error || "Error al subir la imagen");
    }
  };

  const clearImage = () => {
    setImagePreview("");
    setForm((f) => ({ ...f, image: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const url = editingId ? `/api/admin/products/${editingId}` : "/api/admin/products";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: Number(form.price), categoryId: Number(form.categoryId) }),
    });

    const saved = await res.json();
    setLoading(false);

    if (res.ok) {
      if (editingId) {
        setProducts((ps) => ps.map((p) => (p.id === editingId ? saved : p)));
      } else {
        setProducts((ps) => [saved, ...ps]);
      }
      setShowForm(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este producto?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setProducts((ps) => ps.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Productos</h2>
        <button
          onClick={openNew}
          className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
        >
          <Plus size={16} /> Nuevo producto
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4 text-gray-800">{editingId ? "Editar producto" : "Nuevo producto"}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                  <select
                    required
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                  >
                    <option value="">Seleccionar...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                  />
                </div>

                {/* Image upload */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del producto</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {imagePreview ? (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                      {uploading && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-sm text-gray-500">
                          Subiendo...
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50 text-gray-500 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-28 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-green-400 hover:text-green-500 transition-colors"
                    >
                      <ImagePlus size={24} />
                      <span className="text-sm">Elegir foto de la galería</span>
                    </button>
                  )}

                  {imagePreview && !uploading && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1.5 text-xs text-gray-400 hover:text-green-600 underline"
                    >
                      Cambiar imagen
                    </button>
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.available}
                    onChange={(e) => setForm({ ...form, available: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Disponible</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Destacado</span>
                </label>
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
                  disabled={loading || uploading}
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
        {products.length === 0 ? (
          <p className="text-center text-gray-400 py-10">No hay productos. ¡Creá el primero!</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">📦</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-sm text-gray-800 truncate">{p.name}</p>
                    {p.featured && <Star size={12} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                    {!p.available && <EyeOff size={12} className="text-gray-300 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-400">{p.category?.name} · ${p.price.toLocaleString("es-AR")}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
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
