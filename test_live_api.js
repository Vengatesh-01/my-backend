const axios = require('axios');

async function testLogin() {
    try {
        console.log('Testing live API login...');
        const response = await axios.post('https://reelio.onrender.com/api/auth/login', {
            email: 'test@example.com',
            password: 'password'
        }, {
            timeout: 5000
        });
        console.log('Response:', response.data);
    } catch (error) {
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        } else {
            console.log('Error Message:', error.message);
        }
    }
}

testLogin();
