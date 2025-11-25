import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async () => {
   try {
      const mongoUrl = process.env.MONGODB_URL || process.env.MOGODB_URL;
      const connectionInstance = await mongoose.connect(`${mongoUrl}/${DB_NAME}`);
      console.log('MONGO_DB CONNECTED !!!');
      return true
   } catch (error) {
      console.log('MONGO_DB CONNECTION FAILED', error);
      return false
   }
};

export { connectDB };
