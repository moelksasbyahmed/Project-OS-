const express = require('express');
const {
	getAllProjects,
	createProject,
	getProjectById,
	updateProject,
	deleteProject,
	addTeamMember,
	removeTeamMember,
	updateProjectStatus,
	getProjectStats
} = require('../controllers');
const { protect, authorize } = require('../middleware');

const router = express.Router();

/**
 * Project routes.
 */
router.use(protect, authorize('project_manager'));

router.get('/stats', getProjectStats);
router.get('/', getAllProjects);
router.post('/', createProject);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.patch('/:id/status', updateProjectStatus);
router.post('/:id/team-members', addTeamMember);
router.delete('/:id/team-members/:engineerId', removeTeamMember);

module.exports = router;