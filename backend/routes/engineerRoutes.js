const express = require('express');
const {
	assignCurrentProject,
	assignCurrentTask,
	unsetCurrentProject,
	unsetCurrentTask,
	findEngineerByEmail,
	findEngineersByRole,
	getEngineerCurrentAssignments,
	batchAssignCurrentProject,
	assignTaskAndMakeCurrent
} = require('../controllers');
const { protect, authorize } = require('../middleware');

const router = express.Router();

router.use(protect, authorize('project_manager'));

router.get('/search/email/:email', findEngineerByEmail);
router.get('/search/role/:role', findEngineersByRole);
router.post('/batch/current-project', batchAssignCurrentProject);
router.get('/:engineerId/assignments', getEngineerCurrentAssignments);
router.patch('/:engineerId/current-project', assignCurrentProject);
router.delete('/:engineerId/current-project', unsetCurrentProject);
router.patch('/:engineerId/current-task', assignCurrentTask);
router.delete('/:engineerId/current-task', unsetCurrentTask);
router.post('/:engineerId/assign-task', assignTaskAndMakeCurrent);

module.exports = router;