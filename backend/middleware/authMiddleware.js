const jwt = require('jsonwebtoken');
const User = require('../models/User');

const sendAuthError = (response, statusCode, message) => {
  return response.status(statusCode).json({
    status: 'fail',
    message,
    data: null
  });
};

const extractToken = (request) => {
  const headerToken = request.headers.authorization;

  if (headerToken && headerToken.startsWith('Bearer ')) {
    return headerToken.split(' ')[1];
  }

  return null;
};

const authenticate = async (request, response, next) => {
  try {
    const token = extractToken(request);

    if (!token) {
      return sendAuthError(response, 401, 'You are not logged in');
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return sendAuthError(response, 500, 'JWT secret is not configured');
    }

    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id);

    if (!user) {
      return sendAuthError(response, 401, 'The user belonging to this token no longer exists');
    }

    request.user = user;
    next();
  } catch (error) {
    return sendAuthError(response, 401, 'Invalid or expired token');
  }
};

const authorize = (...allowedRoles) => {
  return (request, response, next) => {
    if (!request.user) {
      return sendAuthError(response, 401, 'You are not logged in');
    }

    if (!allowedRoles.includes(request.user.role)) {
      return sendAuthError(response, 403, 'You do not have permission to perform this action');
    }

    return next();
  };
};

const authorizeSelfOr = (...allowedRoles) => {
  return (request, response, next) => {
    if (!request.user) {
      return sendAuthError(response, 401, 'You are not logged in');
    }

    const requestedUserId = request.params.id;
    const isOwner = requestedUserId && request.user._id.toString() === requestedUserId.toString();

    if (isOwner || allowedRoles.includes(request.user.role)) {
      return next();
    }

    return sendAuthError(response, 403, 'You do not have permission to perform this action');
  };
};

module.exports = {
  authenticate,
  authorize,
  authorizeSelfOr
};