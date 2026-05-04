import { prisma } from "@/lib/prisma";
import CategoriesAdmin from "@/components/admin/CategoriesAdmin";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  return <CategoriesAdmin initialCategories={categories} />;
}
