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
console.log("Initializing Express app...");


const app = express();
app.set('trust proxy', 1); // Trust Ngrok proxy
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});
console.log("Socket.io initialized.");

// 1. Public health check (No CORS needed, but we'll allow it)
app.get('/api/health', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.json({ status: 'ok', timestamp: new Date().toISOString(), message: 'Server is healthy' });
});

// 2. Global Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// 3. Simple, permissive CORS for all other routes
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'ngrok-skip-browser-warning', 'bypass-tunnel-reminder'],
    credentials: false
}));

app.use(express.json());

// Explicit handle for Preflight requests
app.options('*', cors());

const { seedReels } = require('./controllers/reelController');
console.log("ReelController required.");

// Database Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform';
console.log('Connecting to MongoDB:', mongoURI.split('@')[1] || mongoURI); // Log host only for safety

mongoose.connect(mongoURI)
    .then(() => {
        console.log('✅ MongoDB Connected Successfully');
        // Initialize Cron Jobs
        initCronJobs();
        // Run initial seed in background
        seedReels().catch(err => console.error('❌ Background Seeding Error:', err));
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
    });

mongoose.connection.on('error', err => {
    console.error('❌ Mongoose default connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ Mongoose default connection disconnected');
});

// Global Rate Limiting - MOVED BELOW CORS and Health Check
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    message: 'Too many requests'
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
console.log("All routes registered.");

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Global Error:', err);
    if (err.name === 'MulterError') {
        return res.status(400).json({ message: 'File upload error', error: err.message });
    }
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});


// Serve static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Gaming Hub - More robust path resolution for deployment
let gamingHubPath;
const possiblePaths = [
    path.resolve(__dirname, 'GamingHub'),
    path.resolve(__dirname, '..', 'GamingHub'),
    path.resolve(process.cwd(), 'GamingHub')
];

for (const p of possiblePaths) {
    if (require('fs').existsSync(path.join(p, 'index.html'))) {
        gamingHubPath = p;
        break;
    }
}

if (!gamingHubPath) {
    console.error("CRITICAL: Gaming Hub directory not found in known locations!");
    // Default to a safe fallback to prevent crash, though gaming won't work
    gamingHubPath = path.resolve(__dirname, 'GamingHub');
}
console.log("Serving Gaming Hub from:", gamingHubPath);
app.use('/gaming-hub', express.static(gamingHubPath));

// Serve Frontend static files
const frontendPath = path.resolve(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendPath));

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

// 404 Handler & SPA Catch-all
console.log("Registering 404 handler...");
app.get(/.*/, (req, res) => {
    // If it's an API request that wasn't handled, return 404
    if (req.path.startsWith('/api')) {
        res.set('Access-Control-Allow-Origin', '*');
        return res.status(404).json({
            message: `Route ${req.method} ${req.originalUrl} not found`,
            path: req.path,
            method: req.method
        });
    }
    // Otherwise, serve the frontend index.html
    const indexPath = path.join(frontendPath, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error sending index.html:', err);
            res.status(500).send('Error loading the app UI. Please ensure the frontend is built.');
        }
    });
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
