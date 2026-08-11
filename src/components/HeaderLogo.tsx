"use client";

import Image from "next/image";
import Link from "next/link";

export default function HeaderLogo() {
  return (
    <Link
      href="/"
      onClick={(e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      aria-label="Tobias Distribuciones — ir al inicio"
    >
      <Image
        src="/logo.png"
        alt="Tobias Distribuciones"
        width={1209}
        height={404}
        className="h-14 w-auto object-contain sm:h-16"
        priority
      />
    </Link>
  );
}
