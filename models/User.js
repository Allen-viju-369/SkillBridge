const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const portfolioItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 300,
    default: ''
  }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required']
  },
  role: {
    type: String,
    enum: ['student', 'client', 'admin'],
    default: 'student',
    required: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    default: ''
  },
  college: {
    type: String,
    trim: true,
    maxlength: 150,
    default: ''
  },
  degree: {
    type: String,
    trim: true,
    maxlength: 100,
    default: ''
  },
  yearOfStudy: {
    type: String,
    trim: true,
    maxlength: 50,
    default: ''
  },
  skills: {
    type: [String],
    default: []
  },
  portfolioLinks: {
    type: [portfolioItemSchema],
    default: []
  },
  profileImage: {
    type: String,
    default: '/images/default-avatar.svg'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  accountStatus: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Method to verify password using bcrypt
userSchema.methods.isValidPassword = async function(plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// Static helper to hash passwords
userSchema.statics.hashPassword = async function(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

// Indexes
userSchema.index({ role: 1, accountStatus: 1 });
userSchema.index({ skills: 1 });

module.exports = mongoose.model('User', userSchema);
