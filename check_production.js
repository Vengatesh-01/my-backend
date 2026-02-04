const axios = require('axios');

async function checkProduction() {
    console.log('Checking production deployment status...\n');

    // 1. Check Gaming Hub
    try {
        const gamingResponse = await axios.get('https://reelio.onrender.com/gaming-hub/', {
            timeout: 10000,
            validateStatus: () => true
        });
        console.log(`✅ Gaming Hub: ${gamingResponse.status} ${gamingResponse.statusText}`);
    } catch (error) {
        console.log(`❌ Gaming Hub: ${error.message}`);
    }

    // 2. Check Upload endpoint
    try {
        const uploadResponse = await axios.options('https://reelio.onrender.com/api/upload', {
            timeout: 10000
        });
        console.log(`✅ Upload Endpoint: ${uploadResponse.status} ${uploadResponse.statusText}`);
    } catch (error) {
        console.log(`❌ Upload Endpoint: ${error.message}`);
    }

    // 3. Check main backend
    try {
        const mainResponse = await axios.get('https://reelio.onrender.com/', {
            timeout: 10000,
            validateStatus: () => true
        });
        console.log(`✅ Main Backend: ${mainResponse.status} ${mainResponse.statusText}`);
    } catch (error) {
        console.log(`❌ Main Backend: ${error.message}`);
    }

    console.log('\n⏳ Note: Render deployments can take 2-5 minutes to complete.');
    console.log('📌 Frontend (Netlify) still needs manual deployment for urlUtils.js and HomePage.jsx fixes.');
}

checkProduction();
