import { prisma } from "@/lib/prisma";
import CategoriesAdmin from "@/components/admin/CategoriesAdmin";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  return <CategoriesAdmin initialCategories={categories} />;
}
