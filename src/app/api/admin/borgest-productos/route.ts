import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);

  const where = search
    ? {
        OR: [
          { name: { contains: search } },
          { barcode: { contains: search } },
          ...(Number.isInteger(Number(search)) ? [{ id: Number(search) }] : []),
        ],
      }
    : {};

  const items = await prisma.borgestProduct.findMany({
    where,
    orderBy: { name: "asc" },
    take: limit,
  });

  return NextResponse.json(items);
}
