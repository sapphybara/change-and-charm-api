const { Schema } = require('mongoose');

const ObjectId = Schema.ObjectId;
exports.biteSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'A bite must have a name'],
      unique: true,
      maxlength: [40, 'Keep the bite name under 41 characters'],
      minlength: [5, 'Keep the bite name longer than 5 characters'],
    },
    slug: String,
    price: {
      type: Number,
      required: [true, 'A bite must have a price'],
    },
    duration: {
      type: Number,
      default: 5,
    },
    averageRatings: {
      type: Number,
      min: [1, 'Rating cannot be below 1 star'],
      max: [5, 'Rating must be below 5'],
      // round to two decimals
      set: (val) => Math.round(val * 100) / 100,
    },
    numRatings: {
      type: Number,
      default: 0,
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'Please give the bite a short summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    createdOn: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    coach: {
      type: String,
      trim: true,
      default: 'Heidi',
      // add coach names here as the business grows
      enum: {
        values: ['Heidi'],
        message:
          'Please specify a recognized coach for the bite, and get your developer to add coaches to the database' +
          ' (bite schema) if necessary',
      },
    },
    secretBite: {
      type: Boolean,
      default: false,
      select: false,
    },
    coaches: [
      {
        type: ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
