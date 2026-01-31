const axios = require('axios');

async function checkReels() {
    try {
        const response = await axios.get('https://reelio.onrender.com/api/reels');
        console.log('Success:', response.data);
    } catch (error) {
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Body:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }
}

checkReels();
