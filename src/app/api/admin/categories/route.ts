import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, slug, emoji, order } = body;
  const category = await prisma.category.create({
    data: { name, slug, emoji, order: Number(order ?? 0) },
  });
  return NextResponse.json(category, { status: 201 });
}
