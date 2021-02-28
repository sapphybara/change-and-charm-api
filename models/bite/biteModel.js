const { model } = require('mongoose');
const { biteSchema } = require('./biteSchema');
require('./biteSchemaMiddleware');

module.exports = model('Bite', biteSchema);
