const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const User = require('../models/User');
const Item = require('../models/Item');
const TradeRating = require('../models/TradeRating');
const TradeRequest = require('../models/TradeRequest');
const { auth, adminAuth } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// Get global environmental impact stats
router.get('/impact-stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalItems = await Item.countDocuments({ status: { $ne: 'removed' } });
    const totalTrades = await require('../models/TradeRequest').countDocuments({ status: 'completed' });
    // Optionally estimate waste diverted (e.g., 1 item = 1kg)
    const estimatedWasteKg = totalTrades; // Placeholder: 1 trade = 1kg
    res.json({
      totalUsers,
      totalItems,
      totalTrades,
      estimatedWasteKg
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching impact stats' });
  }
});

// Get user profile
router.get('/:id', [param('id').isMongoId().withMessage('Invalid user ID')], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const user = await User.findById(req.params.id).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's public stats
    const itemsCount = await Item.countDocuments({ 
      user: user._id, 
      status: { $ne: 'removed' } 
    });
    
    const completedTrades = 0; // Trade requests removed

    const userProfile = {
      id: user._id,
      name: user.name,
      avatar: user.avatar,
      location: user.location,
      bio: user.bio,
      rating: user.rating,
      totalTrades: completedTrades,
      itemsListed: itemsCount,
      joinedDate: user.createdAt,
      isVerified: user.isVerified,
      // Only show contact info if user allows it
      email: user.preferences?.privacy?.showEmail ? user.email : undefined,
      phone: user.preferences?.privacy?.showPhone ? user.phone : undefined
    };

    res.json({ user: userProfile });
  } catch (error) {
    console.error('Get user profile error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    res.status(500).json({ message: 'Server error while fetching user profile' });
  }
});

// Get all trade requests for a user (as owner or recipient)
router.get('/:id/trade-requests', [param('id').isMongoId().withMessage('Invalid user ID')], auth, async (req, res) => {
  try {
    const userId = req.params.id;
    // Only allow users to fetch their own trade requests, or admins
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const tradeRequests = await TradeRequest.find({
      $or: [{ owner: userId }, { recipient: userId }]
    })
      .populate('item')
      .populate('owner', 'name avatar email')
      .populate('recipient', 'name avatar email')
      .sort({ createdAt: -1 });
    res.json({ tradeRequests });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching trade requests' });
  }
});

// Get all users (admin only)
router.get('/', adminAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isLength({ max: 100 }).withMessage('Search term too long'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  query('role').optional().isIn(['user', 'admin']).withMessage('Invalid role')
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
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    if (req.query.status) {
      filter.isActive = req.query.status === 'active';
    }
    
    if (req.query.role) {
      filter.role = req.query.role;
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    // Add stats for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const itemsCount = await Item.countDocuments({ 
        user: user._id, 
        status: { $ne: 'removed' } 
      });
      
      const completedTrades = 0; // Trade requests removed

      return {
        ...user.toObject(),
        stats: {
          itemsListed: itemsCount,
          completedTrades
        }
      };
    }));

    res.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// Get all reviews for a user
router.get('/:id/reviews', [param('id').isMongoId().withMessage('Invalid user ID')], async (req, res) => {
  try {
    const ratings = await TradeRating.find({ rated: req.params.id })
      .populate('rater', 'name');
    const reviews = ratings.map(r => ({
      rating: r.rating,
      review: r.review,
      createdAt: r.createdAt,
      raterName: r.rater && r.rater.name ? r.rater.name : 'Anonymous',
    }));
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching reviews' });
  }
});

// Update user status (admin only)
router.patch('/:id/status', [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `User ${req.body.isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    res.status(500).json({ message: 'Server error while updating user status' });
  }
});

// Get user statistics (admin only)
router.get('/stats/overview', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setDate(1)) }
    });

    const totalItems = await Item.countDocuments({ status: { $ne: 'removed' } });
    const activeItems = await Item.countDocuments({ status: 'available' });
    
    const totalTrades = 0; // Trade requests removed
    const completedTrades = 0; // Trade requests removed
    const pendingTrades = 0; // Trade requests removed

    // User growth over last 12 months
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Category distribution
    const categoryStats = await Item.aggregate([
      { $match: { status: { $ne: 'removed' } } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth
      },
      items: {
        total: totalItems,
        active: activeItems
      },
      trades: {
        total: totalTrades,
        completed: completedTrades,
        pending: pendingTrades
      },
      userGrowth,
      categoryStats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

// Contact user via email
router.post('/contact-user', async (req, res) => {
  const { toEmail, subject, message, fromEmail } = req.body;
  if (!toEmail || !subject || !message) return res.status(400).json({ message: 'All fields required' });
  try {
    await sendEmail({
      to: toEmail,
      subject,
      text: `${message}

${fromEmail ? 'Reply to: ' + fromEmail : ''}`,
      html: `<p>${message.replace(/\n/g, '<br>')}</p>${fromEmail ? `<p>Reply to: <a href='mailto:${fromEmail}'>${fromEmail}</a></p>` : ''}`
    });
    res.json({ message: 'Email sent successfully' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to send email' });
  }
});

module.exports = router;