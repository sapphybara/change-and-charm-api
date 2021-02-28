const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { userSchema } = require('./userSchema');

// adds pre save/find middleware to userSchema for security and abstraction

// if the user is being created/if their password is modified, encrypt it and don't persist the passwordConfirm
// field to the database
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    // hash password with cost 12
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;

    // also add passwordChangedAt property to user if the document is not new
    if (!this.isNew) {
      // small hack to fix bug with database not saving as fast as token is sent todo check
      this.passwordChangedAt = Date.now() - 1000;
    }
  }
  next();
});

// only return users that are active in the database
userSchema.pre(/^find/, function (next) {
  //  `this` is current query
  this.find({ active: { $ne: false } });
  next();
});

// test if the user's password is correct
userSchema.methods.correctPassword = async function (candidatePw, userPw) {
  return await bcrypt.compare(candidatePw, userPw);
};

// test if the JWT is invalid because the password was changed since its creation
userSchema.methods.changedPasswordAfterCreatingJWT = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return changedTimestamp > JWTTimestamp;
  }
  return false;
};

// create a secure password reset token to send to the user
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // set password reset token to expire in 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};
