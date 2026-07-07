const userMethods = (schema) => {
	schema.virtual('isProjectManager').get(function isProjectManager() {
		return this.role === 'project_manager';
	});

	schema.virtual('isEngineer').get(function isEngineer() {
		return this.role === 'engineer';
	});

	schema.virtual('profileCompletion').get(function profileCompletion() {
		const profile = this.profile || {};
		const fields = ['phone', 'linkedin', 'github'];
		const filledFields = fields.filter((field) => Boolean(profile[field])).length;
		return Math.round((filledFields / fields.length) * 100);
	});

	schema.methods.hasRole = function hasRole(role) {
		return this.role === role;
	};

	schema.statics.findByEmail = function findByEmail(email) {
		return this.findOne({ email: email.toLowerCase().trim() });
	};

	schema.statics.findByRole = function findByRole(role) {
		return this.find({ role });
	};
};

module.exports = userMethods;



