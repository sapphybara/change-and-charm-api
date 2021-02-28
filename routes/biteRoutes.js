const express = require('express');
const { USER_ROLES } = require('./../models/user/userSchema');
const {
  aliasTopBites,
  getBiteStats,
  getAllBites,
  createBite,
  getBite,
  updateBite,
  deleteBite,
} = require('../controllers/biteController');
const { protect, restrictTo } = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

router
  .route('/')
  .get(getAllBites)
  .post(protect, restrictTo(USER_ROLES[0]), createBite);

router
  .route('/:id')
  .get(getBite)
  .patch(protect, restrictTo(USER_ROLES[0]), updateBite)
  .delete(protect, restrictTo(USER_ROLES[0]), deleteBite);

router.route('/top-cheap').get(aliasTopBites, getAllBites);

router.route('/bite-stats').get(getBiteStats);

router.use('/:biteId/reviews', reviewRouter);

module.exports = router;
