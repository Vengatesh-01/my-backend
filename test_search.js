const axios = require('axios');
const API_URL = 'http://localhost:5001/api/users/search';

async function testSearch() {
    try {
        console.log('Testing search for: SELVA RANI');
        const res = await axios.get(`${API_URL}`, {
            params: { q: 'SELVA RANI' }
        }).catch(e => e.response);
        console.log('Status:', res?.status);
        console.log('Data:', JSON.stringify(res?.data, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

testSearch();
