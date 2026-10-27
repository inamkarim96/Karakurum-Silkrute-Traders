require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const db = require("../src/config/mongo");

const categories = [
  { name: 'Blankets', slug: 'blankets', image: 'https://images.unsplash.com/photo-1580301762395-21ce6e0dcf2d?auto=format&fit=crop&q=80&w=600' },
  { name: 'Home Textiles', slug: 'home-textiles', image: 'https://images.unsplash.com/photo-1616486338812-3d954c812d8a?auto=format&fit=crop&q=80&w=600' },
  { name: 'Decorative Items', slug: 'decorative-items', image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&q=80&w=600' },
  { name: 'Trading Goods', slug: 'trading-goods', image: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&q=80&w=600' }
];

const services = [
  { title: 'Bulk Trading', description: 'Reliable wholesale supply for retailers and businesses.', icon: 'trade', sort_order: 0 },
  { title: 'China Sourcing', description: 'Product sourcing and supplier coordination for your requirements.', icon: 'sourcing', sort_order: 1 },
  { title: 'Cargo Coordination', description: 'Practical cargo support from supplier to destination.', icon: 'cargo', sort_order: 2 },
  { title: 'Customs Support', description: 'Guidance through import documentation and customs processes.', icon: 'customs', sort_order: 3 }
];

const starterTestimonials = [
  {
    name: 'Tariq Mehmood',
    role: 'Textile Retailer, Lahore',
    quote: 'We have been ordering wholesale blanket cartons from Karakurum Silkrute Traders for two seasons. The quality check in Danyore and cargo dispatch to Lahore is always on time.',
    rating: 5,
    sort_order: 0,
    is_active: true
  },
  {
    name: 'Shabbir Hussain',
    role: 'Hotel Operator, Hunza & Skardu',
    quote: 'Finding durable, warm blankets for hospitality in northern winters is tough. Their premium wool quilts exceeded our expectations. Highly recommended!',
    rating: 5,
    sort_order: 1,
    is_active: true
  },
  {
    name: 'Amina Farooq',
    role: 'Retail Buyer, Islamabad',
    quote: 'Prompt WhatsApp customer support and hassle-free payment. The blankets arrived well-packaged and even more luxurious than pictured.',
    rating: 5,
    sort_order: 2,
    is_active: true
  }
];

async function seed() {
  console.log("Connecting to MongoDB Atlas...");
  await db.$connect();

  const existingSettings = await db.site_settings.findFirst();
  const settingsData = {
    company_name: 'Karakurum Silkrute Traders',
    tagline: 'Wholesale & Retail Trading - Blankets & Home Items',
    address_line: 'Fida Jan Plaza, Baig Market',
    city: 'Danyore',
    footer_text: 'Wholesale and retail trading, sourcing, cargo, and customs support from Danyore.'
  };

  if (existingSettings) {
    await db.site_settings.update({ where: { id: existingSettings.id }, data: settingsData });
  } else {
    await db.site_settings.create({ data: settingsData });
  }

  for (const category of categories) {
    await db.categories.upsert({ where: { slug: category.slug }, update: category, create: category });
  }

  for (const service of services) {
    const existing = await db.services.findFirst({ where: { title: service.title } });
    if (existing) {
      await db.services.update({ where: { id: existing.id }, data: service });
    } else {
      await db.services.create({ data: service });
    }
  }

  for (const item of starterTestimonials) {
    const existing = await db.testimonials.findFirst({ where: { name: item.name } });
    if (existing) {
      await db.testimonials.update({ where: { id: existing.id }, data: item });
    } else {
      await db.testimonials.create({ data: item });
    }
  }

  const blankets = await db.categories.findUnique({ where: { slug: 'blankets' } });
  const products = [
    {
      name: 'Premium Wool Blanket',
      slug: 'premium-wool-blanket',
      description: 'Warm, durable wool blanket suitable for homes, retailers, and hospitality businesses.',
      base_price: 8500,
      wholesale_price: 7200,
      min_wholesale_qty: 10,
      stock: 40,
      images: ['https://images.unsplash.com/photo-1580301762395-21ce6e0dcf2d?auto=format&fit=crop&q=80&w=900'],
      is_featured: true,
      category_id: blankets?.id,
      product_variants: [
        { label: 'Queen - Charcoal', attribute_name: 'Size / Color', attribute_value: 'Queen / Charcoal', price: 8500, wholesale_price: 7200, stock: 20, sort_order: 0 },
        { label: 'King - Maroon', attribute_name: 'Size / Color', attribute_value: 'King / Maroon', price: 9800, wholesale_price: 8300, stock: 20, sort_order: 1 }
      ]
    }
  ];

  for (const product of products) {
    await db.products.upsert({
      where: { slug: product.slug },
      update: product,
      create: product
    });
  }

  console.log('✅ MongoDB Atlas seed data created or updated successfully.');
}

seed()
  .catch((error) => {
    console.error('❌ Seed error:', error);
    process.exitCode = 1;
  })
  .finally(async () => db.$disconnect());
