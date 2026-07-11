const express = require('express');
const dns = require('dns');
const dotenv = require('dotenv').config();
const {
	authRoutes,
	userRoutes,
	projectRoutes,
	taskRoutes,
	engineerRoutes
} = require('./routes');
const  error = require('./utils');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const database = require('./config/database'); 
database();

const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/engineers', engineerRoutes);

//app.use(notFound);
app.use(error.Error_handler);

app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`); 
});
module.exports = app;