const http = require('http');

const id = '69692d7cdeb07926757e03c8'; // The target post ID

const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/posts/${id}`,
    method: 'DELETE',
    headers: {
        'Authorization': 'Bearer dummy_token'
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
