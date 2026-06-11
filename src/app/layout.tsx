import type { Metadata } from "next";
import { Geist, Fraunces } from "next/font/google";
import "./globals.css";
import CartDrawer from "@/components/cart/CartDrawer";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tobias Distribuciones · Insumos de repostería y panadería",
  description:
    "Catálogo mayorista de insumos de repostería y panadería en Tucumán. Harinas, chocolates, esencias y más. Armá tu pedido y confirmalo por WhatsApp.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <CartDrawer />
      </body>
    </html>
  );
}
