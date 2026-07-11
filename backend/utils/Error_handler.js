
    const Error_handler  = (err, req , res , next ) =>{
    
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('ERROR OCCURRED');
    console.log('═══════════════════════════════════════════════════════════');
    
    
    console.log(` Error Name: ${err.name || 'Error'}`);
    console.log(`Error Message: ${err.message}`);
    console.log(` Status Code: ${err.statusCode || 'Not set'}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Path: ${req.originalUrl}`);
    console.log(` Method: ${req.method}`);
    //console.log(`Stack Trace: ${err.stack}`);
    if (req.body && Object.keys(req.body).length > 0) {
        const sanitizedBody = { ...req.body };
        if (sanitizedBody.password) sanitizedBody.password = '******';
        if (sanitizedBody.token) sanitizedBody.token = '******';
        console.log(`Request Body:`, sanitizedBody);
    }
    
  
    if (req.params && Object.keys(req.params).length > 0) {
        console.log(`Request Params:`, req.params);
    }
    
   
    if (req.query && Object.keys(req.query).length > 0) {
        console.log(`Request Query:`, req.query);
    }
    
    
    if (req.user) {
        console.log(`👤 User:`, {
            id: req.user.id || req.user._id,
            email: req.user.email,
            role: req.user.role
        });
    }
      
            const errorMap = {
        'User not authenticated': 401,
        'User not authorized for this action': 403,
                'User not authorized': 403,
        'Email and password are required': 400,
        'Name, email, password, and role are required': 400,
        'User not found': 404,
        'No Projects Available for this user ': 404,
        'Invalid email or password': 401,
        'Email already exists': 409,
        'User with this email already exists': 409,
        'Invalid token': 401,
        'Token expired': 401,
        'Validation failed': 400,
        'Not found': 404,
        'Invalid user ID': 400,
        'No valid fields provided for update': 400,
        'Invalid token format': 400,
        'No token provided': 401,
        'Authentication failed': 401,
        'Project not found': 404,
        'Task not found': 404,
        'Engineer not found': 404,
        'Project manager not found': 404,
        'Invalid project ID': 400,
        'Invalid task ID': 400,
        'Invalid engineer ID': 400,
        'Invalid project or engineer ID': 400,
        'Invalid task or engineer ID': 400,
        'No valid fields provided for update': 400,
        'Project name is required': 400,
        'Project not found or access denied': 403,
        'You are not authorized to view these tasks': 403,
        'You are not authorized to view this task': 403,
        'You are not authorized to update this task': 403,
        'You are not authorized to delete this task': 403,
        'Engineer is not assigned to this project': 400,
        'Engineer already assigned to this task': 400,
        'taskIds must be a non-empty array': 400,
        'engineerIds and projectId are required': 400,
        'Engineer Already Exist in the project': 400,
        "Invalid role: undefined. Must be 'project_manager' or 'engineer'": 400
    };
    let message = err.message || 'Internal Server Error'; 
    let  statusCode = errorMap[err.message] || 500; 
 if (errorMap[message]) {
        statusCode = errorMap[message];
    } else { 

        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('not authenticated') || lowerMessage.includes('unauthorized')) {
            statusCode = 401;
        } else if (lowerMessage.includes('not authorized') || lowerMessage.includes('forbidden')) {
            statusCode = 403;
        } else if (lowerMessage.includes('not found')) {
            statusCode = 404;
        } else if (lowerMessage.includes('already exists') || lowerMessage.includes('duplicate')) {
            statusCode = 409;
        } else if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
            statusCode = 400;
        } else if (lowerMessage.includes('token') && lowerMessage.includes('expired')) {
            statusCode = 401;
        }
    }
    const errorResponse = { 
        status: 'error',
        message: message, 
        statusCode: statusCode, 
        timestamp: new Date().toISOString(), 
        path : req.originalUrl, 
        method : req.method 
    }
    res.status(statusCode).json(errorResponse);
} 
    
 module.exports = Error_handler; 