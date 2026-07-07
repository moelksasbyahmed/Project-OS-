const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

const createErrorResponse = (response, statusCode, message) => {
  return response.status(statusCode).json({
    status: 'fail',
    message,
    data: null
  });
};

const createSuccessResponse = (response, statusCode, message, data) => {
  return response.status(statusCode).json({
    status: 'success',
    message,
    data
  });
};

const loginUser = async (request, response) => {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return createErrorResponse(response, 400, 'Email and password are required');
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return createErrorResponse(response, 401, 'Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return createErrorResponse(response, 401, 'Invalid email or password');
    }

    user.lastlogin = new Date();
    await user.save();

    const token = signToken(user);
    const userData = user.toObject();
    delete userData.password;

    return createSuccessResponse(response, 200, 'Login successful', {
      user: userData,
      token
    });
  } catch (error) {
    return createErrorResponse(response, 500, 'Internal server error');
  }
};

module.exports = {
  loginUser
};