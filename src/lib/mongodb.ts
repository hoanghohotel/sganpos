import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true, // Re-enable buffering to prevent "Cannot call findOne before connection" errors
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
    };

    console.log('[MongoDB] 🔗 Initiating connection...');
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log('✅ MongoDB Ready (State: Connected)');
      return mongoose;
    }).catch(err => {
      console.error('❌ MongoDB Connection Failure:', err.message);
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log('[MongoDB] Current State:', mongoose.connection.readyState);
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
