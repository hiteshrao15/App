// =====================================================
// Development Seed Data — SAMPLE DATA ONLY
// Never use in production
// =====================================================
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Seed must not be run in production!');
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bottlebazaar';
  const pool = new Pool({ connectionString });

  console.log('\n🌱 Seeding development data...\n');
  console.log('⚠️  ALL DATA BELOW IS SAMPLE DATA FOR DEVELOPMENT ONLY\n');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Sample admin user (development only) ──────────
    // In production, create admin via secure setup script
    const adminResult = await client.query(`
      INSERT INTO users (phone, country_code, role, status, display_name, age_declared, age_declared_at)
      VALUES ('+911111111111', '+91', 'admin', 'active', 'Admin User [SAMPLE]', true, NOW())
      ON CONFLICT (phone) DO UPDATE SET display_name = EXCLUDED.display_name
      RETURNING id
    `);
    const adminId = adminResult.rows[0].id;
    console.log(`  ✅ Admin user: +911111111111 (SAMPLE — DO NOT USE IN PRODUCTION)`);

    // ── Sample store owner ────────────────────────────
    const ownerResult = await client.query(`
      INSERT INTO users (phone, country_code, role, status, display_name, age_declared, age_declared_at)
      VALUES ('+912222222222', '+91', 'store_owner', 'active', 'Store Owner [SAMPLE]', true, NOW())
      ON CONFLICT (phone) DO UPDATE SET display_name = EXCLUDED.display_name
      RETURNING id
    `);
    const ownerId = ownerResult.rows[0].id;
    console.log(`  ✅ Store owner: +912222222222 (SAMPLE)`);

    // ── Sample customer ───────────────────────────────
    const customerResult = await client.query(`
      INSERT INTO users (phone, country_code, role, status, display_name, age_declared, age_declared_at)
      VALUES ('+913333333333', '+91', 'customer', 'active', 'Test Customer [SAMPLE]', true, NOW())
      ON CONFLICT (phone) DO UPDATE SET display_name = EXCLUDED.display_name
      RETURNING id
    `);
    const customerId = customerResult.rows[0].id;
    console.log(`  ✅ Customer: +913333333333 (SAMPLE)`);

    // ── Get jurisdiction IDs ──────────────────────────
    const { rows: jurisdictions } = await client.query(
      `SELECT id, state_code FROM jurisdictions WHERE state_code IN ('MH', 'DL', 'KA')`
    );
    const mhId = jurisdictions.find(j => j.state_code === 'MH')?.id;
    const dlId = jurisdictions.find(j => j.state_code === 'DL')?.id;

    // ── Sample city ───────────────────────────────────
    const cityResult = await client.query(`
      INSERT INTO cities (jurisdiction_id, name, name_hi)
      VALUES ($1, 'Mumbai [SAMPLE]', 'मुंबई [नमूना]')
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [mhId]);
    const cityId = cityResult.rows[0]?.id;

    // ── Sample brands ─────────────────────────────────
    await client.query(`
      INSERT INTO brands (name, origin) VALUES
        ('Royal Stag [SAMPLE]', 'India'),
        ('Old Monk [SAMPLE]', 'India'),
        ('Kingfisher [SAMPLE]', 'India')
      ON CONFLICT (name) DO NOTHING
    `);
    const { rows: brands } = await client.query(`SELECT id, name FROM brands LIMIT 3`);

    // ── Sample products ───────────────────────────────
    const { rows: categories } = await client.query(
      `SELECT id, slug FROM categories`
    );
    const whiskyCat = categories.find(c => c.slug === 'whisky')?.id;
    const rumCat = categories.find(c => c.slug === 'rum')?.id;
    const beerCat = categories.find(c => c.slug === 'beer')?.id;

    const productResult = await client.query(`
      INSERT INTO products (category_id, brand_id, name, name_hi, description, volume_ml, pack_size)
      VALUES
        ($1, $4, 'Royal Stag Premium Whisky 750ml [SAMPLE]', 'रॉयल स्टैग प्रीमियम व्हिस्की [नमूना]', 'Sample blended malt whisky. SAMPLE DATA.', 750, '750ml'),
        ($2, $5, 'Old Monk Dark Rum 750ml [SAMPLE]', 'ओल्ड मोंक डार्क रम [नमूना]', 'Sample dark rum. SAMPLE DATA.', 750, '750ml'),
        ($3, $6, 'Kingfisher Premium Beer 650ml [SAMPLE]', 'किंगफिशर प्रीमियम बियर [नमूना]', 'Sample lager beer. SAMPLE DATA.', 650, '650ml')
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [whiskyCat, rumCat, beerCat, brands[0]?.id, brands[1]?.id, brands[2]?.id]);

    const products = productResult.rows;
    console.log(`  ✅ Seeded ${products.length} sample products`);

    // ── Sample approved store ─────────────────────────
    const storeResult = await client.query(`
      INSERT INTO stores (
        owner_id, jurisdiction_id, city_id, name, address_line1,
        city, state, pin_code, phone, status, approved_by, approved_at
      ) VALUES (
        $1, $2, $3, 'Andheri Wine Shop [SAMPLE]',
        '123 Sample Street, Andheri West [SAMPLE DATA]',
        'Mumbai', 'Maharashtra', '400053',
        '+912222222222', 'approved', $4, NOW()
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [ownerId, mhId, cityId, adminId]);

    const storeId = storeResult.rows[0]?.id;

    if (storeId && products.length > 0) {
      // ── Sample store products with pricing ───────────
      await client.query(`
        INSERT INTO store_products (store_id, product_id, price_paise, in_stock)
        VALUES
          ($1, $2, 142000, true),  -- Rs. 1420 for whisky
          ($1, $3, 98000, true),   -- Rs. 980 for rum
          ($1, $4, 18000, true)    -- Rs. 180 for beer
        ON CONFLICT DO NOTHING
      `, [storeId, products[0]?.id, products[1]?.id, products[2]?.id]);

      // ── Sample approved offer ─────────────────────────
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      await client.query(`
        INSERT INTO offers (
          store_id, product_id, created_by, title, title_hi,
          description, offer_type, original_price_paise, offer_price_paise,
          per_customer_limit, total_limit, valid_from, valid_until,
          status, reviewed_by, reviewed_at
        ) VALUES (
          $1, $2, $3,
          '₹50 Off Royal Stag 750ml [SAMPLE OFFER]',
          'रॉयल स्टैग पर ₹50 की छूट [नमूना]',
          'SAMPLE DATA — not a real offer. Rs. 50 off on Royal Stag 750ml.',
          'fixed_price', 142000, 137000,
          1, 100, NOW(), $4,
          'approved', $5, NOW()
        )
        ON CONFLICT DO NOTHING
      `, [storeId, products[0]?.id, ownerId, futureDate, adminId]);

      console.log(`  ✅ Seeded sample store, products, and offer`);
    }

    await client.query('COMMIT');
    console.log('\n✅ Development seed completed\n');
    console.log('📱 Test OTP: Use ANY 6-digit code when NODE_ENV=development');
    console.log('   Customer: +913333333333');
    console.log('   Owner:    +912222222222');
    console.log('   Admin:    +911111111111\n');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
