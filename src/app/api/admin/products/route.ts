import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    include: { category: true, borgestProduct: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, description, price, image, available, featured, categoryId, borgestProductId, priceList } = body;

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price: Number(price),
      image,
      available,
      featured,
      categoryId: Number(categoryId),
      borgestProductId: borgestProductId != null ? Number(borgestProductId) : null,
      priceList: priceList ? Number(priceList) : 1,
    },
    include: { category: true, borgestProduct: true },
  });

  return NextResponse.json(product, { status: 201 });
}
