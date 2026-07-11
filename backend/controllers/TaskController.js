const mongoose = require('mongoose');
const { Project, Engineer, Task } = require('../models');
const { createError } = require('../utils/errors');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const populateTask = (query) => query
	.populate({ path: 'project', select: 'name status projectManager teamMembers' })
	.populate({ path: 'engineersAssigned', select: 'name email role' });

const canAccessProjectTasks = (project, user) => {
	if (!project) {
		return false;
	}

	if (user.role === 'project_manager' && project.projectManager.toString() === user._id.toString()) {
		return true;
	}

	return user.role === 'engineer'
		&& Array.isArray(project.teamMembers)
		&& project.teamMembers.some((memberId) => memberId.toString() === user._id.toString());
};

const createTask = async (req, res, next) => {
	try {
		const { projectId } = req.params;
		const { engineersAssigned = [], ...taskData } = req.body;

		if (!isValidObjectId(projectId)) {
			return next(createError('Invalid project ID', 400));
		}

		const project = await Project.findOne({ _id: projectId, projectManager: req.user._id }).populate('teamMembers', '_id');

		if (!project) {
			return next(createError('Project not found', 404));
		}

		const teamMemberIds = project.teamMembers.map((member) => member._id.toString());
		const assignedIds = [...new Set(engineersAssigned.map((engineerId) => engineerId.toString()))];
		const invalidEngineers = assignedIds.filter((engineerId) => !teamMemberIds.includes(engineerId));

		if (invalidEngineers.length > 0) {
			return next(createError(`Engineers ${invalidEngineers.join(', ')} are not assigned to this project`, 400));
		}

		const task = await Task.create({
			...taskData,
			project: projectId,
			engineersAssigned: assignedIds
		});

		await Project.findByIdAndUpdate(projectId, { $addToSet: { tasks: task._id } });

		if (assignedIds.length > 0) {
			await Engineer.updateMany(
				{ _id: { $in: assignedIds } },
				{ $addToSet: { Tasks: task._id } }
			);
		}

		const populatedTask = await populateTask(Task.findById(task._id));

		return res.status(201).json({
			status: 'success',
			message: 'Task created successfully',
			data: populatedTask
		});
	} catch (error) {
		return next(error);
	}
};

const getAllTasks = async (req, res, next) => {
	try {
		const { projectId } = req.params;

		if (!isValidObjectId(projectId)) {
			return next(createError('Invalid project ID', 400));
		}

		const project = await Project.findById(projectId).select('projectManager teamMembers name');

		if (!canAccessProjectTasks(project, req.user)) {
			return next(createError('You are not authorized to view these tasks', 403));
		}

		const tasks = await populateTask(Task.find({ project: projectId }));

		return res.status(200).json({
			status: 'success',
			results: tasks.length,
			data: tasks
		});
	} catch (error) {
		return next(error);
	}
};

const getTaskDetails = async (req, res, next) => {
	try {
		const { id } = req.params;

		if (!isValidObjectId(id)) {
			return next(createError('Invalid task ID', 400));
		}

		const task = await populateTask(Task.findById(id));

		if (!task) {
			return next(createError('Task not found', 404));
		}

		const project = await Project.findById(task.project._id).select('projectManager teamMembers');
		const assignedToTask = Array.isArray(task.engineersAssigned)
			&& task.engineersAssigned.some((engineer) => engineer._id.toString() === req.user._id.toString());

		if (!canAccessProjectTasks(project, req.user) && !assignedToTask) {
			return next(createError('You are not authorized to view this task', 403));
		}

		return res.status(200).json({
			status: 'success',
			data: task
		});
	} catch (error) {
		return next(error);
    }
};

const updateTaskStatus = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { status } = req.body;

		if (!isValidObjectId(id)) {
			return next(createError('Invalid task ID', 400));
		}

		const task = await Task.findById(id).populate('project', 'projectManager');

		if (!task) {
			return next(createError('Task not found', 404));
		}

		if (task.project.projectManager.toString() !== req.user._id.toString()) {
			return next(createError('You are not authorized to update this task', 403));
		}

		task.status = status;
		if (status === 'completed') {
			task.markCompleted();
		}
		await task.save();

		const updatedTask = await populateTask(Task.findById(id));

		return res.status(200).json({
			status: 'success',
			message: 'Task status updated successfully',
			data: updatedTask
		});
	} catch (error) {
		return next(error);
    }
};

