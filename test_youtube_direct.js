const axios = require('axios');
const https = require('https');
const dotenv = require('dotenv');

const youtubeClient = axios.create({
    httpsAgent: new https.Agent({
        keepAlive: true,
        family: 4 // Force IPv4
    }),
    timeout: 30000
});
dotenv.config();

const testYouTubeAPI = async () => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const testChannelId = 'UCjDSdnS6_0o0pBqD8_xSxcQ'; // Sun Pictures

    console.log('Testing YouTube API...');
    console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}` : 'MISSING');
    console.log('Channel ID:', testChannelId);
    console.log('');

    try {
        const url = 'https://www.googleapis.com/youtube/v3/channels';
        const params = {
            part: 'contentDetails',
            id: testChannelId,
            key: apiKey
        };

        console.log('Request URL:', url);
        console.log('Params:', JSON.stringify(params, null, 2));
        console.log('');

        const response = await youtubeClient.get(url, { params });

        console.log('✅ API Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));

        if (response.data.items && response.data.items.length > 0) {
            console.log('');
            console.log('✅ SUCCESS! Channel found:', response.data.items[0].id);
            console.log('Uploads Playlist ID:', response.data.items[0].contentDetails.relatedPlaylists.uploads);
        } else {
            console.log('');
            console.log('⚠️  No items returned - Channel ID may be incorrect');
        }

    } catch (error) {
        console.log('');
        console.log('❌ API Error:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
};

testYouTubeAPI();
