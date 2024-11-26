import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true
  },

  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: function () { return this.googleId ? false : true; }
  },
  googleId: {
    type: String,
    unique: true
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    required: function () { return !this.isVerified; }
  },
  verificationTokenExpires: {
    type: Date,
    required: function () { return !this.isVerified; }
  },
  roles: {
    type: [String],
    default: ['user']
  },
  profileImage: {
    type: String,
    default: ''
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});


UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.isVerificationCodeValid = function () {
  return Date.now() < this.verificationTokenExpires;
};


UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.generateResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = resetToken;
  this.resetPasswordExpires = Date.now() + 3600000;
  return resetToken;
};

const User = mongoose.model('User', UserSchema);

export default User;
