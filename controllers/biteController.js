const Bite = require('./../models/bite/biteModel');
const catchAsync = require('./../utils/catchAsync');
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require('./handlerFactory');

// TODO write comprehensive docs for the api, including which requests can be made using which http methods, what
//  kind of filtering/sorting is available, plus any other features we add

exports.getAllBites = getAll(Bite);
exports.createBite = createOne(Bite);
// get a bite with the given id and populate its reviews
exports.getBite = getOne(Bite, { path: 'reviews' });
exports.updateBite = updateOne(Bite);
exports.deleteBite = deleteOne(Bite);

// run the aggregation pipeline to get info about the bites
exports.getBiteStats = catchAsync(async (req, res, next) => {
  const stats = await Bite.aggregate([
    {
      $group: {
        _id: '$duration',
        numBites: { $sum: 1 },
        numRatings: { $sum: '$numRatings' },
        totalAveRating: { $avg: '$averageRatings' },
        totalAvePrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { totalAvePrice: 1 },
    },
  ]);

  res.json({
    status: 'success',
    results: stats.length,
    data: {
      stats,
    },
  });
});

// alias for popular bite requests
exports.aliasTopBites = (req, res, next) => {
  const query = req.query;

  query.limit = query.limit || '5';
  query.sort = query.sort || 'price,averageRatings,-duration';
  query.fields = query.fields || 'name,price,averageRatings,coach';

  next();
};
