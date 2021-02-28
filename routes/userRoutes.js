const express = require('express');
const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
  deleteMe,
} = require('./../controllers/userController');
const {
  protect,
  signup,
  login,
  forgotPassword,
  resetPassword,
  updateMyPassword,
  restrictTo,
} = require('./../controllers/authController');
const { USER_ROLES } = require('./../models/user/userSchema');

const router = express.Router();

// no need for authorization for these routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

// the rest of the routes need to be logged in
router.use(protect);

router.get('/me', getMe, getUser);
router.patch('/updateMyPassword', updateMyPassword);

router.patch('/updateMe', updateMe);
router.delete('/deleteMe', deleteMe);

// only allow admins to access these routes
router.use(restrictTo(USER_ROLES[0]));
router.route('/').get(getAllUsers).post(createUser);

router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
