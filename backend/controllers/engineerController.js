const mongoose = require('mongoose');
const { User, Engineer, Project, Task } = require('../models');
const { createError } = require('../utils/errors');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const populateEngineerAssignments = (query) => query
	.populate({ path: 'currentProject', select: 'name status projectManager teamMembers' })
	.populate({ path: 'currentTask', select: 'title status project engineersAssigned' })
	.populate({ path: 'projects', select: 'name status projectManager' })
	.populate({ path: 'Tasks', select: 'title status project engineersAssigned' });

const findEngineerByEmail = async (req, res, next) => {
	try {
		const { email } = req.params;
		const engineer = await User.findOne({ email: email.toLowerCase().trim(), role: 'engineer' }).select('-password');

		if (!engineer) {
			return next(createError('Engineer not found', 404));
		}

		return res.status(200).json({
			status: 'success',
			data: engineer
		});
	} catch (error) {
		return next(error);
    }
};

const findEngineersByRole = async (req, res, next) => {
	try {
		const { role } = req.params;
		const engineers = await User.find({ role }).select('-password');

		return res.status(200).json({
			status: 'success',
			results: engineers.length,
			data: engineers
		});
	} catch (error) {
		return next(error);
    }
};

const getEngineerCurrentAssignments = async (req, res, next) => {
	try {
		const { engineerId } = req.params;

		if (!isValidObjectId(engineerId)) {
			return next(createError('Invalid engineer ID', 400));
		}

		const [user, assignments] = await Promise.all([
			User.findById(engineerId).select('-password'),
			populateEngineerAssignments(Engineer.findById(engineerId))
		]);

		if (!user || !assignments) {
			return next(createError('Engineer not found', 404));
		}

		return res.status(200).json({
			status: 'success',
			data: {
				user,
				assignments
			}
		});
	} catch (error) {
		return next(error);
    }
};

const assignCurrentProject = async (req, res, next) => {
	try {
		const { engineerId } = req.params;
		const { projectId } = req.body;

		if (!isValidObjectId(engineerId) || !isValidObjectId(projectId)) {
			return next(createError('Invalid engineer or project ID', 400));
		}

		const [engineer, project] = await Promise.all([
			Engineer.findById(engineerId),
			Project.findById(projectId)
		]);

		if (!engineer) {
			return next(createError('Engineer not found', 404));
		}

		if (!project) {
			return next(createError('Project not found', 404));
		}

		if (!project.teamMembers.some((memberId) => memberId.toString() === engineerId.toString())) {
			return next(createError('Engineer is not assigned to this project', 400));
		}

		engineer.currentProject = projectId;
		await engineer.save();

		const updatedEngineer = await populateEngineerAssignments(Engineer.findById(engineerId));

		return res.status(200).json({
			status: 'success',
			message: 'Current project assigned successfully',
			data: updatedEngineer
		});
	} catch (error) {
		return next(error);
    }
};

const batchAssignCurrentProject = async (req, res, next) => {
	try {
		const { engineerIds = [], projectId } = req.body;

		if (!isValidObjectId(projectId) || !Array.isArray(engineerIds) || engineerIds.length === 0) {
			return next(createError('engineerIds and projectId are required', 400));
		}

		const project = await Project.findById(projectId);
		if (!project) {
			return next(createError('Project not found', 404));
		}

		const results = [];
		for (const engineerId of engineerIds) {
			if (!isValidObjectId(engineerId)) {
				continue;
			}

			const engineer = await Engineer.findById(engineerId);
			if (!engineer) {
				continue;
			}

			engineer.currentProject = projectId;
			await engineer.save();
			results.push(engineerId);
		}

		return res.status(200).json({
			status: 'success',
			message: 'Current project assigned for selected engineers',
			results: results.length
		});
	} catch (error) {
		return next(error);
    }
};

const unsetCurrentProject = async (req, res, next) => {
	try {
		const { engineerId } = req.params;

		if (!isValidObjectId(engineerId)) {
			return next(createError('Invalid engineer ID', 400));
		}

		const engineer = await Engineer.findById(engineerId);
		if (!engineer) {
			return next(createError('Engineer not found', 404));
		}

		engineer.currentProject = null;
		await engineer.save();

		return res.status(200).json({
			status: 'success',
			message: 'Current project removed successfully'
		});
	} catch (error) {
		return next(error);
    }
};

const assignCurrentTask = async (req, res, next) => {
	try {
		const { engineerId } = req.params;
		const { taskId } = req.body;

		if (!isValidObjectId(engineerId) || !isValidObjectId(taskId)) {
			return next(createError('Invalid engineer or task ID', 400));
		}

		const [engineer, task] = await Promise.all([
			Engineer.findById(engineerId),
			Task.findById(taskId).populate('project', 'teamMembers')
		]);

		if (!engineer) {
			return next(createError('Engineer not found', 404));
		}

		if (!task) {
			return next(createError('Task not found', 404));
		}

		if (!task.project.teamMembers.some((memberId) => memberId.toString() === engineerId.toString())) {
			return next(createError('Engineer is not assigned to this project', 400));
		}

		engineer.currentTask = taskId;
		await engineer.save();

		return res.status(200).json({
			status: 'success',
			message: 'Current task assigned successfully'
		});
	} catch (error) {
		return next(error);
    }
};

const unsetCurrentTask = async (req, res, next) => {
	try {
		const { engineerId } = req.params;

		if (!isValidObjectId(engineerId)) {
			return next(createError('Invalid engineer ID', 400));
		}

		const engineer = await Engineer.findById(engineerId);
		if (!engineer) {
			return next(createError('Engineer not found', 404));
		}

		engineer.currentTask = null;
		await engineer.save();

		return res.status(200).json({
			status: 'success',
			message: 'Current task removed successfully'
		});
	} catch (error) {
		return next(error);
    }
};

const assignTaskAndMakeCurrent = async (req, res, next) => {
	try {
		const { engineerId } = req.params;
		const { taskId } = req.body;

		if (!isValidObjectId(engineerId) || !isValidObjectId(taskId)) {
			return next(createError('Invalid engineer or task ID', 400));
		}

		const [engineer, task] = await Promise.all([
			Engineer.findById(engineerId),
			Task.findById(taskId).populate('project', 'teamMembers')
		]);

		if (!engineer) {
			return next(createError('Engineer not found', 404));
		}

		if (!task) {
			return next(createError('Task not found', 404));
		}

		if (!task.project.teamMembers.some((memberId) => memberId.toString() === engineerId.toString())) {
			return next(createError('Engineer is not assigned to this project', 400));
		}

		await Task.findByIdAndUpdate(taskId, { $addToSet: { engineersAssigned: engineerId } });
		await Engineer.findByIdAndUpdate(engineerId, {
			$addToSet: { Tasks: taskId, projects: task.project._id },
			currentTask: taskId,
			currentProject: task.project._id
		});

		const updatedEngineer = await populateEngineerAssignments(Engineer.findById(engineerId));

		return res.status(200).json({
			status: 'success',
			message: 'Task assigned and marked as current successfully',
			data: updatedEngineer
		});
	} catch (error) {
		return next(error);
    }
};

module.exports = {
	assignCurrentProject,
	assignCurrentTask,
	unsetCurrentProject,
	unsetCurrentTask,
	findEngineerByEmail,
	findEngineersByRole,
	getEngineerCurrentAssignments,
	batchAssignCurrentProject,
	assignTaskAndMakeCurrent
};