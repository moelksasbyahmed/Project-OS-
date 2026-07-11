const jwt = require('jsonwebtoken');
const { User } = require('../models');

const extract_token = (req, next ) => {
    let token = req.headers.authorization;
 if (!token) {
      return next(new Error('No token provided'));
 }
      if (token.startsWith('Bearer ')) { 
        token = token.slice(7, token.length).trimLeft(); 
         console.log("token", token)
      }
     
      else {
        return next (new Error('Invalid token format')) ; 
      }
      return token; 
    


      
 }



const protect = async (req, res, next) => {
  try {
    const token = extract_token(req, next);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new Error('User not found'));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(new Error(`Authentication failed: ${error.message}`));
  }
};

module.exports = {
  protect
};