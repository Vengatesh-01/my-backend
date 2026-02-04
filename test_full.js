const axios = require('axios');
const API_URL = 'http://localhost:5001/api';

async function testFull() {
    try {
        // Log in as testing user (assuming one exists)
        // From Step 884, we have 'Selva__27'
        // Let's try to log in. We don't know the password.
        // Wait, I can create a temporary user.
        console.log('Registering temp user...');
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            username: 'testuser' + Date.now(),
            fullname: 'Test User',
            email: 'test' + Date.now() + '@example.com',
            password: 'password123'
        });
        const token = regRes.data.token;
        console.log('Registered and got token.');

        console.log('Searching for "SELVA"...');
        const searchRes = await axios.get(`${API_URL}/users/search`, {
            params: { q: 'SELVA' },
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Search Results:', JSON.stringify(searchRes.data, null, 2));
    } catch (err) {
        console.error('Error:', err.response?.data || err.message);
    }
}

testFull();
