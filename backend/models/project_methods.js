const projectMethods = (schema) => {
  schema.virtual('memberCount').get(function memberCount() {
    return Array.isArray(this.teamMembers) ? this.teamMembers.length : 0;
  });

  schema.virtual('taskCount').get(function taskCount() {
    return Array.isArray(this.tasks) ? this.tasks.length : 0;
  });

  schema.virtual('daysRemaining').get(function daysRemaining() {
    if (!this.endDate) {
      return null;
    }

    const remaining = Math.ceil((new Date(this.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return remaining;
  });

  schema.virtual('isCompleted').get(function isCompleted() {
    return this.status === 'completed';
  });

  schema.methods.hasMember = function hasMember(memberId) {
    return Array.isArray(this.teamMembers)
      && this.teamMembers.some((teamMemberId) => teamMemberId.toString() === memberId.toString());
  };

  schema.methods.isOverdue = function isOverdue() {
    return Boolean(this.endDate) && new Date(this.endDate) < new Date() && this.status !== 'completed';
  };

  schema.statics.findByStatus = function findByStatus(status) {
    return this.find({ status });
  };

  schema.statics.findByManager = function findByManager(projectManagerId) {
    return this.find({ projectManager: projectManagerId });
  };
};

module.exports = projectMethods;