const bulkUpdateTaskStatus = async (req, res, next) => {
	try {
		const { taskIds = [], status } = req.body;

		if (!Array.isArray(taskIds) || taskIds.length === 0) {
			return next(createError('taskIds must be a non-empty array', 400));
		}

		const tasks = await Task.find({ _id: { $in: taskIds } }).populate('project', 'projectManager');
		const authorizedTasks = tasks.filter((task) => task.project.projectManager.toString() === req.user._id.toString());

		await Promise.all(
			authorizedTasks.map(async (task) => {
				task.status = status;
				if (status === 'completed') {
					task.markCompleted();
				}
				await task.save();
			})
		);

		return res.status(200).json({
			status: 'success',
			message: 'Task statuses updated successfully',
			results: authorizedTasks.length
		});
	} catch (error) {
		return next(error);
    }
};

const deleteTask = async (req, res, next) => {
	try {
		const { id } = req.params;

		if (!isValidObjectId(id)) {
			return next(createError('Invalid task ID', 400));
		}

		const task = await Task.findById(id).populate('project', 'projectManager teamMembers');

		if (!task) {
			return next(createError('Task not found', 404));
		}

		if (task.project.projectManager.toString() !== req.user._id.toString()) {
			return next(createError('You are not authorized to delete this task', 403));
		}

		await Promise.all([
			Project.findByIdAndUpdate(task.project._id, { $pull: { tasks: task._id } }),
			Engineer.updateMany(
				{ _id: { $in: task.engineersAssigned } },
				{ $pull: { Tasks: task._id }, $unset: { currentTask: 1 } }
			),
			Task.findByIdAndDelete(id)
		]);

		return res.status(200).json({
			status: 'success',
			message: 'Task deleted successfully'
		});
	} catch (error) {
		return next(error);
    }
};

const addEngineerToTask = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { engineerId } = req.body;

		if (!isValidObjectId(id) || !isValidObjectId(engineerId)) {
			return next(createError('Invalid task or engineer ID', 400));
		}

		const task = await Task.findById(id).populate('project', 'projectManager teamMembers');
		const engineer = await Engineer.findById(engineerId);

		if (!task) {
			return next(createError('Task not found', 404));
		}

		if (task.project.projectManager.toString() !== req.user._id.toString()) {
			return next(createError('You are not authorized to update this task', 403));
		}

		if (!engineer) {
			return next(createError('Engineer not found', 404));
		}

		const isTeamMember = task.project.teamMembers.some((memberId) => memberId.toString() === engineerId.toString());
		if (!isTeamMember) {
			return next(createError('Engineer is not assigned to this project', 400));
		}

		if (task.engineersAssigned.some((memberId) => memberId.toString() === engineerId.toString())) {
			return next(createError('Engineer already assigned to this task', 400));
		}

		task.engineersAssigned.push(engineerId);
		await task.save();

		await Engineer.findByIdAndUpdate(engineerId, { $addToSet: { Tasks: task._id } });

		const updatedTask = await populateTask(Task.findById(id));

		return res.status(200).json({
			status: 'success',
			message: 'Engineer added to task successfully',
			data: updatedTask
		});
	} catch (error) {
		return next(error);
    }
};

const removeEngineerFromTask = async (req, res, next) => {
	try {
		const { id, engineerId } = req.params;

		if (!isValidObjectId(id) || !isValidObjectId(engineerId)) {
			return next(createError('Invalid task or engineer ID', 400));
		}

		const task = await Task.findById(id).populate('project', 'projectManager');
		const engineer = await Engineer.findById(engineerId);

		if (!task) {
			return next(createError('Task not found', 404));
		}

		if (task.project.projectManager.toString() !== req.user._id.toString()) {
			return next(createError('You are not authorized to update this task', 403));
		}

		if (!engineer) {
			return next(createError('Engineer not found', 404));
		}

		task.engineersAssigned = task.engineersAssigned.filter((memberId) => memberId.toString() !== engineerId.toString());
		await task.save();

		await Engineer.findByIdAndUpdate(engineerId, {
			$pull: { Tasks: task._id },
			$unset: { currentTask: 1 }
		});

		const updatedTask = await populateTask(Task.findById(id));

		return res.status(200).json({
			status: 'success',
			message: 'Engineer removed from task successfully',
			data: updatedTask
		});
	} catch (error) {
		return next(error);
    }
};

module.exports = {
	createTask,
	deleteTask,
	addEngineerToTask,
	removeEngineerFromTask,
	updateTaskStatus,
	getTaskDetails,
	getAllTasks,
	bulkUpdateTaskStatus
};