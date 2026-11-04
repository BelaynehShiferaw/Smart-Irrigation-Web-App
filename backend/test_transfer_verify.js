const axios = require('axios');
require('dotenv').config({ path: './.env' });
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;

async function testVerify() {
  try {
    const response = await axios.get(`https://api.chapa.co/v1/transfers/verify/pr-6ab8c6dc-97144270`, {
      headers: { Authorization: `Bearer ${CHAPA_SECRET_KEY}` }
    });
    console.log('SUCCESS:', response.data);
  } catch (err) {
    console.log('ERROR:', err.response?.data || err.message);
  }
}

testVerify();
