"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { CartItem } from "@/lib/types";

type Order = {
  id: number;
  customerName: string;
  phone: string;
  items: string;
  total: number;
  createdAt: Date;
};

export default function OrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este pedido del historial?")) return;
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    setOrders((os) => os.filter((o) => o.id !== id));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Pedidos</h2>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
          <p className="text-3xl mb-2">📋</p>
          <p>No hay pedidos todavía</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const items: CartItem[] = JSON.parse(order.items);
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div className="min-w-0">
                    <span className="font-bold text-gray-800 text-sm">Pedido #{order.id}</span>
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
