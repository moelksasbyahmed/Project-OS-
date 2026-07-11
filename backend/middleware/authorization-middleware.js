
const authorize = (...roles) => {
   return (req, res, next) => {
      if (!req.user) {
         return next(new Error('User not authenticated'));
      }

      if (!roles.includes(req.user.role)) {
         return next(new Error('User not authorized'));
      }

      return next();
   };
};

module.exports = {
   authorize
};