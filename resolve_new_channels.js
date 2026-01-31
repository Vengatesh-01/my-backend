const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const API_KEY = process.env.YOUTUBE_API_KEY;

const channelsToResolve = [
    "A2D Channel",
    "Keerthy Suresh Official",
    "Samantha Ruth Prabhu",
    "Rashmika Mandanna"
];

async function resolveChannelId(name) {
    try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(name)}&key=${API_KEY}`;
        const { data } = await axios.get(url);

        if (data.items && data.items.length > 0) {
            const channel = data.items[0];
            return {
                name: name,
                id: channel.id.channelId,
                searchQuery: name
            };
        }
        return null;
    } catch (error) {
        console.error(`Error resolving ${name}:`, error.message);
        return null;
    }
}

async function run() {
    console.log("Resolving new channels...");
    const results = [];
    for (const name of channelsToResolve) {
        const res = await resolveChannelId(name);
        if (res) {
            console.log(`Channel ID resolved: ${name} -> ${res.id}`);
            results.push(res);
        } else {
            console.log(`Failed to resolve: ${name}`);
        }
    }
    const fs = require('fs');
    fs.writeFileSync('new_resolved_channels.json', JSON.stringify(results, null, 2));
    console.log("\nResults written to new_resolved_channels.json");
}

run();
