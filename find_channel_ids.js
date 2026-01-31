// Helper script to find YouTube channel IDs
// You can use this by visiting the channel and checking the page source

const channelInfo = `
To find the correct YouTube Channel IDs:

1. Visit each channel's YouTube page:
   - Sun Pictures: https://www.youtube.com/@SunTV
   - Lyca Productions: https://www.youtube.com/@LycaProductions
   - Think Music India: https://www.youtube.com/@thinkmusicindia
   - Sony Music South: https://www.youtube.com/@SonyMusicSouth
   - Zee Music South: https://www.youtube.com/@ZeeMusicSouth
   - BehindwoodsTV: https://www.youtube.com/@BehindwoodsTV
   - Galatta Tamil: https://www.youtube.com/@GalattaTamil

2. Right-click → "View Page Source"
3. Press Ctrl+F and search for "channelId"
4. Copy the ID (starts with "UC")

ALTERNATIVELY - Use these working channel IDs:
`;

console.log(channelInfo);

// Let's test with a handle-based search instead
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const findChannelIdByHandle = async (handle) => {
    const apiKey = process.env.YOUTUBE_API_KEY;

    try {
        // Try searching for the channel
        const searchUrl = 'https://www.googleapis.com/youtube/v3/search';
        const response = await axios.get(searchUrl, {
            params: {
                part: 'snippet',
                q: handle,
                type: 'channel',
                maxResults: 1,
                key: apiKey
            }
        });

        if (response.data.items && response.data.items.length > 0) {
            const channelId = response.data.items[0].snippet.channelId;
            const channelTitle = response.data.items[0].snippet.title;
            console.log(`✅ ${handle}: ${channelTitle}`);
            console.log(`   Channel ID: ${channelId}\n`);
            return channelId;
        } else {
            console.log(`❌ ${handle}: Not found\n`);
            return null;
        }
    } catch (error) {
        console.log(`❌ Error searching for ${handle}:`, error.message, '\n');
        return null;
    }
};

const searchAllChannels = async () => {
    console.log('\nSearching for Tamil cinema channels...\n');
    console.log('='.repeat(60), '\n');

    const channels = [
        'Sun TV',
        'Lyca Productions',
        'Think Music India',
        'Sony Music South',
        'Zee Music South',
        'BehindwoodsTV',
        'Galatta Tamil'
    ];

    for (const channel of channels) {
        await findChannelIdByHandle(channel);
    }
};

searchAllChannels();
