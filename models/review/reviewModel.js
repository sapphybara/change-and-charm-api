const { model } = require('mongoose');
const { reviewSchema } = require('./reviewSchema');
require('./reviewSchemaMiddleware');

module.exports = model('Review', reviewSchema);
