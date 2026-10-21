import mongoose from 'mongoose';

if (!global._mongoose) {
  global._mongoose = { conn: null, promise: null, indexed: new Set() };
}
const cached = global._mongoose;

export default async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to your environment variables.');
  }

  if (!cached.conn) {
    if (!cached.promise) {
      cached.promise = mongoose.connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 15000,
      });
    }
    try {
      cached.conn = await cached.promise;
    } catch (e) {
      cached.promise = null;
      throw e;
    }
  }

  // With bufferCommands:false, automatic index builds can run before the
  // connection is ready. Make sure indexes (esp. unique UTR) exist.
  const names = Object.keys(mongoose.models);
  for (const name of names) {
    if (cached.indexed.has(name)) continue;
    cached.indexed.add(name);
    try {
      await mongoose.models[name].createIndexes();
    } catch (e) {
      cached.indexed.delete(name);
      console.error('Index creation failed for model ' + name + ':', e && e.message);
    }
  }

  return cached.conn;
}
