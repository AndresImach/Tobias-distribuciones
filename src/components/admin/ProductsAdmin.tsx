"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Pencil, Trash2, Star, EyeOff, ImagePlus, X, Search, Link2, Link2Off } from "lucide-react";
import type { Product, Category, BorgestProduct } from "@/lib/types";
import { resolvePrice } from "@/lib/price";

type Props = {
  initialProducts: (Product & { category: Category; borgestProduct: BorgestProduct | null })[];
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
  borgestProductId: null as number | null,
  priceList: 1,
};

export default function ProductsAdmin({ initialProducts, categories }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [selectedBorgest, setSelectedBorgest] = useState<BorgestProduct | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadedByFile, setUploadedByFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = search.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.name.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const openNew = () => {
    setForm(emptyForm);
    setSelectedBorgest(null);
    setImagePreview("");
    setUploadedByFile(false);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (p: Product & { category: Category; borgestProduct: BorgestProduct | null }) => {
    setForm({
      name: p.name,
      description: p.description,
      price: p.price ? String(p.price) : "",
      image: p.image,
      available: p.available,
      featured: p.featured,
      categoryId: String(p.categoryId),
      borgestProductId: p.borgestProductId,
      priceList: p.priceList,
    });
    setSelectedBorgest(p.borgestProduct);
    setImagePreview(p.image);
    setUploadedByFile(false);
    setEditingId(p.id);
    setShowForm(true);
  };

  const compressImage = (file: File, maxPx = 1200, quality = 0.82): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("timeout")), 8000);
      const done = (result: Blob | Error) => {
        clearTimeout(timer);
        result instanceof Error ? reject(result) : resolve(result);
      };
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return done(new Error("canvas error"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => done(blob ?? new Error("compression failed")),
          "image/jpeg",
          quality,
        );
      };
      img.onerror = () => done(new Error("load error"));
      img.src = URL.createObjectURL(file);
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      let blob: Blob = file;
      try {
        blob = await compressImage(file);
      } catch {
        // fall back to original if compression fails or times out
      }

      const data = new FormData();
      data.append("file", new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));

      const res = await fetch("/api/admin/upload", { method: "POST", body: data });
      const json = await res.json();

      if (res.ok) {
        setForm((f) => ({ ...f, image: json.url }));
        setUploadedByFile(true);
      } else {
        setImagePreview(form.image);
        alert(json.error || "Error al subir la imagen");
      }
    } catch {
      setImagePreview(form.image);
      alert("No se pudo subir la imagen. Intentá de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setImagePreview("");
    setUploadedByFile(false);
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
      body: JSON.stringify({
        ...form,
        price: Number(form.price) || 0,
        categoryId: Number(form.categoryId),
        borgestProductId: form.borgestProductId,
        priceList: form.priceList,
      }),
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

  const handleBorgestSelect = (b: BorgestProduct | null) => {
    setSelectedBorgest(b);
    setForm((f) => ({ ...f, borgestProductId: b?.id ?? null }));
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

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto o categoría..."
          className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4 text-gray-800">{editingId ? "Editar producto" : "Nuevo producto"}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio {selectedBorgest && <span className="text-xs text-gray-400">(desde Borgest)</span>}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={selectedBorgest ? "Auto" : "Sin precio"}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    disabled={!!selectedBorgest}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-50 disabled:text-gray-400"
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
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                  />
                </div>

                <div className="sm:col-span-2">
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

                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-400 shrink-0">o pegar URL</span>
                    <input
                      type="url"
                      value={uploadedByFile ? "" : form.image}
                      onChange={(e) => {
                        setUploadedByFile(false);
                        setForm((f) => ({ ...f, image: e.target.value }));
                        setImagePreview(e.target.value);
                      }}
                      placeholder="https://..."
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 border-t border-gray-100 pt-3">
                  <BorgestLinker
                    selected={selectedBorgest}
                    priceList={form.priceList}
                    onSelect={handleBorgestSelect}
                    onPriceListChange={(n) => setForm((f) => ({ ...f, priceList: n }))}
                  />
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
        ) : filteredProducts.length === 0 ? (
          <p className="text-center text-gray-400 py-10">Sin resultados para &quot;{search}&quot;</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredProducts.map((p) => {
              const displayPrice = resolvePrice(p);
              return (
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
                      {p.borgestProduct && <Link2 size={12} className="text-blue-400 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-400">
                      {p.category?.name} · {displayPrice ? `$${displayPrice.toLocaleString("es-AR")}` : "Consultar"}
                      {p.borgestProduct && (
                        <span className="ml-1 text-blue-400">· stock {p.borgestProduct.stock}</span>
                      )}
                    </p>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function BorgestLinker({
  selected,
  priceList,
  onSelect,
  onPriceListChange,
}: {
  selected: BorgestProduct | null;
  priceList: number;
  onSelect: (b: BorgestProduct | null) => void;
  onPriceListChange: (n: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BorgestProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (selected) return;
    const q = query.trim();
    if (q.length < 2) return;
    const t = setTimeout(() => {
      setSearching(true);
      fetch(`/api/admin/borgest-productos?search=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data: BorgestProduct[]) => {
          setResults(data);
          setShowResults(true);
        })
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query, selected]);

  const priceForTier = (b: BorgestProduct, tier: number): number | null => {
    switch (tier) {
      case 2: return b.price2;
      case 3: return b.price3;
      case 4: return b.price4;
      default: return b.price1;
    }
  };

  if (selected) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Link2 size={14} className="text-blue-500 flex-shrink-0" />
              <span className="text-xs text-blue-600 font-medium">Vinculado a Borgest</span>
            </div>
            <p className="text-sm font-medium text-gray-800 truncate mt-1">{selected.name}</p>
            <p className="text-xs text-gray-500">
              ID {selected.id}
              {selected.barcode && ` · ${selected.barcode}`}
              · stock {selected.stock}
              · {selected.estado}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-gray-400 hover:text-red-500 p-1 rounded"
            title="Desvincular"
          >
            <Link2Off size={14} />
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Lista de precios a usar</label>
          <div className="grid grid-cols-4 gap-1">
            {[1, 2, 3, 4].map((n) => {
              const tierPrice = priceForTier(selected, n);
              const disabled = tierPrice == null;
              const active = priceList === n;
              return (
                <button
                  key={n}
                  type="button"
                  disabled={disabled}
                  onClick={() => onPriceListChange(n)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? "bg-blue-500 text-white"
                      : disabled
                      ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"
                  }`}
                >
                  <div>L{n}</div>
                  <div className={active ? "" : "text-[10px]"}>
                    {tierPrice != null ? `$${tierPrice.toLocaleString("es-AR")}` : "—"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Vincular con producto de Borgest <span className="text-xs text-gray-400 font-normal">(opcional)</span>
      </label>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder="Buscar por nombre, código de barras o ID..."
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        {showResults && (results.length > 0 || (query.length >= 2 && !searching)) && (
          <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {results.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400">Sin resultados</p>
            ) : (
              results.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    onSelect(b);
                    setQuery("");
                    setResults([]);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-50 last:border-0"
                >
                  <p className="text-sm font-medium text-gray-800 truncate">{b.name}</p>
                  <p className="text-xs text-gray-400">
                    #{b.id}{b.barcode && ` · ${b.barcode}`} · ${b.price1.toLocaleString("es-AR")} · stock {b.stock}
                  </p>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {searching && <p className="text-xs text-gray-400">Buscando...</p>}
    </div>
  );
}
