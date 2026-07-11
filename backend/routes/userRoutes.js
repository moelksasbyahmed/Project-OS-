const express = require('express');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getCurrentUser,
  updateProfile
} = require('../controllers');
const { protect, authorize } = require('../middleware');

const router = express.Router();

/**
 * User routes.
 */
router.use(protect);

router.get('/', authorize('admin'), getAllUsers);
router.get('/me', getCurrentUser);
router.get('/:id', getUserById);
router.patch('/profile', updateProfile);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;