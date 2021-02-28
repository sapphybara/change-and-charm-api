const mongoose = require('mongoose');
const validator = require('validator');

exports.USER_ROLES = ['admin', 'coach', 'user'];

// define the schema for the user
exports.userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'A user must have a name'],
  },
  username: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
    minlength: 6,
    index: true,
    validate: {
      validator: function (el) {
        // don't allow whitespace in username
        return !el.match(/\s/);
      },
      message: 'Username cannot contain white spaces',
    },
  },
  email: {
    type: String,
    trim: true,
    required: [true, 'Please enter an email address'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please enter a valid email address'],
  },
  role: {
    type: String,
    enum: exports.USER_ROLES,
    default: 'user',
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'The user needs a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'The user needs a password confirmation'],
    validate: {
      // WARNING: ONLY WORKS ON SAVE/CREATE
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  joinedOn: {
    type: Date,
    default: Date.now(),
  },
});
