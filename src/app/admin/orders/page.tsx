import { prisma } from "@/lib/prisma";
import type { CartItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });

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
                <div className="px-5 py-3 bg-gray-50 flex justify-between items-center border-b border-gray-100">
                  <div>
                    <span className="font-bold text-gray-800">Pedido #{order.id}</span>
                    <span className="ml-3 text-sm text-gray-500">{order.customerName} · {order.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 font-bold">${order.total.toLocaleString("es-AR")}</span>
                    <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString("es-AR")}</span>
                  </div>
                </div>
                <div className="px-5 py-3 space-y-1">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.quantity}x {item.product.name}</span>
                      <span className="text-gray-800">${(item.product.price * item.quantity).toLocaleString("es-AR")}</span>
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
