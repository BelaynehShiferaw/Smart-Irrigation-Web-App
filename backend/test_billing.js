const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Invoice = require('./models/Invoice');
require('./models/User'); // ensure User model is loaded

dotenv.config({ path: './.env' });
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_irrigation';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;

async function testBilling() {
  await mongoose.connect(MONGO_URI);
  
  const invoice = await Invoice.findById('6ab8c4a271bd1514a34b2075').populate('billedTo', 'name email');
  if (!invoice) { console.log('Invoice not found'); process.exit(); }
  
  const tx_ref = `tx-invoice-${invoice._id}-${Date.now()}`;
  const amount = invoice.amount;
  const email = invoice.billedTo.email || 'customer@example.com';
  const first_name = invoice.billedTo.name.split(' ')[0];
  const last_name = invoice.billedTo.name.split(' ').slice(1).join(' ') || 'Customer';

  const chapaPayload = {
    amount: amount.toString(),
    currency: 'ETB',
    email: email,
    first_name: first_name,
    last_name: last_name,
    tx_ref: tx_ref,
    callback_url: `http://localhost:5173/billing?verify=${tx_ref}`,
    return_url: `http://localhost:5173/billing?verify=${tx_ref}`,
    customization: {
      title: 'SmartIrrigate',
      description: invoice.purpose.replace(/[^a-zA-Z0-9\s\-_.]/g, '')
    }
  };

  try {
    console.log('Sending payload to Chapa:', chapaPayload);
    const response = await axios.post('https://api.chapa.co/v1/transaction/initialize', chapaPayload, {
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('SUCCESS:', response.data);
  } catch (err) {
    console.log('\n--- CHAPA ERROR ---');
    console.log(err.response?.data || err.message);
  }
  process.exit();
}

testBilling();
