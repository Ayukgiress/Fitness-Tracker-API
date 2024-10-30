import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: false 
  },
  googleId: { 
    type: String 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  verificationCode: {
    type: String,
    default: null
  },
  verificationCodeExpires: {
    type: Date,
    default: null
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
  verificationAttempts: {
    type: Number,
    default: 0
  },
  lastVerificationAttempt: {
    type: Date
  }
}, { 
  timestamps: true 
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.isVerificationCodeValid = function() {
  return (
    this.verificationCode &&
    this.verificationCodeExpires &&
    this.verificationCodeExpires > new Date() &&
    this.verificationAttempts < 5
  );
};

UserSchema.methods.incrementVerificationAttempts = async function() {
  this.verificationAttempts += 1;
  this.lastVerificationAttempt = new Date();
  await this.save();
};

UserSchema.methods.resetVerificationAttempts = async function() {
  this.verificationAttempts = 0;
  this.lastVerificationAttempt = null;
  await this.save();
};

UserSchema.methods.clearVerificationData = async function() {
  this.verificationCode = null;
  this.verificationCodeExpires = null;
  this.verificationAttempts = 0;
  this.lastVerificationAttempt = null;
  await this.save();
};

const User = mongoose.model('User', UserSchema);

export default User;
