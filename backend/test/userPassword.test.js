const bcrypt = require('bcryptjs');
const User = require('../models/User');

describe('User.matchPassword', () => {
  it('matches a password stored in the legacy passwordHash field', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    const matches = await User.schema.methods.matchPassword.call(
      { passwordHash },
      'correct-password'
    );

    expect(matches).toBe(true);
  });

  it('returns false when no password hash is stored', async () => {
    const matches = await User.schema.methods.matchPassword.call({}, 'password');
    expect(matches).toBe(false);
  });
});
