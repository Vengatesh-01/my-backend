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

console.log("GEMINI_API_KEY loaded:", !!process.env.GEMINI_API_KEY);


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


// Serve static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Gaming Hub - More explicit path resolution
const gamingHubPath = path.resolve(__dirname, '..', 'GamingHub');
app.use('/gaming-hub', express.static(gamingHubPath));

// Explicit route for the main index.html to avoid 404s in some browser/express versions
app.get('/gaming-hub', (req, res) => {
    res.sendFile(path.join(gamingHubPath, 'index.html'));
});
app.get('/gaming-hub/', (req, res) => {
    res.sendFile(path.join(gamingHubPath, 'index.html'));
});

// Game State Management (In-Memory) for GamingHub
const gamingRooms = {};
const matchQueue = {
    chess: [],
    'car-racing': [],
    'bike-racing': [],
    'truck-racing': [],
    'carrom': []
};

// Basic Route
app.get('/', (req, res) => {
    res.send('Social Media Platform API is running');
});

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

// Socket IO Connection logic
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join', (userId) => {
        socket.join(userId);
        socket.userId = userId;
        console.log(`User ${userId} joined their notification room`);
        socket.broadcast.emit('user-status', { userId, status: 'online' });
    });

    socket.on('join-conversation', (conversationId) => {
        socket.join(conversationId);
        console.log(`Socket ${socket.id} joined conversation room ${conversationId}`);
    });

    socket.on('leave-conversation', (conversationId) => {
        socket.leave(conversationId);
        console.log(`Socket ${socket.id} left conversation room ${conversationId}`);
    });

    socket.on('typing', ({ conversationId, receiverId, senderName, isGroup }) => {
        if (isGroup) {
            socket.to(conversationId).emit('typing', { conversationId, senderName });
        } else {
            socket.to(receiverId).emit('typing', { conversationId, senderName });
        }
    });

    socket.on('stop-typing', ({ conversationId, receiverId, isGroup }) => {
        if (isGroup) {
            socket.to(conversationId).emit('stop-typing', { conversationId });
        } else {
            socket.to(receiverId).emit('stop-typing', { conversationId });
        }
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

            await Conversation.findByIdAndUpdate(messageData.conversationId, {
                lastMessage: message._id
            });

            const populatedMessage = {
                ...message.toObject(),
                conversationId: messageData.conversationId
            };

            // Emit to the conversation room
            io.to(messageData.conversationId).emit('new-message', populatedMessage);

            // Also emit to all participants' notification rooms in case they aren't in the conversation room
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
        } catch (err) {
            console.error('Error sending message:', err);
            socket.emit('message-error', { error: 'Failed to send message' });
        }
    });

    socket.on('mark-seen', async ({ messageId, senderId }) => {
        try {
            const Message = require('./models/Message');
            await Message.findByIdAndUpdate(messageId, { status: 'seen' });
            socket.to(senderId).emit('message-seen', { messageId });
        } catch (err) {
            console.error('Error marking message seen:', err);
        }
    });

    // --- GamingHub Socket Logic ---
    socket.on('join-room', ({ gameType, playerName }) => {
        let roomId;
        const queue = matchQueue[gameType];

        if (queue && queue.length > 0) {
            roomId = queue.shift();
            socket.join(roomId);
        } else {
            roomId = crypto.randomUUID();
            matchQueue[gameType].push(roomId);
            socket.join(roomId);
        }

        if (!gamingRooms[roomId]) {
            gamingRooms[roomId] = {
                players: [],
                gameType: gameType,
                createdAt: Date.now()
            };
        }

        const player = {
            id: socket.id,
            name: playerName || `Player ${socket.id.substr(0, 4)}`,
            role: gamingRooms[roomId].players.length === 0 ? 'white' :
                gamingRooms[roomId].players.length === 1 ? 'black' : 'spectator'
        };

        gamingRooms[roomId].players.push(player);

        io.to(roomId).emit('room-update', {
            players: gamingRooms[roomId].players,
            gameType: gamingRooms[roomId].gameType,
            roomId: roomId
        });

        socket.emit('role-assignment', { role: player.role });
        console.log(`Gaming: Socket ${socket.id} matched into ${roomId} as ${player.role}`);
    });

    socket.on('chess-move', ({ roomId, move, fen, timeData }) => {
        socket.to(roomId).emit('chess-move', { move, fen, timeData });
    });

    socket.on('chess-game-over', ({ roomId, result }) => {
        io.to(roomId).emit('chess-game-over', result);
    });

    socket.on('racing-update', ({ roomId, position, score }) => {
        socket.to(roomId).emit('racing-update', { id: socket.id, position, score });
    });

    socket.on('carrom-move', ({ roomId, pocketData }) => {
        socket.to(roomId).emit('carrom-move', pocketData);
    });

    socket.on('disconnect', () => {
        // Cleanup notification status
        if (socket.userId) {
            socket.broadcast.emit('user-status', { userId: socket.userId, status: 'offline' });
        }

        // Cleanup gaming queues
        for (const type in matchQueue) {
            matchQueue[type] = matchQueue[type].filter(id => {
                const room = gamingRooms[id];
                return room && room.players.some(p => p.id === socket.id) ? false : true;
            });
        }

        // Cleanup gaming rooms
        for (const roomId in gamingRooms) {
            const playerIndex = gamingRooms[roomId].players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                const player = gamingRooms[roomId].players[playerIndex];
                gamingRooms[roomId].players.splice(playerIndex, 1);

                if (gamingRooms[roomId].players.length === 0) {
                    delete gamingRooms[roomId];
                } else {
                    io.to(roomId).emit('player-disconnected', {
                        id: socket.id,
                        name: player.name
                    });
                    io.to(roomId).emit('room-update', {
                        players: gamingRooms[roomId].players
                    });
                }
            }
        }
        console.log('Client disconnected:', socket.id);
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
