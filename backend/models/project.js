const mongoose = require('mongoose'); 
const applyProjectMethods = require('./project_methods');

const projectSchema = new mongoose.Schema({ 
name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Project description cannot exceed 200 characters']
  },
  startDate: {
    type: Date,
    default: Date.now },
  endDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value >= this.startDate;
      },
      message: 'End date must be greater than or equal to start date'
    }
    },
    status:{
    type: String, 
    enum: ['not_started', 'in_progress', 'completed'], 

    },
    projectManager: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'ProjectManager', 
        required: [true, 'Project manager is required']
    },
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
     }],
    teamMembers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Engineer'
    }],
    priority: { 
        type: String,
        enum: ['low', 'medium', 'high'], 
    },
})

  applyProjectMethods(projectSchema);

  module.exports = mongoose.model('Project', projectSchema);