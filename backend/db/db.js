import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let dbConnectionState = {
  isConnected: false,
  mode: 'STANDALONE_STORE', // 'MONGODB' or 'STANDALONE_STORE'
  uri: null,
  error: null
};

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_sentinel';
  dbConnectionState.uri = mongoUri.replace(/\/\/.*@/, '//***:***@'); // mask credentials if any

  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2500, // Quick timeout to fallback seamlessly
    });

    dbConnectionState.isConnected = true;
    dbConnectionState.mode = 'MONGODB';
    dbConnectionState.error = null;

    console.log(`====================================================`);
    console.log(`🗄️  MONGODB DATABASE CONNECTED`);
    console.log(`📍  Host: ${conn.connection.host}`);
    console.log(`📦  Database: ${conn.connection.name}`);
    console.log(`====================================================`);

    return conn;
  } catch (error) {
    dbConnectionState.isConnected = false;
    dbConnectionState.mode = 'STANDALONE_STORE';
    dbConnectionState.error = error.message;

    console.log(`====================================================`);
    console.log(`⚠️  MongoDB not available (${error.message}).`);
    console.log(`⚡  Operating in RESILIENT HIGH-SPEED LOCAL DB mode.`);
    console.log(`💡  Tip: To connect MongoDB Atlas, set MONGODB_URI in backend/.env`);
    console.log(`====================================================`);
    return null;
  }
};

export const getDbStatus = () => {
  return {
    ...dbConnectionState,
    mongooseState: mongoose.connection.readyState, // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    statusLabel: dbConnectionState.mode === 'MONGODB' && dbConnectionState.isConnected 
      ? 'MongoDB Connected' 
      : 'Local High-Speed DB (Ready for MongoDB Atlas)'
  };
};
