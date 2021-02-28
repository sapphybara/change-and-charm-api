const mongoose = require('mongoose');
const dotenv = require('dotenv');

// handle any uncaught exceptions as the last resort
process.on('uncaughtException', (err) => {
  console.error(`FAIL: Uncaught Exception; shutting the server down...`);
  console.error(err.name, err.message);
  process.exit(1);
});

dotenv.config();
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((con) => console.log('DB connected successfully'));

const PORT = process.env.PORT || 8080;

// start server
const server = app.listen(PORT, () =>
  console.log(`server running on localhost:${PORT}`)
);

// on an unhandled promise rejection, close the server
process.on('unhandledRejection', (err) => {
  console.error(`FAIL: Unhandled exception; shutting the server down...`);
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
