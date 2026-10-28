const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Associated order reference is required'],
    unique: true // Strictly one review per completed order
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Client reference is required']
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Freelancer reference is required']
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service reference is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1 star'],
    max: [5, 'Rating cannot exceed 5 stars']
  },
  comment: {
    type: String,
    required: [true, 'Review feedback is required'],
    trim: true,
    minlength: [5, 'Feedback must be at least 5 characters long'],
    maxlength: [1000, 'Feedback cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

reviewSchema.index({ freelancer: 1, createdAt: -1 });
reviewSchema.index({ service: 1 });
reviewSchema.index({ client: 1 });

module.exports = mongoose.model('Review', reviewSchema);
