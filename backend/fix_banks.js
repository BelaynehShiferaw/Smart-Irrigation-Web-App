const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config({ path: './.env' });
const MONGO_URI = process.env.MONGODB_URI;

async function fixBanks() {
  await mongoose.connect(MONGO_URI);
  const result = await User.updateMany({}, { $set: { bankCode: '855' } });
  console.log('Fixed', result.modifiedCount, 'users to use 855 (Telebirr)');
  process.exit();
}

fixBanks();
