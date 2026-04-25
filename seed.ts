import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dbConnect from './src/lib/mongodb.js';
import { runMigration } from './src/lib/migration.js';

dotenv.config();

async function seed() {
  try {
    console.log('🌱 Starting seed process...');
    await dbConnect();
    console.log('✅ Connected to MongoDB');

    await runMigration();

    console.log('✨ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
