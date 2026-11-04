const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;

console.log('Using Key:', CHAPA_SECRET_KEY ? (CHAPA_SECRET_KEY.substring(0, 15) + '...') : 'NONE');

if (!CHAPA_SECRET_KEY || CHAPA_SECRET_KEY === 'CHASECK_TEST_DUMMY_KEY') {
  console.log('No real key provided. Aborting test.');
  process.exit(0);
}

async function testChapa() {
  const tx_ref = `tx-test-${Date.now()}`;
  const chapaPayload = {
    amount: "1500",
    currency: "ETB",
    email: "belay@gmail.com",
    first_name: "Test",
    last_name: "User",
    tx_ref: tx_ref,
    callback_url: `http://localhost:5173/billing?verify=${tx_ref}`,
    return_url: `http://localhost:5173/billing?verify=${tx_ref}`,
    customization: {
      title: "SmartIrrigate",
      description: "Test Payment"
    }
  };

  try {
    console.log('Sending request to Chapa...');
    const response = await axios.post('https://api.chapa.co/v1/transaction/initialize', chapaPayload, {
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('SUCCESS! Chapa responded with:');
    console.log(response.data);
  } catch (err) {
    console.log('\n--- CHAPA ERROR ---');
    console.log('Status Code:', err.response?.status);
    console.log('Error Message:', err.response?.data?.message || err.message);
    console.log('Full Response Data:', JSON.stringify(err.response?.data, null, 2));
    console.log('-------------------\n');
  }
}

testChapa();
