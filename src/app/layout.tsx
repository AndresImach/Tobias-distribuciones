import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import CartDrawer from "@/components/cart/CartDrawer";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tobias Distribuciones",
  description: "Catálogo de productos de Tobias Distribuciones",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50">
        {children}
        <CartDrawer />
      </body>
    </html>
  );
}
