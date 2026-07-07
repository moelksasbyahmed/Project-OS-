const jwt = require('jsonwebtoken');

const signToken = (user) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT secret is not configured');
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role
    },
    secret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

module.exports = {
  signToken
};