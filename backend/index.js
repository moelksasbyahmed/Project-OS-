require('dotenv').config();

const express = require('express');
const connectDatabase = require('./config/database');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(express.json());
app.use('/api/users', userRoutes);

app.use((request, response) => {
  return response.status(404).json({
    status: 'fail',
    message: `Route ${request.originalUrl} not found`,
    data: null
  });
});

app.use((error, request, response, next) => {
  return response.status(error.statusCode || 500).json({
    status: 'fail',
    message: error.message || 'Internal server error',
    data: null
  });
});

const { PORT = 5000 } = process.env;

const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
