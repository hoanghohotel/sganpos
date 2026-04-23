import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product.ts';
import Table from './src/models/Table.ts';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Please define the MONGODB_URI environment variable inside .env');
  process.exit(1);
}

const TENANT_ID = 'demo';

const products = [
  {
    tenantId: TENANT_ID,
    name: 'Cà Phê Sữa Đá',
    basePrice: 29000,
    category: 'Coffee',
    sizes: [
      { name: 'S', price: 0 },
      { name: 'M', price: 5000 },
      { name: 'L', price: 10000 }
    ],
    sugarLevels: ['0%', '30%', '50%', '70%', '100%'],
    iceLevels: ['0%', '50%', '100%'],
    toppings: [
      { name: 'Trân châu trắng', price: 5000 },
      { name: 'Thạch cafe', price: 5000 }
    ],
    isAvailable: true
  },
  {
    tenantId: TENANT_ID,
    name: 'Bạc Xỉu',
    basePrice: 35000,
    category: 'Coffee',
    sizes: [
      { name: 'S', price: 0 },
      { name: 'M', price: 5000 }
    ],
    sugarLevels: ['50%', '100%'],
    iceLevels: ['50%', '100%'],
    toppings: [],
    isAvailable: true
  },
  {
    tenantId: TENANT_ID,
    name: 'Trà Sữa Truyền Thống',
    basePrice: 39000,
    category: 'Milk Tea',
    sizes: [
      { name: 'M', price: 0 },
      { name: 'L', price: 8000 }
    ],
    sugarLevels: ['0%', '50%', '100%'],
    iceLevels: ['0%', '50%', '100%'],
    toppings: [
      { name: 'Trân châu đen', price: 5000 },
      { name: 'Pudding trứng', price: 8000 }
    ],
    isAvailable: true
  },
  {
    tenantId: TENANT_ID,
    name: 'Trà Sữa Matcha',
    basePrice: 45000,
    category: 'Milk Tea',
    sizes: [
      { name: 'M', price: 0 },
      { name: 'L', price: 8000 }
    ],
    sugarLevels: ['50%', '100%'],
    iceLevels: ['50%', '100%'],
    toppings: [
      { name: 'Thạch matcha', price: 5000 }
    ],
    isAvailable: true
  },
  {
    tenantId: TENANT_ID,
    name: 'Cà Phê Đen',
    basePrice: 25000,
    category: 'Coffee',
    sizes: [
      { name: 'S', price: 0 },
      { name: 'M', price: 5000 }
    ],
    sugarLevels: ['Không đường', 'Có đường'],
    iceLevels: ['Đá', 'Nóng'],
    toppings: [],
    isAvailable: true
  }
];

const tables = [
  { tenantId: TENANT_ID, name: 'Bàn 01', status: 'EMPTY' },
  { tenantId: TENANT_ID, name: 'Bàn 02', status: 'EMPTY' },
  { tenantId: TENANT_ID, name: 'Bàn 03', status: 'EMPTY' },
  { tenantId: TENANT_ID, name: 'Bàn 04', status: 'EMPTY' },
  { tenantId: TENANT_ID, name: 'Bàn 05', status: 'EMPTY' }
];

async function seed() {
  try {
    console.log('🌱 Starting seed process...');
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Clean current data for the demo tenant
    console.log(`🧹 Cleaning existing data for tenant: ${TENANT_ID}`);
    await Product.deleteMany({ tenantId: TENANT_ID });
    await Table.deleteMany({ tenantId: TENANT_ID });

    // Insert new data
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
