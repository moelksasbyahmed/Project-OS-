require('dotenv').config();

const connectDatabase = require('./config/database');
const app = require('./app');

const { PORT = 5000 } = process.env;

const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
