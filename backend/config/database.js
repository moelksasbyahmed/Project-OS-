const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    const { MONGO_URI } = process.env;

    if (!MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    mongoose.connection.on('connected', () => {
      console.log(`MongoDB connected: ${mongoose.connection.host}`);
    });

    mongoose.connection.on('error', (error) => {
      console.error(`MongoDB connection error: ${error.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    await mongoose.connect(MONGO_URI,{
        DB_NAME: process.env.DB_NAME,
    });
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDatabase;
