const mongoose = require('mongoose');
const { User } = require('../models/User');

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

const getAllUsers = async (request, response) => {
  try {
    const users = await User.find({}).lean();

    return createSuccessResponse(
      response,
      200,
      'Users retrieved successfully',
      { users },
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

    const { name, email, role } = request.body;
    const updatePayload = {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email: email.toLowerCase().trim() }),
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

    if (!updatedUser) {
      return createErrorResponse(response, 404, 'User not found');
    }

    return createSuccessResponse(response, 200, 'User updated successfully', updatedUser);
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

const getCurrentUser = async (request, response) => {
  try {
    const user = await User.findById(request.user._id).select('-password').lean();

    if (!user) {
      return createErrorResponse(response, 404, 'User not found');
    }

    return createSuccessResponse(response, 200, 'Current user retrieved successfully', user);
  } catch (error) {
    return createErrorResponse(response, 500, 'Internal server error');
  }
};

const updateProfile = async (request, response) => {
  try {
    const { phone, linkedin, github, name } = request.body;
    const profile = {
      ...(phone !== undefined && { phone }),
      ...(linkedin !== undefined && { linkedin }),
      ...(github !== undefined && { github })
    };

    const updatePayload = {
      ...(name !== undefined && { name }),
      ...(Object.keys(profile).length > 0 && { profile })
    };

    if (Object.keys(updatePayload).length === 0) {
      return createErrorResponse(response, 400, 'No valid fields provided for update');
    }

    const updatedUser = await User.findByIdAndUpdate(
      request.user._id,
      updatePayload,
      {
        new: true,
        runValidators: true
      }
    ).select('-password').lean();

    return createSuccessResponse(response, 200, 'Profile updated successfully', updatedUser);
  } catch (error) {
    return createErrorResponse(response, 500, 'Internal server error');
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getCurrentUser,
  updateProfile
};