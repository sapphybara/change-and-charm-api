const { Schema } = require('mongoose');

const ObjectId = Schema.ObjectId;
exports.reviewSchema = new Schema(
  {
    review: {
      type: String,
      minlength: [3, 'Please use at least 3 characters in the review'],
      required: [true, 'A review cannot be empty'],
    },
    rating: {
      type: Number,
      min: [1, 'A rating must be at least 1 star'],
      max: [5, 'Ratings cannot be greater than 5 stars'],
      required: [true, 'Please rate the bite!'],
    },
    createdOn: {
      type: Date,
      default: Date.now(),
    },
    bite: {
      type: ObjectId,
      ref: 'Bite',
    },
    user: {
      type: ObjectId,
      ref: 'User',
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
