import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePrice } from "@/lib/price";

export async function GET() {
  const products = await prisma.product.findMany({
    include: { category: true, borgestProduct: true },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(products.map((p) => ({ ...p, price: resolvePrice(p) })));
}
