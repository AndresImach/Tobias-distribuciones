import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { name, description, price, image, available, featured, categoryId, borgestProductId, priceList } = body;

  const product = await prisma.product.update({
    where: { id: Number(id) },
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

  return NextResponse.json(product);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.product.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
