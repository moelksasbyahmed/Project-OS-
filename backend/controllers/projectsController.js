const project = require('../models/project');
const Task = require('../models/Task');
const { ProjectManager, Engineer } = require('../models/User');

const getAllProjects = async (req, res, next) => {
  try {
    const projectManager = await ProjectManager.findById(req.user._id);

    if (!projectManager) {
      return next(new Error('Project manager not found'));
    }

    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const skip = (page - 1) * limit;

    const projects = await project.find({ projectManager: projectManager._id })
      .populate({
        path: 'tasks',
        select: 'title description status engineersAssigned due_date',
        populate: { path: 'engineersAssigned', select: 'name email' }
      })
      .populate({ path: 'teamMembers', select: 'name email' })
      .populate({ path: 'projectManager', select: 'name email' })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: 'success',
      results: projects.length,
      data: projects
    });
  } catch (error) {
    return next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      status,
      teamMembers = [],
      priority
    } = req.body;

    const projectDoc = await project.create({
      name,
      description,
      startDate: startDate || Date.now(),
      endDate,
      status: status || 'not_started',
      priority: priority || 'medium',
      projectManager: req.user._id,
      teamMembers,
      tasks: []
    });

    await ProjectManager.findByIdAndUpdate(req.user._id, {
      $addToSet: { managed_projects: projectDoc._id }
    });

    if (teamMembers && teamMembers.length > 0) {
      await Engineer.updateMany(
        { _id: { $in: teamMembers } },
        { $addToSet: { projects: projectDoc._id } }
      );
    }

    const populatedProject = await project.findById(projectDoc._id)
      .populate({ path: 'projectManager', select: 'name email' })
      .populate({ path: 'teamMembers', select: 'name email' })
      .populate({
        path: 'tasks',
        select: 'title description status engineersAssigned due_date',
        populate: { path: 'engineersAssigned', select: 'name email' }
      });

    return res.status(201).json({
      status: 'success',
      message: 'Project created successfully',
      data: populatedProject
    });
  } catch (error) {
    return next(error);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    const populatedProject = await project.findOne({ _id: projectId, projectManager: req.user._id })
      .populate({ path: 'projectManager', select: 'name email' })
      .populate({ path: 'teamMembers', select: 'name email' })
      .populate({
        path: 'tasks',
        select: 'title description status engineersAssigned due_date',
        populate: { path: 'engineersAssigned', select: 'name email' }
      });

    if (!populatedProject) {
      return next(new Error('Project not found'));
    }

    return res.status(200).json({
      status: 'success',
      data: populatedProject
    });
  } catch (error) {
    return next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const updateData = req.body;

    const existingProject = await project.findOne({ _id: projectId, projectManager: req.user._id });

    if (!existingProject) {
      return next(new Error('Project not found'));
    }

    const allowedFields = ['name', 'description', 'startDate', 'endDate', 'status', 'priority', 'teamMembers', 'tasks'];
    const filteredUpdates = {};

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        filteredUpdates[field] = updateData[field];
      }
    });

    if (Array.isArray(filteredUpdates.teamMembers)) {
      await Engineer.updateMany(
        { _id: { $in: existingProject.teamMembers } },
        { $pull: { projects: existingProject._id } }
      );

      await Engineer.updateMany(
        { _id: { $in: filteredUpdates.teamMembers } },
        { $addToSet: { projects: existingProject._id } }
      );
    }

    const updatedProject = await project.findByIdAndUpdate(
      projectId,
      filteredUpdates,
      { new: true, runValidators: true }
    )
      .populate({ path: 'projectManager', select: 'name email' })
      .populate({ path: 'teamMembers', select: 'name email' })
      .populate({
        path: 'tasks',
        select: 'title description status engineersAssigned due_date',
        populate: { path: 'engineersAssigned', select: 'name email' }
      });

    if (!updatedProject) {
      return next(new Error('Project not found'));
    }

    return res.status(200).json({
      status: 'success',
      data: updatedProject
    });
  } catch (error) {
    return next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    const existingProject = await project.findOne({ _id: projectId, projectManager: req.user._id });

    if (!existingProject) {
      return next(new Error('Project not found'));
    }

    const projectTasks = await Task.find({ project: projectId }).select('_id engineersAssigned');
    const taskIds = projectTasks.map((task) => task._id);
    const engineerIds = [...new Set(projectTasks.flatMap((task) => task.engineersAssigned || []).map((engineerId) => engineerId.toString()))];

    if (engineerIds.length > 0) {
      await Engineer.updateMany(
        { _id: { $in: engineerIds } },
        {
          $pull: { projects: existingProject._id, Tasks: { $in: taskIds } },
          $unset: { currentProject: 1, currentTask: 1 }
        }
      );
    }

    await Task.deleteMany({ project: projectId });
    await ProjectManager.findByIdAndUpdate(req.user._id, {
      $pull: { managed_projects: existingProject._id }
    });
    await project.findByIdAndDelete(projectId);

    return res.status(200).json({
      status: 'success',
      message: 'Project deleted successfully'
    });
  } catch (error) {
    return next(error);
  }
};

