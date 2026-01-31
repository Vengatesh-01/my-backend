const axios = require('axios');

async function debugExplore() {
    try {
        console.log("Fetching Posts...");
        const postsRes = await axios.get('http://localhost:5000/api/posts');
        const posts = postsRes.data;
        console.log(`Fetched ${posts.length} posts.`);

        const invalidPosts = posts.filter(p => !p.user);
        if (invalidPosts.length > 0) {
            console.error(`FOUND ${invalidPosts.length} POSTS WITH NULL USER!`);
            console.log("IDs:", invalidPosts.map(p => p._id));
        } else {
            console.log("All posts have valid users.");
        }

        console.log("\nFetching Reels...");
        const reelsRes = await axios.get('http://localhost:5000/api/reels?random=true');
        const reels = reelsRes.data;
        console.log(`Fetched ${reels.length} reels.`);

        const invalidReels = reels.filter(r => !r.user);
        if (invalidReels.length > 0) {
            console.error(`FOUND ${invalidReels.length} REELS WITH NULL USER!`);
            console.log("IDs:", invalidReels.map(r => r._id));
        } else {
            console.log("All reels have valid users.");
        }

    } catch (error) {
        console.error("API Fetch Failed:", error.message);
        if (error.response) console.error("Status:", error.response.status);
    }
}

debugExplore();
