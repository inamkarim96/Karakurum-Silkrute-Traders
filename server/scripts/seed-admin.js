require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const bcrypt = require("bcryptjs");
const db = require("../src/config/mongo");

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminPhone = process.env.ADMIN_PHONE;

  if (!adminEmail || !adminPassword || !adminPhone) {
    console.error('❌ ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_PHONE must be set in .env');
    process.exit(1);
  }

  console.log(`🔧 Seeding admin user to MongoDB Atlas: ${adminEmail}`);

  try {
    await db.$connect();
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const admin = await db.users.upsert({
      where: { email: adminEmail.toLowerCase().trim() },
      update: {
        name: 'Admin',
        role: 'admin',
        password_hash: passwordHash,
        phone: adminPhone,
        is_active: true,
        email_verified: true,
        auth_provider: 'local'
      },
      create: {
        email: adminEmail.toLowerCase().trim(),
        name: 'Admin',
        role: 'admin',
        password_hash: passwordHash,
        phone: adminPhone,
        is_active: true,
        email_verified: true,
        auth_provider: 'local'
      }
    });

    console.log('✅ Admin user upserted successfully in MongoDB Atlas');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Active: ${admin.is_active}`);
  } catch (err) {
    console.error('❌ Failed to seed admin in MongoDB Atlas:', err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

seedAdmin();
