import { prisma } from "@/lib/prisma";
import CatalogClient from "@/components/catalog/CatalogClient";
import CartButton from "@/components/cart/CartButton";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import Image from "next/image";
import { MapPin, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { products: { where: { available: true } } } } },
  });

  const productCount = categories.reduce((sum, c) => sum + (c._count?.products ?? 0), 0);
  const whatsappNumber = process.env.WHATSAPP_NUMBER;
  const waHref = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-brand-950/5 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Image
            src="/logo.png"
            alt="Tobias Distribuciones"
            width={110}
            height={38}
            className="h-9 w-auto object-contain"
            priority
          />
          <div className="flex items-center gap-3">
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-brand-900 transition-colors hover:bg-wa-100 hover:text-wa-700 sm:flex"
              >
                <WhatsAppIcon className="h-4.5 w-4.5 text-wa-600" />
                Escribinos
              </a>
            )}
            <CartButton />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-950">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-caramel-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-caramel-300">
            Distribuidora mayorista · Tucumán
          </p>
          <h1 className="mt-3 max-w-xl font-display text-4xl leading-[1.08] text-cream-50 sm:text-5xl">
            Todo para tu repostería, en un solo lugar
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-cream-50/65 sm:text-base">
            {productCount > 0 ? `Más de ${productCount} productos: harinas, ` : "Harinas, "}
            chocolates, esencias y todo lo que tu cocina necesita, a precio mayorista.
            Armá tu pedido y confirmalo por WhatsApp.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-cream-50/90 ring-1 ring-white/10">
              <Clock size={13} className="text-caramel-300" /> Lun–Sáb 8:00–18:00
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-cream-50/90 ring-1 ring-white/10">
              <MapPin size={13} className="text-caramel-300" /> Tucumán, Argentina
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-cream-50/90 ring-1 ring-white/10">
              <WhatsAppIcon className="h-3.5 w-3.5 text-wa-500" /> Pedidos por WhatsApp
            </span>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20">
        <CatalogClient initialCategories={categories} />
      </main>

      {/* Floating WhatsApp button */}
      {waHref && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribinos por WhatsApp"
          className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-wa-500 text-white shadow-lg shadow-wa-500/40 transition-transform hover:scale-105 active:scale-95"
        >
          <WhatsAppIcon className="h-7 w-7" />
        </a>
      )}

      {/* Footer */}
      <footer className="bg-brand-950 text-cream-50">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="grid gap-10 sm:grid-cols-3">
            <div>
              <p className="font-display text-2xl">Tobias Distribuciones</p>
              <p className="mt-3 text-sm leading-relaxed text-cream-50/50">
                Insumos de repostería y panadería al por mayor en Tucumán.
                Calidad y precio para tu emprendimiento.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cream-50/40">
                Contacto
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                {waHref && (
                  <li>
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-cream-50/80 transition-colors hover:text-wa-500"
                    >
                      <WhatsAppIcon className="h-4 w-4" /> WhatsApp
                    </a>
                  </li>
                )}
                <li>
                  <a
                    href="https://www.instagram.com/tobiasdistribuciones/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-cream-50/80 transition-colors hover:text-caramel-300"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                    @tobiasdistribuciones
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.facebook.com/tobiasdistribuciones/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-cream-50/80 transition-colors hover:text-caramel-300"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cream-50/40">
                Atención
              </p>
              <ul className="mt-4 space-y-3 text-sm text-cream-50/80">
                <li className="flex items-start gap-2.5">
                  <Clock size={16} className="mt-0.5 shrink-0 text-cream-50/40" />
                  Lunes a Sábado · 8:00–18:00 hs
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-cream-50/40" />
                  San Miguel de Tucumán, Argentina
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-white/10 pt-6 text-xs text-cream-50/35">
            © {new Date().getFullYear()} Tobias Distribuciones · Hacé tu pedido por WhatsApp
          </div>
        </div>
      </footer>
    </div>
  );
}
