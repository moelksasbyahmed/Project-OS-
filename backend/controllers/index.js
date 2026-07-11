const userController = require('./userController');
const projectController = require('./projectsController');
const taskController = require('./TaskController');
const engineerController = require('./engineerController');
const signupController = require('./signup');

module.exports = {
	...userController,
	...projectController,
	...taskController,
	...engineerController,
	...signupController,
	userController,
	projectController,
	taskController,
	engineerController,
	signupController
};