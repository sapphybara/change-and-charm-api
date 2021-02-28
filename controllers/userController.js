const User = require('./../models/user/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const filterObj = require('./../utils/filterObj');
const { deleteOne, updateOne, getOne, getAll } = require('./handlerFactory');

exports.getAllUsers = getAll(User);
exports.getUser = getOne(User);
exports.updateUser = updateOne(User);
exports.deleteUser = deleteOne(User);

// simulates a user id coming from parameters, allows getting user data easily
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
/**
 * updates the current user document
 */
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1. create an error if user tries to update pw (POSTs password data)
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates! Please use /updateMyPassword',
        400
      )
    );
  }

  // 2. update user doc only with info we want to allow to update
  // todo add photo to allowed fields if we allow user to upload pics
  const restrictedObj = filterObj(req.body, 'name', 'username', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user.id, restrictedObj, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  // set the user to inactive in the database
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not defined! please use /signup instead',
  });
};
