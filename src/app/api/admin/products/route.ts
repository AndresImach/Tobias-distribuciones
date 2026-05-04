import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, description, price, image, available, featured, categoryId } = body;

  const product = await prisma.product.create({
    data: { name, description, price: Number(price), image, available, featured, categoryId: Number(categoryId) },
    include: { category: true },
  });

  return NextResponse.json(product, { status: 201 });
}
