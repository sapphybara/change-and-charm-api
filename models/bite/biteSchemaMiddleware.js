const slugify = require('slugify');
const { biteSchema } = require('./biteSchema');

// fat models, thin controllers: add as much of the business logic to the model so that the controller only has to
// deal with the application logic

biteSchema.index({ price: 1, averageRatings: 1 });
biteSchema.index({ slug: 1 });

// add useful virtual property
biteSchema.virtual('durationHours').get(function () {
  return Math.round((this.duration / 60 + Number.EPSILON) * 10) / 10;
});

// virtual populate of reviews on bites
biteSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'bite',
  localField: '_id',
});

// Document middleware: runs before .save() and .create()
biteSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Query middleware, to be run on any query that starts with 'find'
biteSchema.pre(/^find/, function (next) {
  // 'this' is now a query object

  // filter out secret bites, such as for VIP members, associates, and more
  this.find({ secretBite: { $ne: true } });

  // populate the query to find the coaches for all bites
  // WARNING: populate creates another entire query
  this.populate({
    path: 'coaches',
    select: '-__v -passwordChangeAt',
  });
  next();
});

// Aggregation middleware, removes secret tours
biteSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({
    $match: {
      secretBite: { $ne: true },
    },
  });
  next();
});

// ensures the slug updates when the name is changed
biteSchema.post(/^findOne/, async (doc) => {
  if (doc) {
    const currSlug = slugify(doc.name, { lower: true });
    if (doc.slug !== currSlug) {
      await doc.save();
    }
  }
});
