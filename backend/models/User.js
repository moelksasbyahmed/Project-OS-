const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const applyUserMethods = require('./user_methods');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: [true, 'Email already exists'],
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'], 
    minlength: [6, 'Password must be at least 6 characters long'], 
    maxlength: [128, 'Password cannot exceed 128 characters' ],
    select :false 
  },
  lastlogin: {
    type: Date,
    default : null 
  },
   profileImage: {
    type: String ,
    default : "default-avater.webp"
  },
  role: {
    type: String,
    enum: ['project_manager', 'engineer'],
    default: 'engineer'
  },
  completedProjects : [{
     type: Number,
     default : 0
  }], 
 
  profile : {
    phone: {
      type: String,
    },
    linkedin :{
      type : String, 
    },
    github : {
      type : String,
    }
  }


});

applyUserMethods(userSchema);

const ProjectManagerSchema = new mongoose.Schema({
managed_projects: [{
  type: mongoose.Schema.Types.ObjectId, 
  ref: 'Project', 
}],
managed_engineers : [{
  type: mongoose.Schema.Types.ObjectId, 
  ref: 'engineer',
}],

 })
 

 const EngineerSchema = new mongoose.Schema({
 projects :[{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project', 
    default : [] 
  }],
  Tasks :[{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task', 
    default : [] 
  }], 
  completedTasks : [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task', 
    default : []  
  }], 
  currentTask : { 
    type : mongoose.Schema.Types.ObjectId, 
    ref : 'Task', 
  },
  currentProject : { 
    type : mongoose.Schema.Types.ObjectId, 
    ref : 'Project',
  },
  availability: {
    status:{
      type: String, 
      enum: ['available', 'busy', 'on_leave'],
      default: 'available'
    }
  }
  })

userSchema.pre('save', function updateTimestamp(next) {
 if (!this.isModified('password')) {
  return next();
 }

 this.password = bcrypt.hashSync(this.password, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);
