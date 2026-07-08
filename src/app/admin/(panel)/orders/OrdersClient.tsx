"use client";

import { useState } from "react";
import { Trash2, MessageCircle } from "lucide-react";
import type { CartItem } from "@/lib/types";

type Order = {
  id: number;
  customerName: string;
  phone: string;
  items: string;
  total: number;
  source: string;
  createdAt: Date;
};

const isWhatsApp = (source: string) => source.toLowerCase() === "whatsapp";

export default function OrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [tab, setTab] = useState<"all" | "whatsapp">("all");

  const whatsappCount = orders.filter((o) => isWhatsApp(o.source)).length;
  const visibleOrders = tab === "whatsapp" ? orders.filter((o) => isWhatsApp(o.source)) : orders;

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este pedido del historial?")) return;
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    setOrders((os) => os.filter((o) => o.id !== id));
  };

  const handleDeleteAll = async () => {
    const target = visibleOrders;
    const label = tab === "whatsapp" ? "pedidos de WhatsApp" : "pedidos";
    if (!confirm(`¿Borrar los ${target.length} ${label} del historial? Esta acción no se puede deshacer.`)) return;
    await Promise.all(target.map((o) => fetch(`/api/orders/${o.id}`, { method: "DELETE" })));
    const deletedIds = new Set(target.map((o) => o.id));
    setOrders((os) => os.filter((o) => !deletedIds.has(o.id)));
  };

  const tabs = [
    { key: "all" as const, label: "Todos", count: orders.length },
    { key: "whatsapp" as const, label: "WhatsApp", count: whatsappCount },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Pedidos</h2>
        {visibleOrders.length > 0 && (
          <button
            onClick={handleDeleteAll}
            className="text-sm text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Trash2 size={13} />
            Borrar todo
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? "border-green-500 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
            <span className="ml-1.5 text-xs text-gray-400">{count}</span>
          </button>
        ))}
      </div>

      {visibleOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
          <p className="text-3xl mb-2">📋</p>
          <p>{tab === "whatsapp" ? "No hay pedidos de WhatsApp todavía" : "No hay pedidos todavía"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleOrders.map((order) => {
            const items: CartItem[] = JSON.parse(order.items);
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div className="min-w-0">
                    <span className="font-bold text-gray-800 text-sm">Pedido #{order.id}</span>
                    {isWhatsApp(order.source) && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 text-[11px] font-semibold px-2 py-0.5 align-middle">
                        <MessageCircle size={11} />
                        WhatsApp
                      </span>
                    )}
                    <span className="ml-2 text-sm text-gray-600 truncate">{order.customerName}</span>
                    <span className="ml-2 text-xs text-gray-400">{order.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-green-600 font-bold text-sm">${order.total.toLocaleString("es-AR")}</span>
                    <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString("es-AR")}</span>
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar pedido"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="px-4 py-3 space-y-1">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm gap-4">
                      <span className="text-gray-600 truncate">{item.quantity}x {item.product.name}</span>
                      <span className="text-gray-800 shrink-0">${(item.product.price * item.quantity).toLocaleString("es-AR")}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
