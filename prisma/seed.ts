import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: "almacen" }, update: {}, create: { name: "Almacén", slug: "almacen", emoji: "🛒", order: 1 } }),
    prisma.category.upsert({ where: { slug: "bebidas" }, update: {}, create: { name: "Bebidas", slug: "bebidas", emoji: "🥤", order: 2 } }),
    prisma.category.upsert({ where: { slug: "lacteos" }, update: {}, create: { name: "Lácteos", slug: "lacteos", emoji: "🥛", order: 3 } }),
    prisma.category.upsert({ where: { slug: "limpieza" }, update: {}, create: { name: "Limpieza", slug: "limpieza", emoji: "🧹", order: 4 } }),
    prisma.category.upsert({ where: { slug: "congelados" }, update: {}, create: { name: "Congelados", slug: "congelados", emoji: "❄️", order: 5 } }),
  ]);

  const [almacen, bebidas, lacteos, limpieza, congelados] = categories;

  const products = [
    // Almacén
    { name: "Aceite de girasol 1.5L", description: "Aceite de girasol refinado, ideal para cocinar", price: 2850, categoryId: almacen.id, featured: true },
    { name: "Azúcar blanco 1kg", description: "Azúcar refinado cristal", price: 1200, categoryId: almacen.id },
    { name: "Harina 000 1kg", description: "Harina de trigo triple cero", price: 980, categoryId: almacen.id },
    { name: "Arroz largo fino 1kg", description: "Arroz de grano largo", price: 1150, categoryId: almacen.id },
    { name: "Fideos spaghetti 500g", description: "Pasta de sémola de trigo", price: 750, categoryId: almacen.id },
    { name: "Sal fina 1kg", description: "Sal para mesa y cocina", price: 450, categoryId: almacen.id },
    // Bebidas
    { name: "Gaseosa Cola 2.25L", description: "Bebida gaseosa sabor cola", price: 1950, categoryId: bebidas.id, featured: true },
    { name: "Agua mineral 2L", description: "Agua sin gas natural", price: 850, categoryId: bebidas.id },
    { name: "Jugo de naranja 1L", description: "Jugo de naranja 100% natural", price: 1450, categoryId: bebidas.id },
    { name: "Cerveza lata 473ml", description: "Cerveza rubia lager", price: 1200, categoryId: bebidas.id },
    // Lácteos
    { name: "Leche entera 1L", description: "Leche entera pasteurizada", price: 1100, categoryId: lacteos.id, featured: true },
    { name: "Yogur entero 190g", description: "Yogur de sabores surtidos", price: 680, categoryId: lacteos.id },
    { name: "Queso cremoso x150g", description: "Queso cremoso en fetas", price: 2200, categoryId: lacteos.id },
    // Limpieza
    { name: "Detergente 750ml", description: "Detergente líquido para vajilla", price: 1350, categoryId: limpieza.id, featured: true },
    { name: "Lavandina 1L", description: "Hipoclorito de sodio concentrado", price: 780, categoryId: limpieza.id },
    { name: "Jabón en polvo 1kg", description: "Jabón para ropa a mano", price: 2100, categoryId: limpieza.id },
    { name: "Papel higiénico x4", description: "Papel higiénico doble hoja", price: 1600, categoryId: limpieza.id },
    // Congelados
    { name: "Empanadas carne x12", description: "Empanadas de carne caseras congeladas", price: 3200, categoryId: congelados.id, featured: true },
    { name: "Medallones de pollo x6", description: "Medallones apanados de pollo", price: 2400, categoryId: congelados.id },
    { name: "Pizza mozzarella", description: "Pizza congelada lista para hornear", price: 2800, categoryId: congelados.id },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  console.log(`Seeded ${products.length} products across ${categories.length} categories`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
