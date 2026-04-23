import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product.ts';
import Table from './src/models/Table.ts';
import Settings from './src/models/Settings.ts';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Please define the MONGODB_URI environment variable inside .env');
  process.exit(1);
}

const TENANT_ID = 'demo';

const products = [
  { tenantId: TENANT_ID, name: 'Phin sữa đá', basePrice: 25000, category: 'Cà phê', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Phin đen đá', basePrice: 25000, category: 'Cà phê', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Pha máy sữa đá', basePrice: 25000, category: 'Cà phê', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Pha máy đen đá', basePrice: 25000, category: 'Cà phê', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Bạc xỉu', basePrice: 30000, category: 'Cà phê', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Cà phê sữa tươi', basePrice: 30000, category: 'Cà phê', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Cacao sữa', basePrice: 30000, category: 'Cà phê', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Cà phê Baileys', basePrice: 35000, category: 'Cà phê', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Cacao kem mặn', basePrice: 35000, category: 'Cà phê', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Phin muối', basePrice: 30000, category: 'Cà phê', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Cà phê SaigonAn', basePrice: 35000, category: 'Cà phê', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Sữa chua đá', basePrice: 25000, category: 'Sữa chua', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Sữa chua chanh dây', basePrice: 30000, category: 'Sữa chua', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Sữa chua đào', basePrice: 30000, category: 'Sữa chua', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Sữa chua dâu tây', basePrice: 30000, category: 'Sữa chua', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Sữa chua trái cây nhiệt đới', basePrice: 35000, category: 'Sữa chua', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Sữa chua Việt quất', basePrice: 30000, category: 'Sữa chua', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Sữa tươi matcha phô mai', basePrice: 35000, category: 'Sữa tươi', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Sữa tươi trân châu đường đen', basePrice: 35000, category: 'Sữa tươi', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Sữa tươi bơ', basePrice: 30000, category: 'Sữa tươi', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Mật ong sữa dừa', basePrice: 30000, category: 'Sữa tươi', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Nước ép chanh dây', basePrice: 25000, category: 'Nước ép', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Nước ép chanh tươi', basePrice: 25000, category: 'Nước ép', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Nước ép dưa hấu', basePrice: 30000, category: 'Nước ép', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Nước ép cam', basePrice: 30000, category: 'Nước ép', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Nước ép dứa', basePrice: 30000, category: 'Nước ép', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Nước ép dừa tươi', basePrice: 30000, category: 'Nước ép', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Nước ép cam cà rốt', basePrice: 30000, category: 'Nước ép', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Trà gừng gió mật ong', basePrice: 20000, category: 'Trà', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Trà hoa cúc đặc biệt', basePrice: 25000, category: 'Trà', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Trà dâu tây', basePrice: 25000, category: 'Trà', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Trà đào', basePrice: 25000, category: 'Trà', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Trà cam táo quế lạnh', basePrice: 25000, category: 'Trà', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Trà đào cam sả', basePrice: 35000, category: 'Trà', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Trà Oolong vải hạt chia', basePrice: 35000, category: 'Trà', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Trà Oolong sen vàng macchiato', basePrice: 35000, category: 'Trà', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Trà Oolong mãng cầu', basePrice: 35000, category: 'Trà', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Trà xoài hoàng kim', basePrice: 30000, category: 'Trà', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Trà chanh tắc', basePrice: 20000, category: 'Trà', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Sinh tố bơ', basePrice: 30000, category: 'Sinh tố', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Sinh tố chanh tuyết bạc hà', basePrice: 30000, category: 'Sinh tố', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Sinh tố xoài', basePrice: 30000, category: 'Sinh tố', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Sinh tố mãng cầu', basePrice: 30000, category: 'Sinh tố', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Bơ kem phô mai', basePrice: 35000, category: 'Sinh tố', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Trà sữa Đài Loan 5.0', basePrice: 35000, category: 'Trà sữa', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Trà sữa Oolong gạo rang', basePrice: 35000, category: 'Trà sữa', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Trà sữa cốm', basePrice: 35000, category: 'Trà sữa', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Trân chân', basePrice: 5000, category: 'Trà sữa', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Matcha đá xay', basePrice: 35000, category: 'Đá xay', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Socola đá xay', basePrice: 35000, category: 'Đá xay', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Milo dầm trân châu', basePrice: 35000, category: 'Đá xay', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Americano', basePrice: 25000, category: 'Cà phê', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Matcha Latte', basePrice: 35000, category: 'Matcha', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Bỏng Ngô', basePrice: 20000, category: 'Ăn vặt', isAvailable: true },
  { tenantId: TENANT_ID, name: 'Hướng Dương', basePrice: 10000, category: 'Ăn vặt', isAvailable: true }
];

const tables: any[] = [];

// 20 Bàn tại chỗ
for (let i = 1; i <= 20; i++) {
  tables.push({ tenantId: TENANT_ID, name: `Bàn ${i < 10 ? '0' + i : i}`, status: 'EMPTY' });
}

// 10 Bàn mang về
for (let i = 1; i <= 10; i++) {
  tables.push({ tenantId: TENANT_ID, name: `Mang về ${i < 10 ? '0' + i : i}`, status: 'EMPTY' });
}

// 10 Bàn ship đi
for (let i = 1; i <= 10; i++) {
  tables.push({ tenantId: TENANT_ID, name: `Ship đi ${i < 10 ? '0' + i : i}`, status: 'EMPTY' });
}

async function seed() {
  try {
    console.log('🌱 Starting seed process...');
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Clean current data for the demo tenant
    console.log(`🧹 Cleaning existing data for tenant: ${TENANT_ID}`);
    await Product.deleteMany({ tenantId: TENANT_ID });
    await Table.deleteMany({ tenantId: TENANT_ID });
    await Settings.deleteMany({ tenantId: TENANT_ID });

    // Insert new data
    console.log('📦 Inserting settings...');
    await Settings.create({
      tenantId: TENANT_ID,
      storeName: 'SAIGON AN COFFEE',
      hotline: '098 666 1932',
      address: '32 Đoàn Kết, KĐT Ghẽ, Mao Điền, Hải Phòng.',
      bankAccount: '11415686',
      bankName: 'VietinBank',
      bankCode: 'ICB',
      bankLogoUrl: 'https://api.vietqr.io/img/ICB.png',
      bankAccountHolder: 'HO KINH DOANH SAI GON AN COFFEE',
      logoUrl: '/logo.svg'
    });

    console.log('📦 Inserting products...');
    await Product.insertMany(products);
    
    console.log('📦 Inserting tables...');
    await Table.insertMany(tables);

    console.log('✨ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
