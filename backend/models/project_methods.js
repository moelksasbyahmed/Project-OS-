const projectMethods = (schema) => {
	schema.virtual('teamMemberCount').get(function teamMemberCount() {
		return Array.isArray(this.teamMembers) ? this.teamMembers.length : 0;
	});

	schema.virtual('taskCount').get(function taskCount() {
		return Array.isArray(this.tasks) ? this.tasks.length : 0;
	});

	schema.methods.hasTeamMember = function hasTeamMember(engineerId) {
		return Array.isArray(this.teamMembers)
			&& this.teamMembers.some((memberId) => memberId.toString() === engineerId.toString());
	};

	schema.methods.isManagedBy = function isManagedBy(projectManagerId) {
		return this.projectManager && this.projectManager.toString() === projectManagerId.toString();
	};

	schema.statics.findByManager = function findByManager(projectManagerId) {
		return this.find({ projectManager: projectManagerId });
	};

	schema.statics.findByStatus = function findByStatus(status) {
		return this.find({ status });
	};
};

module.exports = projectMethods;