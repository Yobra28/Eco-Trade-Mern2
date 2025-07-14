const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get online users (for chat participants)
router.get('/online-users', auth, async (req, res) => {
  try {
    // Get the online users from the utility
    const onlineUsersUtil = require('../utils/onlineUsers');
    const onlineUserIds = onlineUsersUtil.getOnlineUsers();

    res.json({ 
      onlineUsers: onlineUserIds,
      count: onlineUserIds.length
    });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({ message: 'Server error while fetching online users' });
  }
});

// Get user's chats
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
      isActive: true
    })
    .populate([
      {
        path: 'participants',
        select: 'name avatar isActive',
        match: { _id: { $ne: req.user._id } }
      },
      {
        path: 'lastMessage',
        select: 'content createdAt messageType'
      }
    ])
    .sort({ updatedAt: -1 });

    // Add unread count for each chat
    const chatsWithUnread = await Promise.all(chats.map(async (chat) => {
      const unreadCount = await Message.countDocuments({
        chat: chat._id,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id }
      });

      return {
        ...chat.toObject(),
        unreadCount,
        otherParticipant: chat.participants[0] // Since we filtered out current user
      };
    }));

    res.json({ chats: chatsWithUnread });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Server error while fetching chats' });
  }
});

// Get chat messages
router.get('/:chatId/messages', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify user is participant in this chat
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or access denied' });
    }

    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({ chat: req.params.chatId });

    // Mark messages as read
    await Message.updateMany(
      {
        chat: req.params.chatId,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id }
      },
      {
        $push: {
          readBy: {
            user: req.user._id,
            readAt: new Date()
          }
        }
      }
    );

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }
    res.status(500).json({ message: 'Server error while fetching messages' });
  }
});

// Send message
router.post('/:chatId/messages', [
  param('chatId').isMongoId().withMessage('Invalid chat ID'),
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Message content must be between 1 and 1000 characters'),
  body('messageType').optional().isIn(['text', 'image', 'file']).withMessage('Invalid message type')
], auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { content, messageType, attachments } = req.body;

    // Verify user is participant in this chat
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or access denied' });
    }

    const message = new Message({
      chat: req.params.chatId,
      sender: req.user._id,
      content,
      messageType: messageType || 'text',
      attachments: attachments || [],
      readBy: [{
        user: req.user._id,
        readAt: new Date()
      }]
    });

    await message.save();
    await message.populate('sender', 'name avatar');

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }
    res.status(500).json({ message: 'Server error while sending message' });
  }
});

// Create or get chat between two users
router.post('/create', [
  body('participantId').isMongoId().withMessage('Invalid participant ID')
], auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { participantId } = req.body;

    if (participantId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot create chat with yourself' });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, participantId] }
    }).populate([
      {
        path: 'participants',
        select: 'name avatar isActive'
      },
      {
        path: 'lastMessage',
        select: 'content createdAt messageType'
      }
    ]);

    if (!chat) {
      // Create new chat
      chat = new Chat({
        participants: [req.user._id, participantId]
      });
      await chat.save();
      await chat.populate([
        {
          path: 'participants',
          select: 'name avatar isActive'
        }
      ]);
    }

    res.json({
      message: 'Chat created/retrieved successfully',
      chat
    });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ message: 'Server error while creating chat' });
  }
});

// Mark chat as read
router.patch('/:chatId/read', auth, async (req, res) => {
  try {
    // Verify user is participant in this chat
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or access denied' });
    }

    // Mark all unread messages as read
    await Message.updateMany(
      {
        chat: req.params.chatId,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id }
      },
      {
        $push: {
          readBy: {
            user: req.user._id,
            readAt: new Date()
          }
        }
      }
    );

    res.json({ message: 'Chat marked as read' });
  } catch (error) {
    console.error('Mark chat as read error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }
    res.status(500).json({ message: 'Server error while marking chat as read' });
  }
});

module.exports = router;