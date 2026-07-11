const express = require('express');
const {
	createTask,
	deleteTask,
	addEngineerToTask,
	removeEngineerFromTask,
	updateTaskStatus,
	getTaskDetails,
	getAllTasks,
	bulkUpdateTaskStatus
} = require('../controllers');
const { protect, authorize } = require('../middleware');

const router = express.Router();

/**
 * Task routes.
 */
router.use(protect);

router.patch('/bulk-status', authorize('project_manager'), bulkUpdateTaskStatus);
router.get('/project/:projectId', getAllTasks);
router.post('/project/:projectId', authorize('project_manager'), createTask);
router.patch('/:id/status', authorize('project_manager'), updateTaskStatus);
router.post('/:id/engineers', authorize('project_manager'), addEngineerToTask);
router.delete('/:id/engineers/:engineerId', authorize('project_manager'), removeEngineerFromTask);
router.delete('/:id', authorize('project_manager'), deleteTask);
router.get('/:id', getTaskDetails);

module.exports = router;