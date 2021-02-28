const AppError = require('./../utils/appError');

/**
 * create error in development mode, sending back lots of data
 * @param err the error that was generated
 * @param res the response to send
 */
const devError = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    err,
    message: err.message,
    stack: err.stack,
  });
};

/**
 * create an error in production: first, check if the error has the isOperational property. this means it is from
 * the class AppError
 * if so, send back necessary response. otherwise, don't leak sensitive details to client
 */
const prodError = (err, res) => {
  // our errors have the isOperational property
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error('BIG BAD ERROR:', err);
    // programming/unknown error: don't leak details to client
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong 🙃',
    });
  }
};

// handle the various expected errors from the database

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const field = err.keyPattern
    ? Object.getOwnPropertyNames(err.keyPattern)[0]
    : '';
  const value = err.keyValue ? err.keyValue.name : '';
  const message = `Duplicate field ${field} (${value})`;
  return new AppError(message, 400);
};

const handleJWTError = (message) => new AppError(message, 401);

// send an error response to client, customized to which environment the app is running in
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    devError(err, res);
  } else {
    // else if (process.env.NODE_ENV === 'production') {
    // deep copy the error param so as not to modify it
    let error = JSON.parse(JSON.stringify(err));

    // still use the original err param so that the name field is not undefined
    if (err.name === 'CastError') {
      error = handleCastErrorDB(error);
    } else if (err.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    } else if (err.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    } else if (err.name === 'JsonWebTokenError') {
      error = handleJWTError('Invalid token. Please log in again.');
    } else if (err.name === 'TokenExpiredError') {
      error = handleJWTError('Your token has expired. Please log in again');
    }
    prodError(error, res);
  }
};
