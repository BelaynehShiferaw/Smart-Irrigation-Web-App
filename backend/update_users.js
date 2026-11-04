const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load env vars
dotenv.config({ path: './.env' });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_irrigation';

async function updateUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    const result = await User.updateMany(
      { $or: [{ bankCode: { $exists: false } }, { bankCode: '' }] },
      { 
        $set: { 
          bankCode: '80a510ea-7497-4499-8b49-ac13a3ab7d07', // Telebirr dummy bank code
          accountNumber: '0911234567' // Dummy account number
        } 
      }
    );

    console.log(`Updated ${result.modifiedCount} users with dummy bank details.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateUsers();