const addTeamMember = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { engineerId } = req.body;

    const existingProject = await project.findOne({ _id: projectId, projectManager: req.user._id });

    if (!existingProject) {
      return next(new Error('Project not found'));
    }

    if (existingProject.teamMembers.some((memberId) => memberId.toString() === engineerId.toString())) {
      return next(new Error('Engineer Already Exist in the project'));
    }

    await project.findByIdAndUpdate(projectId, {
      $addToSet: { teamMembers: engineerId }
    });

    await Engineer.findByIdAndUpdate(engineerId, {
      $addToSet: { projects: projectId }
    });

    const updatedProject = await project.findById(projectId)
      .populate({ path: 'projectManager', select: 'name email' })
      .populate({ path: 'teamMembers', select: 'name email role' })
      .populate({ path: 'tasks', select: 'title description status engineersAssigned due_date' });

    return res.status(200).json({
      status: 'success',
      message: 'Team member added successfully',
      data: { project: updatedProject }
    });
  } catch (error) {
    return next(error);
  }
};

const removeTeamMember = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { engineerId } = req.params;

    const existingProject = await project.findOne({ _id: projectId, projectManager: req.user._id });

    if (!existingProject) {
      return next(new Error('Project not found or access denied'));
    }

    const engineer = await Engineer.findById(engineerId);
    if (!engineer) {
      return next(new Error('Engineer not found'));
    }

    const projectTasks = await Task.find({ project: projectId }).select('_id');
    const taskIds = projectTasks.map((task) => task._id);

    await project.findByIdAndUpdate(projectId, {
      $pull: { teamMembers: engineerId }
    });
     await Task.updateMany({ _id: { $in: taskIds } }, { $pull: { engineersAssigned: engineerId } });
    await Engineer.findByIdAndUpdate(engineerId, {
      $pull: { projects: projectId, Tasks: { $in: taskIds } },
      $unset: { currentProject: 1, currentTask: 1 }
    });

    return res.status(200).json({
      status: 'success',
      message: 'Team member removed successfully',
      data: {
        projectId,
        projectName: existingProject.name,
        engineerId,
        engineerName: engineer.name,
        tasksRemoved: taskIds.length
      }
    });
  } catch (error) {
    return next(error);
  }
};

const updateProjectStatus = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { status } = req.body;

    const updatedProject = await project.findOneAndUpdate(
      { _id: projectId, projectManager: req.user._id },
      { status },
      { new: true, runValidators: true }
    )
      .populate({ path: 'projectManager', select: 'name email' })
      .populate({ path: 'teamMembers', select: 'name email' })
      .populate({
        path: 'tasks',
        select: 'title description status engineersAssigned due_date',
        populate: { path: 'engineersAssigned', select: 'name email' }
      });

    if (!updatedProject) {
      return next(new Error('Project not found'));
    }

    return res.status(200).json({
      status: 'success',
      message: 'Project status updated successfully',
      data: updatedProject
    });
  } catch (error) {
    return next(error);
  }
};

const getProjectStats = async (req, res, next) => {
  try {
    const projects = await project.find({ projectManager: req.user._id }).select('status teamMembers tasks');

    const stats = projects.reduce((accumulator, currentProject) => {
      const projectStatus = currentProject.status || 'not_started';

      accumulator.totalProjects += 1;
      accumulator.totalTeamMembers += Array.isArray(currentProject.teamMembers) ? currentProject.teamMembers.length : 0;
      accumulator.totalTasks += Array.isArray(currentProject.tasks) ? currentProject.tasks.length : 0;
      accumulator.statusCounts[projectStatus] = (accumulator.statusCounts[projectStatus] || 0) + 1;

      return accumulator;
    }, {
      totalProjects: 0,
      totalTeamMembers: 0,
      totalTasks: 0,
      statusCounts: {}
    });

    return res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  addTeamMember,
  removeTeamMember,
  updateProjectStatus,
  getProjectStats
};