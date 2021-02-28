const { model } = require('mongoose');
const { userSchema } = require('./userSchema');
require('./userSchemaMiddleware');

// creates a model for the user
module.exports = model('User', userSchema);
