const axios = require('axios');
const path = require('path');
require('dotenv').config();

const MISSING = ['Sun Music', 'Sony Music South'];

async function resolveIds() {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return;

    for (const query of MISSING) {
        try {
            const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                params: {
                    part: 'snippet',
                    q: query,
                    type: 'channel',
                    maxResults: 1,
                    key: apiKey
                }
            });

            if (res.data.items && res.data.items.length > 0) {
                const item = res.data.items[0];
                console.log(`✅ Resolved: ${query} -> ${item.snippet.channelId} (${item.snippet.title})`);
            } else {
                console.log(`❌ Failed: ${query}`);
            }
        } catch (err) {
            console.error(`Error resolving ${query}:`, err.message);
        }
    }
}

resolveIds();
