const taskMethods = (schema) => {
  schema.virtual('assignedCount').get(function assignedCount() {
    return Array.isArray(this.engineersAssigned) ? this.engineersAssigned.length : 0;
  });

  schema.virtual('isCompleted').get(function isCompleted() {
    return this.status === 'completed';
  });

  schema.methods.markCompleted = function markCompleted() {
    this.status = 'completed';
    return this;
  };

  schema.methods.isAssignedTo = function isAssignedTo(engineerId) {
    return Array.isArray(this.engineersAssigned)
      && this.engineersAssigned.some((assignedId) => assignedId.toString() === engineerId.toString());
  };

  schema.statics.findByStatus = function findByStatus(status) {
    return this.find({ status });
  };

  schema.statics.findForEngineer = function findForEngineer(engineerId) {
    return this.find({ engineersAssigned: engineerId });
  };
};

module.exports = taskMethods;