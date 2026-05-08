import Link from "next/link";
import { LayoutDashboard, Package, Tag, ShoppingBag, ArrowLeft } from "lucide-react";

export const metadata = { title: "Admin – Tobias Distribuciones" };

const navItems = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/products", label: "Productos", icon: Package },
  { href: "/admin/categories", label: "Categorías", icon: Tag },
  { href: "/admin/orders", label: "Pedidos", icon: ShoppingBag },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 min-w-0">
          <Link href="/" className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm shrink-0">
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Volver a la tienda</span>
          </Link>
          <span className="text-gray-300 hidden sm:inline">|</span>
          <h1 className="font-bold text-gray-800 flex items-center gap-2 truncate text-sm sm:text-base">
            <LayoutDashboard size={18} className="text-green-500 shrink-0" />
            <span>Panel de administración</span>
          </h1>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full flex flex-col">
        {/* Mobile tab nav — stacked above content */}
        <nav className="sm:hidden bg-white border-b border-gray-200 px-3 py-2 flex gap-1 overflow-x-auto shrink-0">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-green-50 hover:text-green-700 border border-gray-200 whitespace-nowrap"
            >
              <Icon size={14} /> {label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar — desktop only */}
          <aside className="w-52 shrink-0 p-4 border-r border-gray-200 bg-white hidden sm:block">
            <nav className="space-y-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-colors"
                >
                  <Icon size={16} /> {label}
                </Link>
              ))}
            </nav>
          </aside>

          <main className="flex-1 p-4 sm:p-6 overflow-auto min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
