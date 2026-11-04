const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Payroll = require('./models/Payroll');
require('./models/User'); // load User model

dotenv.config({ path: './.env' });
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_irrigation';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;

async function testTransfer() {
  await mongoose.connect(MONGO_URI);
  
  // Find a payroll record for "abay" that is "approved"
  const record = await Payroll.findOne({ paymentStatus: 'approved' }).populate('userId');
  if (!record) { console.log('No approved payroll record found for testing.'); process.exit(); }
  
  const tx_ref = `pr-${record._id.toString()}-${Date.now().toString().slice(-7)}`;
  const amount = record.netPay;
  
  const chapaPayload = {
    account_name: record.userId.accountName || record.userId.name,
    account_number: record.userId.accountNumber,
    amount: amount.toString(),
    currency: 'ETB',
    beneficiary_name: record.userId.name,
    reference: tx_ref,
    bank_code: record.userId.bankCode
  };

  try {
    console.log('Sending transfer payload to Chapa:', chapaPayload);
    const response = await axios.post('https://api.chapa.co/v1/transfers', chapaPayload, {
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

testTransfer();
