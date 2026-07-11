const { protect } = require('./auth-middleware');
const { authorize } = require('./authorization-middleware');
const errorHandler = require('../utils/Error_handler');

const notFound = (req, res) => {
	return res.status(404).json({
		status: 'fail',
		message: `Route ${req.originalUrl} not found`,
		data: null
	});
};

module.exports = {
	protect,
	authorize,
	errorHandler,
	notFound
};