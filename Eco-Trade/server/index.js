const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chat');
const onlineUsersUtil = require('./utils/onlineUsers');

const app = express();

// Security middleware
app.use(helmet());
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'https://eco-trade-mern2.vercel.app',
  'https://eco-trade-mern2.onrender.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100 // limit each IP to 100 requests per windowMs
// });
// app.use(limiter); // Disabled for development to prevent 429 errors

// Routes that need file upload (Multer must handle body parsing for these)
app.use('/api/items', itemRoutes);

// Body parsing middleware for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecotrade', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Socket.io setup for real-time chat
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const socketAuth = require('./middleware/socketAuth');

io.use(socketAuth);

// Export io for use in routes
module.exports.io = io;

io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);
  
  // Add user to online users
  onlineUsersUtil.addOnlineUser(socket.userId, socket.id);
  
  // Join user's personal room
  socket.join(socket.userId);
  
  // Broadcast user online status to all other users
  socket.broadcast.emit('user_online', {
    userId: socket.userId,
    userName: socket.userName || 'User'
  });
  
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
  });
  
  // Typing events
  socket.on('typing_start', async (data) => {
    try {
      if (!data.chatId || typeof data.chatId !== 'string' || data.chatId.length !== 24) {
        return;
      }

      const Chat = require('./models/Chat');
      const chat = await Chat.findById(data.chatId);
      if (!chat || !chat.participants.map(id => id.toString()).includes(socket.userId)) {
        return;
      }

      // Emit typing start to all participants except the sender
      socket.to(data.chatId).emit('typing_started', {
        chatId: data.chatId,
        userId: socket.userId,
        userName: socket.userName || 'User'
      });
    } catch (error) {
      console.error('Typing start error:', error);
    }
  });

  socket.on('typing_stop', async (data) => {
    try {
      if (!data.chatId || typeof data.chatId !== 'string' || data.chatId.length !== 24) {
        return;
      }

      const Chat = require('./models/Chat');
      const chat = await Chat.findById(data.chatId);
      if (!chat || !chat.participants.map(id => id.toString()).includes(socket.userId)) {
        return;
      }

      // Emit typing stop to all participants except the sender
      socket.to(data.chatId).emit('typing_stopped', {
        chatId: data.chatId,
        userId: socket.userId
      });
    } catch (error) {
      console.error('Typing stop error:', error);
    }
  });
  
  socket.on('send_message', async (data) => {
    try {
      // Defensive checks
      if (!data.chatId || typeof data.chatId !== 'string' || data.chatId.length !== 24) {
        socket.emit('error', { message: 'Invalid chat ID' });
        return;
      }
      if (!data.content || typeof data.content !== 'string' || !data.content.trim()) {
        socket.emit('error', { message: 'Message content cannot be empty' });
        return;
      }

      const Chat = require('./models/Chat');
      const chat = await Chat.findById(data.chatId);
      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }
      if (!chat.participants.map(id => id.toString()).includes(socket.userId)) {
        socket.emit('error', { message: 'Not a participant in this chat' });
        return;
      }

      const Message = require('./models/Message');
      const message = new Message({
        chat: data.chatId,
        sender: socket.userId,
        content: data.content,
        timestamp: new Date()
      });
      
      await message.save();
      await message.populate('sender', 'name avatar');
      
      io.to(data.chatId).emit('receive_message', message);

      // Emit notification to all other participants in the chat
      chat.participants.forEach((participantId) => {
        if (participantId.toString() !== socket.userId) {
          io.to(participantId.toString()).emit('notification:new_message', {
            chatId: data.chatId,
            message
          });
        }
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
    
    // Remove user from online users
    onlineUsersUtil.removeOnlineUser(socket.userId);
    
    // Broadcast user offline status to all other users
    socket.broadcast.emit('user_offline', {
      userId: socket.userId,
      userName: socket.userName || 'User'
    });
  });
});

module.exports = app;