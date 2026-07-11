const JWT = require('jsonwebtoken'); 


const generateToken = (user) => { 
     return JWT.sign({
        id: user._id, 
        email: user.email,
        role: user.role 
     },
    process.env.JWT_SECRET, 
    {
        issuer: 'projectflow', 
        expiresIn: '2h',
        
    }
    )



}
module.exports = { generateToken } 