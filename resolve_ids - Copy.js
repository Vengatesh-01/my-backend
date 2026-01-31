const axios = require('axios');
const path = require('path');
require('dotenv').config();

const HANDLES_OR_NAMES = [
    'Sun Music', 'Sony Music South', 'Sony Music India', 'T-Series',
    'Warner Music India', 'Netflix India', 'Amazon Prime Video India',
    'Universal Music Group', 'Atlantic Records', 'Republic Records',
    'VEVO', 'Divo Music', 'Noise and Grains', 'Yes Theory Shorts',
    'Dude Perfect', 'Ryan Trahan', 'MrBeast Shorts', 'Jubilee Shorts',
    'Zendaya', 'Kylie Jenner', 'Selena Gomez', 'Hailey Bieber',
    'Best Ever Food Review Show', 'Mark Wiens', 'Drew Binsky', 'Nas Daily'
];

async function resolveIds() {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        console.error('No API Key found');
        return;
    }

    const resolved = [];

    for (const query of HANDLES_OR_NAMES) {
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
                resolved.push({
                    name: query,
                    id: item.snippet.channelId,
                    searchQuery: query,
                    actualName: item.snippet.title
                });
                console.log(`✅ Resolved: ${query} -> ${item.snippet.channelId} (${item.snippet.title})`);
            } else {
                console.log(`❌ Failed: ${query}`);
            }
        } catch (err) {
            console.error(`Error resolving ${query}:`, err.message);
        }
    }

    console.log('\n--- FINAL CONFIG JSON ---');
    console.log(JSON.stringify(resolved, null, 2));
}

resolveIds();
