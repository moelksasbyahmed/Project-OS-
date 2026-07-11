const express = require('express');
const { signup, signin } = require('../controllers/signup');

const router = express.Router();

/**
 * Auth routes.
 */
router.post('/signup', signup);
router.post('/signin', signin);

module.exports = router;