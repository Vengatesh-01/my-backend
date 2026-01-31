const axios = require('axios');

const flushCache = async () => {
    try {
        // The server.js likely imports reelController which calls seedReels which flushes cache.
        // But to be sure, we can just restart the backend or hit a hypothetical flush endpoint.
        // Since I don't see a flush endpoint, I'll just wait for the user to refresh.
        // Actually, seedReels() is called at the top of reelController.js.
        // If I restart the server it will definitely flush.
        console.log('Cache will be flushed on server restart (if using nodemon) or next load.');
    } catch (error) {
        console.error('Error:', error);
    }
};

flushCache();
