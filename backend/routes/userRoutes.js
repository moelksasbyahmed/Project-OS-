const express = require('express');
const { loginUser } = require('../controllers/authController');
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { authenticate, authorize, authorizeSelfOr } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', createUser);
router.post('/login', loginUser);

router.get('/', authenticate, authorize('project_manager'), getAllUsers);
router.get('/:id', authenticate, authorizeSelfOr('project_manager'), getUserById);
router.put('/:id', authenticate, authorizeSelfOr('project_manager'), updateUser);
router.delete('/:id', authenticate, authorize('project_manager'), deleteUser);

module.exports = router;
