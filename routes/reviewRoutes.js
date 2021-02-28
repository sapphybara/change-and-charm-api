const express = require('express');
const {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  getReview,
  protectReviewUpdates,
} = require('./../controllers/reviewController');
const { protect, restrictTo } = require('./../controllers/authController');
const { USER_ROLES } = require('./../models/user/userSchema');

const router = express.Router({ mergeParams: true });
// authenticate all users
router.use(protect);

router
  .route('/')
  .get(getAllReviews)
  .post(restrictTo(USER_ROLES[2]), protectReviewUpdates, createReview);

router.use(restrictTo(USER_ROLES[0], USER_ROLES[2]));
router
  .route('/:id')
  .get(getReview)
  // todo can users change reviews that aren't their own
  .patch(updateReview)
  .delete(deleteReview);

module.exports = router;
