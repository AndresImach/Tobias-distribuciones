import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  // Limpiar datos existentes
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  const categories = await Promise.all([
    prisma.category.create({ data: { name: "Harinas", slug: "harinas", emoji: "🌾", order: 1 } }),
    prisma.category.create({ data: { name: "Azúcares", slug: "azucares", emoji: "🍯", order: 2 } }),
    prisma.category.create({ data: { name: "Grasas y Aceites", slug: "grasas", emoji: "🧈", order: 3 } }),
    prisma.category.create({ data: { name: "Levaduras y Polvos", slug: "levaduras", emoji: "🫧", order: 4 } }),
    prisma.category.create({ data: { name: "Chocolates", slug: "chocolates", emoji: "🍫", order: 5 } }),
    prisma.category.create({ data: { name: "Esencias y Colorantes", slug: "esencias", emoji: "🎨", order: 6 } }),
  ]);

  const [harinas, azucares, grasas, levaduras, chocolates, esencias] = categories;

  const products = [
    // Harinas
    { name: "Harina 000 x 25kg", description: "Harina de trigo triple cero, ideal para masas de pizza y pan", price: 18500, categoryId: harinas.id, featured: true },
    { name: "Harina 0000 x 25kg", description: "Harina refinada para repostería fina y facturas", price: 21000, categoryId: harinas.id },
    { name: "Harina 000 x 1kg", description: "Bolsa individual para uso doméstico", price: 950, categoryId: harinas.id },
    { name: "Harina de Maíz x 5kg", description: "Para polenta, tortas y repostería sin gluten", price: 6800, categoryId: harinas.id },
    { name: "Fécula de Maíz x 1kg", description: "Maicena para cremas, budines y espesar", price: 1800, categoryId: harinas.id },

    // Azúcares
    { name: "Azúcar Blanco x 50kg", description: "Azúcar refinado granulado, bolsa mayorista", price: 52000, categoryId: azucares.id, featured: true },
    { name: "Azúcar Blanco x 5kg", description: "Azúcar refinado cristal", price: 5800, categoryId: azucares.id },
    { name: "Azúcar Impalpable x 1kg", description: "Azúcar en polvo para decoración y glaseados", price: 2100, categoryId: azucares.id },
    { name: "Azúcar Moreno x 1kg", description: "Azúcar integral, ideal para bizcochos y cookies", price: 2400, categoryId: azucares.id },

    // Grasas y Aceites
    { name: "Margarina Vegetal x 10kg", description: "Margarina para pastelería y repostería profesional", price: 38000, categoryId: grasas.id, featured: true },
    { name: "Aceite de Girasol x 5L", description: "Aceite refinado para frituras y preparaciones", price: 14500, categoryId: grasas.id },
    { name: "Manteca x 1kg", description: "Manteca de vaca sin sal para pastelería", price: 5200, categoryId: grasas.id },
    { name: "Grasa Vegetal x 10kg", description: "Grasa para freír facturas y preparaciones", price: 28000, categoryId: grasas.id },

    // Levaduras y Polvos
    { name: "Levadura Seca x 500g", description: "Levadura instantánea para panes y pizzas", price: 4800, categoryId: levaduras.id, featured: true },
    { name: "Polvo de Hornear x 1kg", description: "Leudante químico para tortas y bizcochuelos", price: 3200, categoryId: levaduras.id },
    { name: "Bicarbonato x 500g", description: "Bicarbonato de sodio para repostería", price: 1500, categoryId: levaduras.id },
    { name: "Levadura Fresca x 500g", description: "Levadura fresca de panadero", price: 2800, categoryId: levaduras.id },

    // Chocolates
    { name: "Cobertura Negra x 5kg", description: "Chocolate de cobertura amargo 60% cacao", price: 42000, categoryId: chocolates.id, featured: true },
    { name: "Cobertura Blanca x 5kg", description: "Chocolate blanco para bañar y decorar", price: 46000, categoryId: chocolates.id },
    { name: "Cacao en Polvo x 1kg", description: "Cacao amargo sin azúcar para repostería", price: 8500, categoryId: chocolates.id },

    // Esencias y Colorantes
    { name: "Esencia de Vainilla x 500cc", description: "Esencia natural concentrada para pastelería", price: 3800, categoryId: esencias.id },
    { name: "Colorantes en Gel x set 12", description: "Kit de colorantes alimentarios en gel", price: 5500, categoryId: esencias.id, featured: true },
    { name: "Esencia de Limón x 500cc", description: "Esencia cítrica para alfajores y tortas", price: 3200, categoryId: esencias.id },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  console.log(`✓ Seeded ${products.length} products in ${categories.length} categories`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
