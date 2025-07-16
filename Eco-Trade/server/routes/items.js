const express = require('express');
const { body, query, validationResult, param } = require('express-validator');
const Item = require('../models/Item');
const { auth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const TradeRating = require('../models/TradeRating');
const TradeRequest = require('../models/TradeRequest');

const router = express.Router();

// Get all items with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().isIn(['Electronics', 'Plastic', 'Metal', 'Paper', 'Glass', 'Textile', 'Other']),
  query('condition').optional().isIn(['excellent', 'good', 'fair', 'poor']),
  query('status').optional().isIn(['available', 'pending', 'traded']),
  query('search').optional().isLength({ max: 100 }).withMessage('Search term too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { status: { $ne: 'removed' } };
    
    if (req.query.category) filter.category = req.query.category;
    if (req.query.condition) filter.condition = req.query.condition;
    if (req.query.status) filter.status = req.query.status;
    
    // Text search
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Location-based search
    if (req.query.lat && req.query.lng && req.query.radius) {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      const radius = parseFloat(req.query.radius) * 1000; // Convert km to meters

      filter['location.coordinates'] = {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radius
        }
      };
    }

    // Execute query
    const items = await Item.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name avatar rating location totalTrades');

    const total = await Item.countDocuments(filter);

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ message: 'Server error while fetching items' });
  }
});

// Get single item
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid item ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  try {
    const item = await Item.findById(req.params.id)
      .populate('user', 'name avatar rating location totalTrades phone bio');

    if (!item || item.status === 'removed') {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Increment view count
    item.views += 1;
    await item.save();

    res.json({ item });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ message: 'Server error while fetching item' });
  }
});

// Create new item
router.post('/', auth, upload.array('images', 5), handleUploadError, [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('category')
    .isIn(['Electronics', 'Plastic', 'Metal', 'Paper', 'Glass', 'Textile', 'Other'])
    .withMessage('Invalid category'),
  body('condition')
    .isIn(['excellent', 'good', 'fair', 'poor'])
    .withMessage('Invalid condition'),
  body('location.address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('location.coordinates').optional().isArray({ min: 2, max: 2 }).withMessage('Coordinates must be an array [lng, lat]'),
  body('location.city').optional().isString().isLength({ max: 100 }),
  body('location.state').optional().isString().isLength({ max: 100 }),
  body('location.zipCode').optional().isString().isLength({ max: 20 }),
  body('weight.value').optional().isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
  body('weight.unit').optional().isIn(['kg', 'lbs', 'g', 'oz']),
  body('dimensions.length').optional().isFloat({ min: 0 }).withMessage('Length must be a positive number'),
  body('dimensions.width').optional().isFloat({ min: 0 }).withMessage('Width must be a positive number'),
  body('dimensions.height').optional().isFloat({ min: 0 }).withMessage('Height must be a positive number'),
  body('dimensions.unit').optional().isIn(['cm', 'in', 'm', 'ft']),
  body('tags').optional().custom((value) => {
    if (Array.isArray(value)) return true;
    if (typeof value === 'string') return true;
    throw new Error('Tags must be an array or comma-separated string');
  }),
  body('price.amount').optional().isFloat({ min: 0 }),
  body('price.currency').optional().isString().isLength({ min: 2, max: 5 }),
  body('price.type').optional().isIn(['free', 'trade', 'sell'])
], async (req, res) => {
  try {
    // Log the full request body and files for debugging
    console.log('FULL REQ.BODY:', req.body);
    console.log('REQ.FILES:', req.files);
    // Remove location from destructuring
    let { title, description, category, condition, weight, dimensions, tags, price } = req.body;

    // Try to get coordinates from either the nested object or flat fields
    let coords = [];
    if (req.body.location && req.body.location.coordinates) {
      coords = req.body.location.coordinates.map(Number).filter((v) => !isNaN(v));
    } else {
      let flatCoords = req.body['location.coordinates[]'];
      if (typeof flatCoords === 'string') flatCoords = [flatCoords];
      if (Array.isArray(flatCoords) && flatCoords.length > 2) flatCoords = flatCoords.slice(0, 2);
      coords = (flatCoords || []).map(Number).filter((v) => !isNaN(v));
    }
    console.log('RAW COORDS:', req.body.location ? req.body.location.coordinates : req.body['location.coordinates[]']);
    console.log('PARSED COORDS:', coords);

    const location = req.body.location && req.body.location.address
      ? {
          address: req.body.location.address,
          coordinates: coords,
          city: req.body.location.city,
          state: req.body.location.state,
          zipCode: req.body.location.zipCode
        }
      : {
          address: req.body['location.address'],
          coordinates: coords,
          city: req.body['location.city'],
          state: req.body['location.state'],
          zipCode: req.body['location.zipCode']
        };
    console.log('PARSED LOCATION:', location);

    // Validate coordinates strictly
    if (
      !location ||
      !Array.isArray(location.coordinates) ||
      location.coordinates.length !== 2 ||
      location.coordinates.some(
        (c) => typeof c !== "number" || isNaN(c) || c === null || c === undefined
      ) ||
      (location.coordinates[0] === 0 && location.coordinates[1] === 0)
    ) {
      return res.status(400).json({ message: "Invalid coordinates: must be two valid numbers [lng, lat] and not [0,0]." });
    }

    // Process uploaded images
    const images = req.files ? req.files.map(file => ({
      url: file.path,
      publicId: file.filename
    })) : [{
      url: 'https://images.pexels.com/photos/4246119/pexels-photo-4246119.jpeg?auto=compress&cs=tinysrgb&w=400',
      publicId: 'default'
    }];

    // Process tags
    const processedTags = tags ? 
      (Array.isArray(tags) ? tags : tags.split(','))
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0)
      : [];

    const item = new Item({
      title,
      description,
      category,
      condition,
      images,
      location, // use the original location
      user: req.user._id,
      weight: weight ? {
        value: parseFloat(weight.value),
        unit: weight.unit || 'kg'
      } : undefined,
      dimensions: dimensions ? {
        length: parseFloat(dimensions.length),
        width: parseFloat(dimensions.width),
        height: parseFloat(dimensions.height),
        unit: dimensions.unit || 'cm'
      } : undefined,
      tags: processedTags,
      price: price ? {
        amount: parseFloat(price.amount) || 0,
        currency: price.currency || 'USD',
        type: price.type || 'free'
      } : undefined
    });

    await item.save();
    await item.populate('user', 'name avatar rating location totalTrades');

    res.status(201).json({
      message: 'Item created successfully',
      item
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ message: 'Server error while creating item' });
  }
});

