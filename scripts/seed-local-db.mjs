import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

const client = createClient({ url, ...(authToken ? { authToken } : {}) });

async function seed() {
  console.log(`Seeding ${url} with sample catalogue products...`);

  const existing = await client.execute("SELECT COUNT(*) as count FROM products");
  if (existing.rows[0].count > 0) {
    console.log("local.db already has products:", existing.rows[0].count);
    return;
  }

  const now = Date.now();
  const sampleProducts = [
    {
      id: "prod-solar-home-1",
      category: "solar",
      brand: "SIB Solar",
      name: "3.5kVA Solar Inverter Home System",
      slug: "3-5kva-solar-inverter-home-system",
      description: "Complete residential solar kit with pure sine wave inverter and lithium storage.",
      cash_price: 350000,
      images: "[]",
      specs: JSON.stringify({ Inverter: "3.5kVA", Storage: "5.1kWh Lithium", Capacity: "Lights, fans, TV, fridge" }),
      in_stock: 1,
      featured: 1,
      sort_order: 1,
      is_published: 1,
      created_at: now
    },
    {
      id: "prod-solar-biz-2",
      category: "solar",
      brand: "SIB Solar",
      name: "5.0kVA Commercial Inverter System",
      slug: "5-0kva-commercial-inverter-system",
      description: "Heavy duty commercial solar power system for shops, pharmacies, and small businesses.",
      cash_price: 650000,
      images: "[]",
      specs: JSON.stringify({ Inverter: "5.0kVA", Storage: "10kWh Lithium", Duty: "Commercial deep freezer & equipment" }),
      in_stock: 1,
      featured: 1,
      sort_order: 2,
      is_published: 1,
      created_at: now
    },
    {
      id: "prod-phone-samsung-a15",
      category: "phones",
      brand: "Samsung",
      name: "Samsung Galaxy A15 (128GB)",
      slug: "samsung-galaxy-a15",
      description: "6.5-inch Super AMOLED display, 128GB storage, 4GB RAM, 5000mAh battery.",
      cash_price: 195000,
      images: "[]",
      specs: JSON.stringify({ Screen: "6.5 inch Super AMOLED", Storage: "128GB", RAM: "4GB", Battery: "5000mAh" }),
      in_stock: 1,
      featured: 1,
      sort_order: 3,
      is_published: 1,
      created_at: now
    },
    {
      id: "prod-phone-tecno-spark-20",
      category: "phones",
      brand: "Tecno",
      name: "Tecno Spark 20 (128GB)",
      slug: "tecno-spark-20",
      description: "6.6-inch 90Hz display, 128GB storage, 8GB RAM with long-lasting battery.",
      cash_price: 145000,
      images: "[]",
      specs: JSON.stringify({ Screen: "6.6 inch", Storage: "128GB", RAM: "8GB", Battery: "5000mAh" }),
      in_stock: 1,
      featured: 0,
      sort_order: 4,
      is_published: 1,
      created_at: now
    },
    {
      id: "prod-laptop-hp-250",
      category: "laptops",
      brand: "HP",
      name: "HP 250 G9 Laptop (Core i5)",
      slug: "hp-250-g9-laptop",
      description: "15.6-inch business laptop with Intel Core i5, 8GB RAM, 512GB SSD.",
      cash_price: 520000,
      images: "[]",
      specs: JSON.stringify({ Processor: "Intel Core i5", Storage: "512GB SSD", RAM: "8GB", Screen: "15.6 inch" }),
      in_stock: 1,
      featured: 1,
      sort_order: 5,
      is_published: 1,
      created_at: now
    }
  ];

  for (const p of sampleProducts) {
    await client.execute({
      sql: `INSERT INTO products (id, category, brand, name, slug, description, cash_price, images, specs, in_stock, featured, sort_order, is_published, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [p.id, p.category, p.brand, p.name, p.slug, p.description, p.cash_price, p.images, p.specs, p.in_stock, p.featured, p.sort_order, p.is_published, p.created_at]
    });
  }

  console.log(`Seeded ${sampleProducts.length} published products into local.db successfully.`);
}

seed().catch(console.error);
