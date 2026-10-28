const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
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
  requirements: {
    type: String,
    required: [true, 'Detailed project requirements are required'],
    trim: true,
    minlength: [10, 'Requirements must be at least 10 characters long'],
    maxlength: [2000, 'Requirements cannot exceed 2000 characters']
  },
  deadline: {
    type: Date,
    required: [true, 'Project deadline date is required']
  },
  price: {
    type: Number,
    required: [true, 'Agreed project price is required'],
    min: [1, 'Price must be greater than 0']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'delivered', 'completed', 'rejected', 'cancelled'],
    default: 'pending'
  },
  deliveryNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Delivery notes cannot exceed 1000 characters'],
    default: ''
  },
  deliveryUrl: {
    type: String,
    trim: true,
    default: ''
  },
  deliveredAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  hasReview: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// State transition validator helper
orderSchema.statics.isValidTransition = function(currentStatus, targetStatus, userRole) {
  const allowed = {
    pending: {
      student: ['accepted', 'rejected'],
      client: ['cancelled'],
      admin: ['accepted', 'rejected', 'cancelled']
    },
    accepted: {
      student: ['in_progress'],
      client: [],
      admin: ['in_progress', 'cancelled']
    },
    in_progress: {
      student: ['delivered'],
      client: [],
      admin: ['delivered', 'cancelled']
    },
    delivered: {
      student: [],
      client: ['completed', 'in_progress'], // in_progress represents requesting revision
      admin: ['completed']
    },
    completed: {
      student: [],
      client: [],
      admin: []
    },
    rejected: {
      student: [],
      client: [],
      admin: []
    },
    cancelled: {
      student: [],
      client: [],
      admin: []
    }
  };

  const validTargetStates = (allowed[currentStatus] && allowed[currentStatus][userRole]) || [];
  return validTargetStates.includes(targetStatus);
};

// Indexes
orderSchema.index({ client: 1, createdAt: -1 });
orderSchema.index({ freelancer: 1, status: 1 });
orderSchema.index({ service: 1 });

module.exports = mongoose.model('Order', orderSchema);
