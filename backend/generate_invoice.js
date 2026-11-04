const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Farm = require('./models/Farm');
const Invoice = require('./models/Invoice');

dotenv.config({ path: './.env' });
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_irrigation';

async function generateInvoice() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    // Find a farmer (you are logged in as 'belay', a Farmer)
    const farmer = await User.findOne({ role: 'farmer' });
    if (!farmer) {
      console.log('No farmer found.');
      process.exit(1);
    }

    // Find any farm
    const farm = await Farm.findOne();
    if (!farm) {
      console.log('No farm found. Creating a dummy farm...');
      // create dummy farm if none exists
    }

    // Create a pending invoice
    const newInvoice = new Invoice({
      farmId: farm ? farm._id : farmer._id, // fallback if no farm
      billedTo: farmer._id,
      amount: 1500,
      purpose: 'Monthly IoT Monitoring & Irrigation Fee',
      status: 'pending',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Due in 7 days
    });

    await newInvoice.save();
    console.log('Successfully created a test invoice for:', farmer.name);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

generateInvoice();
