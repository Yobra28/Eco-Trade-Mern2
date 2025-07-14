const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Electronics', 'Plastic', 'Metal', 'Paper', 'Glass', 'Textile', 'Other']
  },
  condition: {
    type: String,
    required: [true, 'Condition is required'],
    enum: ['excellent', 'good', 'fair', 'poor']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String
  }],
  location: {
    address: {
      type: String,
      required: [true, 'Location is required']
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    city: String,
    state: String,
    zipCode: String
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'pending', 'traded', 'removed'],
    default: 'available'
  },
  weight: {
    value: Number,
    unit: {
      type: String,
      enum: ['kg', 'lbs', 'g', 'oz'],
      default: 'kg'
    }
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'in', 'm', 'ft'],
      default: 'cm'
    }
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  price: {
    amount: {
      type: Number,
      min: 0,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    type: {
      type: String,
      enum: ['free', 'trade', 'sell'],
      default: 'free'
    }
  },
  views: {
    type: Number,
    default: 0
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isPromoted: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
});

// Indexes for better query performance
itemSchema.index({ category: 1, status: 1 });
itemSchema.index({ 'location.coordinates': '2dsphere' });
itemSchema.index({ user: 1, status: 1 });
itemSchema.index({ tags: 1 });
itemSchema.index({ createdAt: -1 });
itemSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Text search index
itemSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
});

// Virtual for formatted weight
itemSchema.virtual('formattedWeight').get(function() {
  if (!this.weight || !this.weight.value) return null;
  return `${this.weight.value} ${this.weight.unit}`;
});

// Virtual for formatted dimensions
itemSchema.virtual('formattedDimensions').get(function() {
  if (!this.dimensions || !this.dimensions.length) return null;
  const { length, width, height, unit } = this.dimensions;
  return `${length}x${width}x${height} ${unit}`;
});

// Populate user data when querying
itemSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name email avatar rating location totalTrades'
  });
  next();
});

module.exports = mongoose.model('Item', itemSchema);