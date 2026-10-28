const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Service title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters long'],
    maxlength: [120, 'Title cannot exceed 120 characters']
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Freelancer reference is required']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category reference is required']
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    trim: true,
    minlength: [20, 'Description must be at least 20 characters long'],
    maxlength: [3000, 'Description cannot exceed 3000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Service price is required'],
    min: [5, 'Price must be at least 5'],
    max: [100000, 'Price cannot exceed 100,000']
  },
  deliveryDays: {
    type: Number,
    required: [true, 'Estimated delivery duration in days is required'],
    min: [1, 'Delivery time must be at least 1 day'],
    max: [60, 'Delivery time cannot exceed 60 days']
  },
  skills: {
    type: [String],
    default: []
  },
  thumbnailUrl: {
    type: String,
    default: '/images/default-service.svg'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for high-performance searching and filtering
serviceSchema.index({ title: 'text', description: 'text', skills: 'text' });
serviceSchema.index({ category: 1, isActive: 1, price: 1 });
serviceSchema.index({ freelancer: 1 });

module.exports = mongoose.model('Service', serviceSchema);
