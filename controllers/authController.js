const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/user/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const filterObj = require('./../utils/filterObj');

/**
 * find user by their email/password
 * @param email user's email
 * @param username user's pass
 * @returns {Query} the user found
 */
const getUserByEmailOrUsername = (email, username) => {
  return User.findOne(email ? { email } : { username });
};

/**
 * returns the response, along with the token, to the client
 * @param user the current user
 * @param statusCode status code to send back
 * @param res response to send
 * @param data optional object to send to client
 */
const sendJWTToClient = (user, statusCode, res, data) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  // keep cookie secure in production
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  res.cookie('jwt', token, cookieOptions);
  // remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data,
  });
};

// create a user
exports.signup = catchAsync(async (req, res, next) => {
  const restrictedObj = filterObj(
    req.body,
    'name',
    'username',
    'email',
    'photo',
    'password',
    'passwordConfirm'
  );
  // ensure we only create users with fields we want
  const user = await User.create(restrictedObj);

  // log user in
  sendJWTToClient(user, 201, res, { user });
});

// log the user in
exports.login = catchAsync(async (req, res, next) => {
  const { email, username, password } = req.body;

  // 1) check if email/username and password exist on the request
  if (!(email || username) || !password) {
    return next(
      new AppError('Please provide a valid username/email and password', 400)
    );
  }

  // here we know that either email or username exists by check above
  const user = await getUserByEmailOrUsername(email, username).select(
    '+password'
  );

  console.log(user);
  // make sure user is found and the password is correct
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email/username or password', 401));
  }

  // 3) send jwt to client
  sendJWTToClient(user, 200, res);
});

// only allow currently logged in users to protected routes
exports.protect = catchAsync(async (req, res, next) => {
  // 1. get token and check if it exists
  const auth = req.headers.authorization;
  let token;
  if (auth && auth.startsWith('Bearer')) {
    token = auth.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in, do so to get access', 401)
    );
  }

  // 2. verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3. check if the user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to that token no longer exists', 401)
    );
  }

  // 4. check if user changed password after token was issued
  if (currentUser.changedPasswordAfterCreatingJWT(decoded.iat)) {
    return next(new AppError('Your password was changed, please log in', 401));
  }

  // add the user to the request
  req.user = currentUser;

  // 5. if all the above checks pass, authorize access to protected route
  next();
});

/**
 * wrapper function to restrict routes to users with the given roles
 * @param roles array of roles which are allowed
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // get the user from the previous (protect) middleware
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to do that', 403));
    }
    next();
  };
};

// create a random reset token to send to user's email
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. get user based on POSTed email/username
  const { email, username } = req.body;
  const user = await getUserByEmailOrUsername(email, username);

  if (!user) {
    return next(new AppError('There is no user with that email/username', 404));
  }

  // 2. generate random reset token (NOT jwt)
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. send to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? submit patch with new password and passwordConfirm to:
    ${resetURL}.\nIf you didn't forget your password, please ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message,
    });
  } catch (err) {
    // remove the fields we added before
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // save user to database without validating
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email, please try again later',
        500
      )
    );
  }

  res.status(200).json({
    status: 'success',
    message: "Token sent to user's email",
  });
});

// reset password with token from user's email
exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // find user for token and check if it hasn't expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2. if token hasn't expired && a user exists, set new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // get the password and passwordConfirm from body
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  // removed unneeded fields from database
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 4. log user in
  sendJWTToClient(user, 200, res);
});

// update the current user's password
// todo add functionality to do this without being logged in
exports.updateMyPassword = catchAsync(async (req, res, next) => {
  // 1. get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2. check if POSTed pw is correct
  if (
    !user ||
    !(await user.correctPassword(req.body.passwordCurrent, user.password))
  ) {
    return next(
      new AppError(
        'Your current password is wrong, log out and hit forgot password if necessary',
        401
      )
    );
  }

  // 3. update pw
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4. log user in (send jwt)
  sendJWTToClient(user, 200, res, { user });
});
