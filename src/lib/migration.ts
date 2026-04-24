import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Product from '../models/Product';
import Table from '../models/Table';
import Settings from '../models/Settings';

export async function runMigration() {
  console.log('[Migration] Starting database migration check...');
  const state = mongoose.connection.readyState;
  if (state !== 1) {
    console.warn('[Migration] Skipping migration: Database not connected.');
    return;
  }

  try {
    const tenantId = 'demo';

    // 1. Ensure Super Admin
    await ensureSuperAdmin();

    // 2. Ensure Tables
    const tableCount = await Table.countDocuments({ tenantId });
    if (tableCount === 0) {
      console.log('[Migration] Seeding initial tables...');
      await seedTables(tenantId);
    }

    // 3. Ensure Products
    const productCount = await Product.countDocuments({ tenantId });
    if (productCount === 0) {
      console.log('[Migration] Seeding initial products...');
      await seedProducts(tenantId);
    } else {
      console.log(`[Migration] Found ${productCount} products. Performing data validation...`);
      await migrateProducts(tenantId);
    }

    // 4. Ensure Global Settings
    await ensureSettings(tenantId);

    console.log('[Migration] Database migration check completed successfully.');
  } catch (err) {
    console.error('[Migration] Migration failed:', err);
  }
}

async function ensureSuperAdmin() {
  const adminEmail = 'admin@sganpos.vn';
  const existing = await User.findOne({ email: adminEmail });
  const hashedPassword = await bcrypt.hash('admin@123', 10);

  if (!existing) {
    const superAdmin = new User({
      tenantId: 'demo',
      name: 'Super Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true
    });
    await superAdmin.save();
    console.log('[Migration] Created Super Admin account.');
  } else {
    // Sync roles/isActive just in case
    await User.updateOne(
      { _id: existing._id },
      { 
        $set: { 
          role: 'ADMIN', 
          isActive: true,
          tenantId: 'demo' 
        } 
      }
    );
    console.log('[Migration] Super Admin account verified.');
  }
}

async function seedTables(tenantId: string) {
  const demoTables = [];
  // 20 Bàn tại chỗ
  for (let i = 1; i <= 20; i++) {
    demoTables.push({ 
      tenantId, 
      name: `Bàn ${String(i).padStart(2, '0')}`, 
      status: 'EMPTY',
      isActive: true,
      type: 'DINE_IN' 
    });
  }
  // 10 Bàn mang về
  for (let i = 1; i <= 10; i++) {
    demoTables.push({ 
      tenantId, 
      name: `Mang về ${String(i).padStart(2, '0')}`, 
      status: 'EMPTY',
      isActive: true,
      type: 'TAKEAWAY' 
    });
  }
  // 10 Bàn ship đi
  for (let i = 1; i <= 10; i++) {
    demoTables.push({ 
      tenantId, 
      name: `Ship đi ${String(i).padStart(2, '0')}`, 
      status: 'EMPTY',
      isActive: true,
      type: 'DELIVERY' 
    });
  }
  await Table.insertMany(demoTables);
  console.log(`[Migration] Seeded ${demoTables.length} tables.`);
}