// Update item
router.put('/:id', auth, upload.array('images', 5), handleUploadError, [
  param('id').isMongoId().withMessage('Invalid item ID'),
  body('title').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('category').optional().isIn(['Electronics', 'Plastic', 'Metal', 'Paper', 'Glass', 'Textile', 'Other']).withMessage('Invalid category'),
  body('condition').optional().isIn(['excellent', 'good', 'fair', 'poor']).withMessage('Invalid condition'),
  body('location.address').optional().trim().isLength({ min: 5, max: 200 }),
  body('location.coordinates').optional().isArray({ min: 2, max: 2 }),
  body('location.city').optional().isString().isLength({ max: 100 }),
  body('location.state').optional().isString().isLength({ max: 100 }),
  body('location.zipCode').optional().isString().isLength({ max: 20 }),
  body('weight.value').optional().isFloat({ min: 0 }),
  body('weight.unit').optional().isIn(['kg', 'lbs', 'g', 'oz']),
  body('dimensions.length').optional().isFloat({ min: 0 }),
  body('dimensions.width').optional().isFloat({ min: 0 }),
  body('dimensions.height').optional().isFloat({ min: 0 }),
  body('dimensions.unit').optional().isIn(['cm', 'in', 'm', 'ft']),
  body('tags').optional().custom((value) => {
    if (Array.isArray(value)) return true;
    if (typeof value === 'string') return true;
    throw new Error('Tags must be an array or comma-separated string');
  }),
  body('price.amount').optional().isFloat({ min: 0 }),
  body('price.currency').optional().isString().isLength({ min: 2, max: 5 }),
  body('price.type').optional().isIn(['free', 'trade', 'sell'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item || item.status === 'removed') {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check ownership
    let itemUserId = item.user;
    if (item.user && typeof item.user === 'object' && item.user._id) {
      itemUserId = item.user._id;
    }
    if (itemUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }

    // Prepare updates
    const allowedUpdates = ['title', 'description', 'category', 'condition', 'location', 'weight', 'dimensions', 'tags', 'price', 'status'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Handle new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: file.path,
        publicId: file.filename
      }));
      updates.images = [...item.images, ...newImages];
    }

    // Process tags if provided
    if (updates.tags) {
      updates.tags = (Array.isArray(updates.tags) ? updates.tags : updates.tags.split(','))
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('user', 'name avatar rating location totalTrades');

    res.json({
      message: 'Item updated successfully',
      item: updatedItem
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ message: 'Server error while updating item' });
  }
});

// Delete item (soft delete)
router.delete('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid item ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item || item.status === 'removed') {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check ownership for delete
    let itemUserId = item.user;
    if (item.user && typeof item.user === 'object' && item.user._id) {
      itemUserId = item.user._id;
    }
    if (itemUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }

    item.status = 'removed';
    await item.save();

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ message: 'Server error while deleting item' });
  }
});

// Toggle favorite
router.post('/:id/favorite', auth, [
  param('id').isMongoId().withMessage('Invalid item ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item || item.status === 'removed') {
      return res.status(404).json({ message: 'Item not found' });
    }

    const userId = req.user._id;
    const isFavorited = item.favorites.includes(userId);

    if (isFavorited) {
      item.favorites.pull(userId);
    } else {
      item.favorites.push(userId);
    }

    await item.save();

    res.json({
      message: isFavorited ? 'Removed from favorites' : 'Added to favorites',
      isFavorited: !isFavorited
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ message: 'Server error while toggling favorite' });
  }
});

