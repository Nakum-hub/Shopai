// =============================================================================
// StoreCraft AI — Database Seed Script
// =============================================================================
// Populates the database with initial data for a fresh deployment:
// - Admin user account
// - Sample templates (optional)
//
// Usage: bun prisma/seed.ts
//   or:  bun run db:seed
// =============================================================================

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const db = new PrismaClient();

// =============================================================================
// Seed Data
// =============================================================================

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@storecraft.ai';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'StoreCraft Admin';

// =============================================================================
// Main Seed Function
// =============================================================================

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ---------------------------------------------------------------------------
  // 1. Create Admin User (idempotent — skips if already exists)
  // ---------------------------------------------------------------------------
  const existingAdmin = await db.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existingAdmin) {
    console.log(`✅ Admin user already exists: ${ADMIN_EMAIL}`);
  } else {
    const hashedPassword = await hash(ADMIN_PASSWORD, 12);
    const admin = await db.user.create({
      data: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin',
        emailVerified: new Date(),
      },
    });
    console.log(`✅ Created admin user: ${admin.email} (id: ${admin.id})`);
    console.log(`   ⚠️  Default password: ${ADMIN_PASSWORD} — CHANGE THIS IMMEDIATELY`);
  }

  // ---------------------------------------------------------------------------
  // 2. Create Demo Storefront (idempotent — skips if any storefronts exist)
  // ---------------------------------------------------------------------------
  const storefrontCount = await db.storefront.count();

  if (storefrontCount > 0) {
    console.log(`✅ Storefronts already exist (${storefrontCount} found) — skipping demo`);
  } else {
    const admin = await db.user.findUnique({ where: { email: ADMIN_EMAIL } });
    if (admin) {
      const demoStorefront = await db.storefront.create({
        data: {
          name: 'Demo Coffee Shop',
          businessName: 'Sunrise Coffee Co.',
          category: 'food_beverage',
          status: 'draft',
          description: 'A cozy artisan coffee shop with locally sourced beans and fresh pastries.',
          userId: admin.id,
          generatedHtml: null,
          generatedCss: null,
          metadata: JSON.stringify({
            seeded: true,
            createdBy: 'seed-script',
            version: '2.0.0',
          }),
        },
      });
      console.log(`✅ Created demo storefront: ${demoStorefront.name} (id: ${demoStorefront.id})`);
    }
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  const userCount = await db.user.count();
  const finalStorefrontCount = await db.storefront.count();

  console.log('\n📊 Database Summary:');
  console.log(`   Users:       ${userCount}`);
  console.log(`   Storefronts: ${finalStorefrontCount}`);
  console.log('\n✨ Seed completed successfully!');
}

// =============================================================================
// Execute
// =============================================================================

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await db.$disconnect();
    process.exit(1);
  });
