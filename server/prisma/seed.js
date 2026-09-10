const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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

async function seed() {
  const existingSettings = await prisma.site_settings.findFirst();
  const settingsData = {
    company_name: 'Karakurum Silkrute Traders',
    tagline: 'Wholesale & Retail Trading - Blankets & Home Items',
    address_line: 'Fida Jan Plaza, Baig Market',
    city: 'Danyore',
    footer_text: 'Wholesale and retail trading, sourcing, cargo, and customs support from Danyore.'
  };

  if (existingSettings) {
    await prisma.site_settings.update({ where: { id: existingSettings.id }, data: settingsData });
  } else {
    await prisma.site_settings.create({ data: settingsData });
  }

  for (const category of categories) {
    await prisma.categories.upsert({ where: { slug: category.slug }, update: category, create: category });
  }

  for (const service of services) {
    const existing = await prisma.services.findFirst({ where: { title: service.title } });
    if (existing) {
      await prisma.services.update({ where: { id: existing.id }, data: service });
    } else {
      await prisma.services.create({ data: service });
    }
  }

  const blankets = await prisma.categories.findUnique({ where: { slug: 'blankets' } });
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
      category_id: blankets.id,
      variants: [
        { label: 'Queen - Charcoal', attribute_name: 'Size / Color', attribute_value: 'Queen / Charcoal', price: 8500, wholesale_price: 7200, stock: 20, sort_order: 0 },
        { label: 'King - Maroon', attribute_name: 'Size / Color', attribute_value: 'King / Maroon', price: 9800, wholesale_price: 8300, stock: 20, sort_order: 1 }
      ]
    }
  ];

  for (const product of products) {
    const { variants, ...productData } = product;
    const saved = await prisma.products.upsert({
      where: { slug: product.slug },
      update: productData,
      create: productData
    });

    for (const variant of variants) {
      const existing = await prisma.product_variants.findFirst({ where: { product_id: saved.id, label: variant.label } });
      if (existing) {
        await prisma.product_variants.update({ where: { id: existing.id }, data: variant });
      } else {
        await prisma.product_variants.create({ data: { ...variant, product_id: saved.id } });
      }
    }
  }

  console.log('Seed data created or updated successfully.');
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
