const mongoose = require('mongoose'); 
const applyTaskMethods = require('./task_methods');
const project = require ("./project")

const TaskSchema = new mongoose.Schema({
    title: {
        type: String, 
        required: [true, 'Task title is required'],
        trim: true,
        maxlength: [100, 'Task title cannot exceed 100 characters'],
        unique : true ,
    },
    description: { 
        type: String,
        trim: true,
        maxlength: [200, 'Task description cannot exceed 200 characters']
    },
    engineersAssigned: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Engineer'
    }],
    status: {
        type: String, 
        enum: ['not_started', 'in_progress', 'completed'],
        default: 'not_started'
    },
    project :{
        type: mongoose.Schema.Types.ObjectId,
        ref : 'Project'
    }
});

applyTaskMethods(TaskSchema);

module.exports = mongoose.model('Task', TaskSchema);