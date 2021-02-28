const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const biteRouter = require('./routes/biteRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const Bite = require('./models/bite/biteModel');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// GLOBAL MIDDLEWARES
// limit requests from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// set security HTTP headers
app.use(helmet());

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// middleware for parsing body into req.body
app.use(express.json({ limit: '10kb' }));

// serve static files
app.use(express.static(`${__dirname}/../public`));

// data sanitization against NoSQL query injection
app.use(mongoSanitize());

// sanitize against xss attack
app.use(xss());

// prevent param pollution
const whitelistedFields = Object.keys(Bite.schema.paths).filter(
  (el) => !el.startsWith('_')
);
app.use(
  hpp({
    whitelist: whitelistedFields,
  })
);

app.use('/api/bites', biteRouter);
app.use('/api/users', userRouter);
app.use('/api/reviews', reviewRouter);

// if we get here, none of our routers caught the request (because of the middleware stack)
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on the server`, 404));
});

// global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
