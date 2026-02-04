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
app.set('trust proxy', 1);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});
console.log("Socket.io initialized.");

/* ================= HEALTH ================= */

const healthHandler = (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.json({ status: 'ok', timestamp: new Date().toISOString(), message: 'Server is healthy' });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.get('/', (req, res) => res.send('Reelio API is Running'));

/* ================= LOGGER ================= */

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

/* ================= CORS ================= */

app.use(cors({
    origin: '*',
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization','X-Requested-With','Accept','Origin'],
    credentials: false
}));

app.use(express.json());

app.options('*', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods','GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers','Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.sendStatus(204);
});

/* ================= DB ================= */

const { seedReels } = require('./controllers/reelController');
console.log("ReelController required.");

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform';
console.log('Connecting to MongoDB:', mongoURI.split('@')[1] || mongoURI);

mongoose.connect(mongoURI)
.then(()=>{
    console.log('✅ MongoDB Connected Successfully');
    initCronJobs();
    seedReels().catch(err => console.error('❌ Background Seeding Error:', err));
})
.catch(err=>{
    console.error('❌ MongoDB Connection Error:', err.message);
});

mongoose.connection.on('error', err=>{
    console.error('❌ Mongoose default connection error:', err);
});

mongoose.connection.on('disconnected', ()=>{
    console.log('⚠️ Mongoose default connection disconnected');
});

/* ================= RATE LIMIT ================= */

const limiter = rateLimit({
    windowMs: 15*60*1000,
    max: 1000,
    message: 'Too many requests'
});
app.use(limiter);

global.io = io;

/* ================= ROUTES ================= */

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

/* ================= ERROR HANDLER ================= */

app.use((err, req, res, next)=>{
    console.error('❌ Global Error:', err);
    if(err.name === 'MulterError'){
        return res.status(400).json({ message:'File upload error', error:err.message });
    }
    res.status(500).json({ message:'Internal Server Error', error:err.message });
});

/* ================= STATIC FILES ================= */

app.use('/uploads', express.static(path.join(__dirname,'uploads')));

/* ================= GAMING HUB ================= */

let gamingHubPath;
const possiblePaths = [
    path.resolve(__dirname,'GamingHub'),
    path.resolve(__dirname,'..','GamingHub'),
    path.resolve(process.cwd(),'GamingHub')
];

for(const p of possiblePaths){
    if(require('fs').existsSync(path.join(p,'index.html'))){
        gamingHubPath = p;
        break;
    }
}

if(!gamingHubPath){
    console.error("CRITICAL: Gaming Hub directory not found!");
    gamingHubPath = path.resolve(__dirname,'GamingHub');
}

console.log("Serving Gaming Hub from:", gamingHubPath);
app.use('/gaming-hub', express.static(gamingHubPath));

app.get('/gaming-hub',(req,res)=>{
    res.sendFile(path.join(gamingHubPath,'index.html'));
});
app.get('/gaming-hub/',(req,res)=>{
    res.sendFile(path.join(gamingHubPath,'index.html'));
});

/* ================= 404 API ONLY ================= */

console.log("Registering 404 handler...");
app.get(/.*/, (req,res)=>{
    if(req.path.startsWith('/api')){
        res.set('Access-Control-Allow-Origin','*');
        return res.status(404).json({
            message:`Route ${req.method} ${req.originalUrl} not found`,
            path:req.path,
            method:req.method
        });
    }
    res.set('Access-Control-Allow-Origin','*');
    res.status(200).send('Reelio API is Running');
});

/* ================= SOCKET.IO ================= */

io.on('connection',(socket)=>{
    console.log('Client connected:', socket.id);

    socket.on('join',(userId)=>{
        socket.join(userId);
        socket.userId = userId;
        socket.broadcast.emit('user-status',{ userId, status:'online' });
    });

    // 🔥 All your existing socket logic remains SAME
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 5000;
server.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
});