async function seedProducts(tenantId: string) {
  const products = [
    { tenantId, name: 'Phin sữa đá', basePrice: 25000, category: 'Cà phê' },
    { tenantId, name: 'Phin đen đá', basePrice: 25000, category: 'Cà phê' },
    { tenantId, name: 'Pha máy sữa đá', basePrice: 25000, category: 'Cà phê' },
    { tenantId, name: 'Pha máy đen đá', basePrice: 25000, category: 'Cà phê' },
    { tenantId, name: 'Bạc xỉu', basePrice: 30000, category: 'Cà phê' },
    { tenantId, name: 'Cà phê sữa tươi', basePrice: 30000, category: 'Cà phê' },
    { tenantId, name: 'Cacao sữa', basePrice: 30000, category: 'Cà phê' },
    { tenantId, name: 'Cà phê Baileys', basePrice: 35000, category: 'Cà phê' },
    { tenantId, name: 'Cacao kem mặn', basePrice: 35000, category: 'Cà phê' },
    { tenantId, name: 'Phin muối', basePrice: 30000, category: 'Cà phê' },
    { tenantId, name: 'Cà phê SaigonAn', basePrice: 35000, category: 'Cà phê' },
    { tenantId, name: 'Sữa chua đá', basePrice: 25000, category: 'Sữa chua' },
    { tenantId, name: 'Sữa chua chanh dây', basePrice: 30000, category: 'Sữa chua' },
    { tenantId, name: 'Sữa chua đào', basePrice: 30000, category: 'Sữa chua' },
    { tenantId, name: 'Sữa chua dâu tây', basePrice: 30000, category: 'Sữa chua' },
    { tenantId, name: 'Sữa chua trái cây nhiệt đới', basePrice: 35000, category: 'Sữa chua' },
    { tenantId, name: 'Sữa chua Việt quất', basePrice: 30000, category: 'Sữa chua' },
    { tenantId, name: 'Sữa tươi matcha phô mai', basePrice: 35000, category: 'Sữa tươi' },
    { tenantId, name: 'Sữa tươi trân châu đường đen', basePrice: 35000, category: 'Sữa tươi' },
    { tenantId, name: 'Sữa tươi bơ', basePrice: 30000, category: 'Sữa tươi' },
    { tenantId, name: 'Mật ong sữa dừa', basePrice: 30000, category: 'Sữa tươi' },
    { tenantId, name: 'Nước ép chanh dây', basePrice: 25000, category: 'Nước ép' },
    { tenantId, name: 'Nước ép chanh tươi', basePrice: 25000, category: 'Nước ép' },
    { tenantId, name: 'Nước ép dưa hấu', basePrice: 30000, category: 'Nước ép' },
    { tenantId, name: 'Nước ép cam', basePrice: 30000, category: 'Nước ép' },
    { tenantId, name: 'Nước ép dứa', basePrice: 30000, category: 'Nước ép' },
    { tenantId, name: 'Nước ép dừa tươi', basePrice: 30000, category: 'Nước ép' },
    { tenantId, name: 'Nước ép cam cà rốt', basePrice: 30000, category: 'Nước ép' },
    { tenantId, name: 'Trà gừng gió mật ong', basePrice: 20000, category: 'Trà' },
    { tenantId, name: 'Trà hoa cúc đặc biệt', basePrice: 25000, category: 'Trà' },
    { tenantId, name: 'Trà dâu tây', basePrice: 25000, category: 'Trà' },
    { tenantId, name: 'Trà đào', basePrice: 25000, category: 'Trà' },
    { tenantId, name: 'Trà cam táo quế lạnh', basePrice: 25000, category: 'Trà' },
    { tenantId, name: 'Trà đào cam sả', basePrice: 35000, category: 'Trà' },
    { tenantId, name: 'Trà Oolong vải hạt chia', basePrice: 35000, category: 'Trà' },
    { tenantId, name: 'Trà Oolong sen vàng macchiato', basePrice: 35000, category: 'Trà' },
    { tenantId, name: 'Trà Oolong mãng cầu', basePrice: 35000, category: 'Trà' },
    { tenantId, name: 'Trà xoài hoàng kim', basePrice: 30000, category: 'Trà' },
    { tenantId, name: 'Trà chanh tắc', basePrice: 20000, category: 'Trà' },
    { tenantId, name: 'Sinh tố bơ', basePrice: 30000, category: 'Sinh tố' },
    { tenantId, name: 'Sinh tố chanh tuyết bạc hà', basePrice: 30000, category: 'Sinh tố' },
    { tenantId, name: 'Sinh tố xoài', basePrice: 30000, category: 'Sinh tố' },
    { tenantId, name: 'Sinh tố mãng cầu', basePrice: 30000, category: 'Sinh tố' },
    { tenantId, name: 'Bơ kem phô mai', basePrice: 35000, category: 'Sinh tố' },
    { tenantId, name: 'Trà sữa Đài Loan 5.0', basePrice: 35000, category: 'Trà sữa' },
    { tenantId, name: 'Trà sữa Oolong gạo rang', basePrice: 35000, category: 'Trà sữa' },
    { tenantId, name: 'Trà sữa cốm', basePrice: 35000, category: 'Trà sữa' },
    { tenantId, name: 'Trân chân', basePrice: 5000, category: 'Topping' },
    { tenantId, name: 'Matcha đá xay', basePrice: 35000, category: 'Đá xay' },
    { tenantId, name: 'Socola đá xay', basePrice: 35000, category: 'Đá xay' },
    { tenantId, name: 'Milo dầm trân châu', basePrice: 35000, category: 'Đá xay' },
    { tenantId, name: 'Americano', basePrice: 25000, category: 'Cà phê' },
    { tenantId, name: 'Matcha Latte', basePrice: 35000, category: 'Matcha' },
    { tenantId, name: 'Bỏng Ngô', basePrice: 20000, category: 'Ăn vặt' },
    { tenantId, name: 'Hướng Dương', basePrice: 10000, category: 'Ăn vặt' }
  ];
  await Product.insertMany(products.map(p => ({
    ...p,
    sizes: [
      { name: 'M', price: 0 },
      { name: 'L', price: 5000 }
    ],
    sugarLevels: ['100%', '70%', '50%', 'Không đường'],
    iceLevels: ['100%', '70%', '50%', 'Không đá']
  })));
  console.log(`[Migration] Seeded ${products.length} products.`);
}

async function migrateProducts(tenantId: string) {
  // Update products without category
  const result = await Product.updateMany(
    { tenantId, category: { $exists: false } },
    { $set: { category: 'Chưa phân loại' } }
  );
  if (result.modifiedCount > 0) {
    console.log(`[Migration] Updated ${result.modifiedCount} products with default category.`);
  }

  // Ensure base fields are present
  await Product.updateMany(
    { tenantId, sizes: { $size: 0 } },
    { $set: { sizes: [{ name: 'M', price: 0 }] } }
  );
}

async function ensureSettings(tenantId: string) {
  const existing = await Settings.findOne({ tenantId });
  if (!existing) {
    const defaultSettings = new Settings({
      tenantId,
      shopName: 'SAIGON AN COFFEE',
      address: '32 Đoàn Kết, KĐT Ghẽ, Mao Điền, Hải Phòng',
      phone: '098 666 1932',
      currency: 'VND',
      bankInfo: {
        bankName: 'VietinBank',
        accountNumber: '11415686',
        accountName: 'HO KINH DOANH SAI GON AN COFFEE'
      }
    });
    await defaultSettings.save();
    console.log('[Migration] Initialized default shop settings (SAIGON AN COFFEE).');
  }
}
