const { reviewSchema } = require('./reviewSchema');
const Bite = require('./../bite/biteModel');

// only allow a user to create one review per bite
reviewSchema.index({ bite: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // populate author field of the review
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

// when a review is updated/deleted, we update the review stats on the bite
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // add the first review in the database (ie the one that is being created) to the query middleware, allowing us to
  // pass it from the pre to the post
  this.review = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // get the review from the pre middleware
  const { review } = this;
  if (review) {
    await review.constructor.calcAverageRatings(review.bite);
  }
});

reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.bite._id);
});

// get info about reviews on the bites
reviewSchema.statics.calcAverageRatings = async function (biteId) {
  // we used a static method so we can call aggregate on the model (`this` points to the Review model)
  const stats = await this.aggregate([
    {
      $match: { bite: biteId },
    },
    {
      $group: {
        _id: '$bite',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length) {
    await Bite.findByIdAndUpdate(biteId, {
      numRatings: stats[0].nRating,
      averageRatings: stats[0].avgRating,
    });
  } else {
    await Bite.findByIdAndUpdate(biteId, {
      numRatings: 0,
      averageRatings: null,
    });
  }
};
