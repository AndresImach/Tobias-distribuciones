import { prisma } from "@/lib/prisma";
import { Package, Tag, ShoppingBag, DollarSign } from "lucide-react";

export default async function AdminDashboard() {
  const [productCount, categoryCount, orderCount, orders] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.count(),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const totalRevenue = await prisma.order.aggregate({ _sum: { total: true } });

  const stats = [
    { label: "Productos", value: productCount, icon: Package, color: "bg-blue-50 text-blue-600" },
    { label: "Categorías", value: categoryCount, icon: Tag, color: "bg-purple-50 text-purple-600" },
    { label: "Pedidos", value: orderCount, icon: ShoppingBag, color: "bg-orange-50 text-orange-600" },
    {
      label: "Total ventas",
      value: `$${(totalRevenue._sum.total ?? 0).toLocaleString("es-AR")}`,
      icon: DollarSign,
      color: "bg-green-50 text-green-600",
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Resumen</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Últimos pedidos</h3>
        </div>
        {orders.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Aún no hay pedidos</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {orders.map((order) => (
              <div key={order.id} className="px-5 py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm text-gray-800">#{order.id} – {order.customerName}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString("es-AR")}</p>
                </div>
                <span className="font-semibold text-green-600 text-sm">${order.total.toLocaleString("es-AR")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
