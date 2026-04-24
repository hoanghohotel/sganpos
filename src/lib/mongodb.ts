import mongoose from 'mongoose';

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
  }

  // Nếu đã có kết nối thì dùng lại
  if (cached.conn) {
    return cached.conn;
  }

  // Nếu chưa có promise thì tạo mới
  if (!cached.promise) {
    const opts = {
      bufferCommands: true,
      serverSelectionTimeoutMS: 10000,
    };

    console.log('[MongoDB] 🔗 Initiating connection...');
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('✅ MongoDB Ready (Connected)');
        return mongoose;
      })
      .catch((err) => {
        console.error('❌ MongoDB Connection Failure:', err.message);
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    console.log('[MongoDB] State:', mongoose.connection.readyState);
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;