const Review = require('./../models/review/reviewModel');
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require('./handlerFactory');

exports.getAllReviews = getAll(Review);
exports.createReview = createOne(Review);
// WARNING: NOT FOR PASSWORD UPDATES
exports.updateReview = updateOne(Review);
exports.deleteReview = deleteOne(Review);
exports.getReview = getOne(Review);

// allow for creating review off nested bite route
exports.protectReviewUpdates = (req, res, next) => {
  // allow for creating review off nested bite route
  req.body.bite = req.body.bite || req.params.biteId;
  // DO NOT default to the user sent in the body, as that could be wrong info sent from the user
  req.body.user = req.user.id;
  next();
};
