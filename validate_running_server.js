
const http = require('http');

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, data: data });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.end();
    });
}

async function run() {
    console.log("Checking Server Status...");
    try {
        // Check Root
        const root = await makeRequest('/');
        console.log(`Root Endpoint (/): Status ${root.statusCode}`);
        console.log(`Response: ${root.data}`);

        // Check DB Dependent Route (Reels)
        console.log("\nChecking Database Access (/api/reels)...");
        const reels = await makeRequest('/api/reels');
        console.log(`Reels Endpoint (/api/reels): Status ${reels.statusCode}`);
        if (reels.statusCode === 200) {
            console.log("✅ Database Access Confirmed (Reels fetched)");
            const parsed = JSON.parse(reels.data);
            console.log(`Fetched ${Array.isArray(parsed) ? parsed.length : 'unknown'} reels.`);
        } else {
            console.error(`❌ API Error: ${reels.statusCode}`);
            console.log(reels.data.substring(0, 200));
        }

    } catch (err) {
        console.error("❌ Connection Refused / Error. Is the server running?");
        console.error(err.message);
    }
}

run();
