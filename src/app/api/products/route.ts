import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get("category");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { available: true };

  if (categorySlug && categorySlug !== "all") {
    where.category = { slug: categorySlug };
  }

  if (search) {
    where.name = { contains: search };
  }

  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(products);
}
