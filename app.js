const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const crypto = require('crypto');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const { initCronJobs } = require('./jobs/reelSync');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// DEBUG ALL ROUTES
app.get("/debug-all-routes", (req, res) => {
  const routes = [];

  function parseStack(stack) {
    stack.forEach(function (r) {
      if (r.route) {
        Object.keys(r.route.methods).forEach(method => {
          routes.push({
            path: r.route.path,
            method: method.toUpperCase()
          });
        });
      } else if (r.name === 'router' && r.handle && r.handle.stack) {
        parseStack(r.handle.stack);
      }
    });
  }

  if (app._router && app._router.stack) {
    parseStack(app._router.stack);
  }

  res.json({
    status: "Reelio Backend Live",
    totalRoutes: routes.length,
    routes: routes,
    timestamp: new Date().toISOString()
  });
});

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform', {
})
  .then(() => {
    console.log('MongoDB Connected');
    // Initialize Cron Jobs
    initCronJobs();
  })
  .catch(err => console.error('MongoDB Connection Error:', err));

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for development
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

// Global Socket IO instance
global.io = io;

// Routes
console.log("=== LOADING ROUTES ===");
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/stories', require('./routes/storyRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/reels', require('./routes/reelRoutes'));
app.use('/api/explore', require('./routes/exploreRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/admin/owner', require('./routes/ownerRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// Add the debug reels.js logic briefly for /api/reels-debug if needed, 
// but reelRoutes.js should cover main functionality.
try {
  const reelsLegacyRoute = require("./routes/reels");
  app.use("/api/reels-test", reelsLegacyRoute);
  console.log("✓ Legacy reels test route loaded at /api/reels-test");
} catch (e) {
  console.warn("Legacy reels route not loaded, using reelRoutes.js");
}

// Serve static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Gaming Hub
const gamingHubPath = path.resolve(__dirname, '..', 'GamingHub');
app.use('/gaming-hub', express.static(gamingHubPath));
app.get('/gaming-hub', (req, res) => {
  res.sendFile(path.join(gamingHubPath, 'index.html'));
});

// Basic Route
app.get('/', (req, res) => {
  res.send('Reelio Backend Live');
});

// Socket IO Connection logic
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    socket.userId = userId;
    socket.broadcast.emit('user-status', { userId, status: 'online' });
  });

  socket.on('join-conversation', (conversationId) => {
    socket.join(conversationId);
  });

  socket.on('send-message', async (messageData) => {
    try {
      const Message = require('./models/Message');
      const Conversation = require('./models/Conversation');
      const message = new Message({
        conversationId: messageData.conversationId,
        sender: messageData.sender,
        text: messageData.text,
        media: messageData.media,
        replyTo: messageData.replyTo,
        vanishMode: messageData.vanishMode
      });
      await message.save();
      await message.populate('sender', 'username profilePic');
      await Conversation.findByIdAndUpdate(messageData.conversationId, { lastMessage: message._id });
      const populatedMessage = { ...message.toObject(), conversationId: messageData.conversationId };
      io.to(messageData.conversationId).emit('new-message', populatedMessage);
      const conversation = await Conversation.findById(messageData.conversationId);
      if (conversation) {
        conversation.participants.forEach(participantId => {
          const pIdStr = participantId.toString();
          if (pIdStr !== messageData.sender.toString()) {
            io.to(pIdStr).emit('new-message-notification', {
              conversationId: messageData.conversationId,
              message: populatedMessage
            });
          }
        });
      }
      socket.emit('message-sent', populatedMessage);
    } catch (err) { console.error(err); }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      socket.broadcast.emit('user-status', { userId: socket.userId, status: 'offline' });
    }
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});