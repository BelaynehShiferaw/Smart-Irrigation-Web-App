const getChapaSecretKey = require('../utils/chapaConfig');

describe('getChapaSecretKey', () => {
  const originalSecretKey = process.env.CHAPA_SECRET_KEY;

  afterEach(() => {
    if (originalSecretKey === undefined) {
      delete process.env.CHAPA_SECRET_KEY;
    } else {
      process.env.CHAPA_SECRET_KEY = originalSecretKey;
    }
  });

  it('returns null when the key is missing', () => {
    delete process.env.CHAPA_SECRET_KEY;
    expect(getChapaSecretKey()).toBeNull();
  });

  it('returns null for the known placeholder key', () => {
    process.env.CHAPA_SECRET_KEY = 'CHASECK_TEST_DUMMY_KEY';
    expect(getChapaSecretKey()).toBeNull();
  });

  it('trims and returns a configured key', () => {
    process.env.CHAPA_SECRET_KEY = '  CHASECK_TEST_valid_key  ';
    expect(getChapaSecretKey()).toBe('CHASECK_TEST_valid_key');
  });
});
