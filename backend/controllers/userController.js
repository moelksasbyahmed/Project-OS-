const mongoose = require('mongoose');
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

const createSuccessResponse = (response, statusCode, message, data, results) => {
  const payload = {
    status: 'success',
    message,
    data
  };

  if (typeof results === 'number') {
    payload.results = results;
  }

  return response.status(statusCode).json(payload);
};

const createUser = async (request, response) => {
  try {
    const { name, email, password, role } = request.body;

    if (!name || !email || !password) {
      return createErrorResponse(response, 400, 'Name, email, and password are required');
    }

    const existingUser = await User.findOne({ email }).lean();

    if (existingUser) {
      return createErrorResponse(response, 400, 'Email already exists');
    }

    if (role === 'project_manager') {
      const managerCount = await User.countDocuments({ role: 'project_manager' });

      if (managerCount > 0) {
        return createErrorResponse(response, 403, 'Only an existing project manager can create manager accounts');
      }
    }

    const user = await User.create({ name, email, password, role });
    const token = signToken(user);
    const userData = user.toObject();
    delete userData.password;

    return createSuccessResponse(
      response,
      201,
      'User created successfully',
      {
        user: userData,
        token
      }
    );
  } catch (error) {

    return createErrorResponse(response, 500, 'Internal server error');
  }
};

const getAllUsers = async (request, response) => {
  try {
    const users = await User.find({}).lean();

    return createSuccessResponse(
      response,
      200,
      'Users retrieved successfully',
      {
        users
      },
      users.length
    );
  } catch (error) {
    return createErrorResponse(response, 500, 'Internal server error');
  }
};

const getUserById = async (request, response) => {
  try {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse(response, 400, 'Invalid user ID');
    }

    const user = await User.findById(id).lean();

    if (!user) {
      return createErrorResponse(response, 404, 'User not found');
    }

    return createSuccessResponse(response, 200, 'User retrieved successfully', user);
  } catch (error) {
    return createErrorResponse(response, 500, 'Internal server error');
  }
};

const updateUser = async (request, response) => {
  try {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse(response, 400, 'Invalid user ID');
    }

    const { name, email, password, role } = request.body;

    if (role !== undefined && request.user?.role !== 'project_manager') {
      return createErrorResponse(response, 403, 'Only a project manager can change roles');
    }

    const updatePayload = {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(password !== undefined && { password: bcrypt.hashSync(password, 10) }),
      ...(role !== undefined && { role })
    };

    if (Object.keys(updatePayload).length === 0) {
      return createErrorResponse(response, 400, 'No valid fields provided for update');
    }

    if (updatePayload.email) {
      const existingUser = await User.findOne({
        email: updatePayload.email,
        _id: { $ne: id }
      }).lean();

      if (existingUser) {
        return createErrorResponse(response, 400, 'Email already exists');
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        ...updatePayload,
        updatedAt: new Date()
      },
      {
        new: true,
        runValidators: true
      }
    ).lean();

    if (updatedUser) {
      delete updatedUser.password;
    }

    if (!updatedUser) {
      return createErrorResponse(response, 404, 'User not found');
    }

    return createSuccessResponse(
      response,
      200,
      'User updated successfully',
      updatedUser
    );
  } catch (error) {
    if (error.code === 11000) {
      return createErrorResponse(response, 400, 'Email already exists');
    }

    if (error.name === 'ValidationError') {
      return createErrorResponse(response, 400, error.message);
    }

    return createErrorResponse(response, 500, 'Internal server error');
  }
};

const deleteUser = async (request, response) => {
  try {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse(response, 400, 'Invalid user ID');
    }

    const deletedUser = await User.findByIdAndDelete(id).lean();

    if (!deletedUser) {
      return createErrorResponse(response, 404, 'User not found');
    }

    return createSuccessResponse(response, 200, 'User deleted successfully', null);
  } catch (error) {
    return createErrorResponse(response, 500, 'Internal server error');
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};
