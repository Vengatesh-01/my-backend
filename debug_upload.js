const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function testUpload() {
    try {
        // Use a dummy file or create one
        const filePath = path.join(__dirname, 'test_upload_image.png');
        if (!fs.existsSync(filePath)) {
            // Create a simple dummy file
            fs.writeFileSync(filePath, 'dummy image content');
        }

        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));

        console.log('Attempting upload to http://localhost:5001/api/upload ...');

        const response = await axios.post('http://localhost:5001/api/upload', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log('Upload Success!', response.data);
    } catch (error) {
        console.error('Upload Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testUpload();
