"use client";

import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { useCartStore } from "@/store/cartStore";

// Sits above the mobile cart bar when the cart has items.
export default function WhatsAppFab({ href }: { href: string }) {
  const count = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className={`fixed right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-wa-500 text-white shadow-lg shadow-wa-500/40 transition-all hover:scale-105 active:scale-95 ${
        count > 0 ? "bottom-24 lg:bottom-5" : "bottom-5"
      }`}
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