// Create a trade request
router.post('/:id/request', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item || item.status !== 'available') {
      return res.status(400).json({ message: 'Item not available for trade.' });
    }
    if (item.user.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot request your own item.' });
    }
    // Prevent duplicate requests
    const existing = await TradeRequest.findOne({ item: item._id, recipient: req.user._id, status: { $in: ['pending', 'accepted'] } });
    if (existing) {
      return res.status(400).json({ message: 'You have already requested this item.' });
    }
    const tradeRequest = new TradeRequest({
      item: item._id,
      owner: item.user,
      recipient: req.user._id,
      message: req.body.message || ''
    });
    await tradeRequest.save();
    const { io } = require('../index');
    if (typeof io?.to === 'function') {
      io.to(item.user.toString()).emit('notification:trade_request', {
        type: 'trade_request',
        itemId: item._id,
        itemTitle: item.title,
        fromUserId: req.user._id,
        message: req.body.message || ''
      });
    }
    res.json({ message: 'Trade request sent.' });
  } catch (error) {
    console.error('Trade request error:', error);
    res.status(500).json({ message: 'Server error creating trade request.' });
  }
});

// Accept or decline a trade request
router.patch('/trade-requests/:requestId', auth, async (req, res) => {
  try {
    const tradeRequest = await TradeRequest.findById(req.params.requestId).populate('item');
    if (!tradeRequest) return res.status(404).json({ message: 'Trade request not found.' });
    if (tradeRequest.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (req.body.status === 'accepted') {
      tradeRequest.status = 'accepted';
      tradeRequest.item.status = 'pending';
      await tradeRequest.item.save();
    } else if (req.body.status === 'declined') {
      tradeRequest.status = 'declined';
    }
    await tradeRequest.save();
    const { io } = require('../index');
    io.to(tradeRequest.recipient.toString()).emit('notification:trade_request_status', {
      type: 'trade_request_status',
      status: tradeRequest.status,
      itemId: tradeRequest.item._id,
      itemTitle: tradeRequest.item.title
    });
    res.json({ message: `Trade request ${req.body.status}.` });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating trade request.' });
  }
});

// Mark trade as completed
router.patch('/trade-requests/:requestId/complete', auth, async (req, res) => {
  try {
    const tradeRequest = await TradeRequest.findById(req.params.requestId).populate('item');
    if (!tradeRequest) return res.status(404).json({ message: 'Trade request not found.' });
    if (![tradeRequest.owner.toString(), tradeRequest.recipient.toString()].includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    tradeRequest.status = 'completed';
    tradeRequest.completedAt = new Date();
    tradeRequest.item.status = 'traded';
    await tradeRequest.item.save();
    await tradeRequest.save();
    const { io } = require('../index');
    io.to(tradeRequest.owner.toString()).emit('notification:trade_completed', {
      type: 'trade_completed',
      itemId: tradeRequest.item._id,
      itemTitle: tradeRequest.item.title
    });
    io.to(tradeRequest.recipient.toString()).emit('notification:trade_completed', {
      type: 'trade_completed',
      itemId: tradeRequest.item._id,
      itemTitle: tradeRequest.item.title
    });
    res.json({ message: 'Trade marked as completed.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error completing trade.' });
  }
});

// Rate a completed trade (now requires tradeRequestId)
router.post('/trade-requests/:requestId/rate', auth, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('review').optional().isString().isLength({ max: 1000 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  try {
    const tradeRequest = await TradeRequest.findById(req.params.requestId);
    if (!tradeRequest || tradeRequest.status !== 'completed') {
      return res.status(400).json({ message: 'Trade must be completed before rating.' });
    }
    // Only owner or recipient can rate, and only rate the other
    let ratedUser;
    if (tradeRequest.owner.toString() === req.user._id.toString()) {
      ratedUser = tradeRequest.recipient;
    } else if (tradeRequest.recipient.toString() === req.user._id.toString()) {
      ratedUser = tradeRequest.owner;
    } else {
      return res.status(403).json({ message: 'Not authorized to rate this trade.' });
    }
    // Prevent duplicate ratings
    const existing = await TradeRating.findOne({ trade: tradeRequest._id, rater: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already rated this trade.' });
    }
    // Create rating
    const tradeRating = new TradeRating({
      trade: tradeRequest._id,
      rater: req.user._id,
      rated: ratedUser,
      rating: req.body.rating,
      review: req.body.review
    });
    await tradeRating.save();
    // Update rated user's average rating and totalTrades
    const ratings = await TradeRating.find({ rated: ratedUser });
    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    const User = require('../models/User');
    await User.findByIdAndUpdate(ratedUser, {
      rating: avgRating,
      totalTrades: ratings.length
    });
    res.json({ message: 'Trade rated successfully.' });
  } catch (error) {
    console.error('Trade rating error:', error);
    res.status(500).json({ message: 'Server error while rating trade.' });
  }
});

// Get user's items
router.get('/user/:userId', [
  param('userId').isMongoId().withMessage('Invalid user ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = { 
      user: req.params.userId,
      status: { $ne: 'removed' }
    };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const items = await Item.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name avatar rating location totalTrades');

    const total = await Item.countDocuments(filter);

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user items error:', error);
    res.status(500).json({ message: 'Server error while fetching user items' });
  }
});

module.exports = router;