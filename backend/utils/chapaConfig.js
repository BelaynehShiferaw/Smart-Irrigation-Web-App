const PLACEHOLDER_SECRET_KEY = 'CHASECK_TEST_DUMMY_KEY';

function getChapaSecretKey() {
  const secretKey = process.env.CHAPA_SECRET_KEY?.trim();
  if (!secretKey || secretKey === PLACEHOLDER_SECRET_KEY) return null;
  return secretKey;
}

module.exports = getChapaSecretKey;
