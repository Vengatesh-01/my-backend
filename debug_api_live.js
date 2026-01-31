const axios = require('axios');

async function checkApi() {
    try {
        console.log("Fetching /api/reels?random=true...");
        const res = await axios.get('http://localhost:5000/api/reels?random=true');
        const reels = res.data;
        console.log(`Fetched ${reels.length} reels.`);

        if (reels.length > 0) {
            console.log("First Reel ID:", reels[0]._id);
            console.log("First Reel User:", JSON.stringify(reels[0].user, null, 2));

            const validCount = reels.filter(r => r.user && r.user.username).length;
            console.log(`Reels with valid User object: ${validCount} / ${reels.length}`);
        }
    } catch (err) {
        console.error("Fetch failed:", err.message);
    }
}

checkApi();
