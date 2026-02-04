const axios = require('axios');

async function verifyProduction() {
    console.log('🔍 Verifying Production Deployment\n');
    console.log('='.repeat(50));

    const tests = [];

    // 1. Backend - Gaming Hub
    console.log('\n📦 Backend Tests (Render - reelio.onrender.com)');
    console.log('-'.repeat(50));
    try {
        const response = await axios.get('https://reelio.onrender.com/gaming-hub/', {
            timeout: 10000,
            validateStatus: () => true
        });
        const status = response.status === 200 ? '✅' : '❌';
        console.log(`${status} Gaming Hub: ${response.status} ${response.statusText}`);
        tests.push({ name: 'Gaming Hub', passed: response.status === 200 });
    } catch (error) {
        console.log(`❌ Gaming Hub: ${error.message}`);
        tests.push({ name: 'Gaming Hub', passed: false });
    }

    // 2. Backend - Upload Route
    try {
        const response = await axios.options('https://reelio.onrender.com/api/upload', {
            timeout: 10000,
            validateStatus: () => true
        });
        const status = response.status === 200 ? '✅' : '❌';
        console.log(`${status} Upload Endpoint: ${response.status}`);
        tests.push({ name: 'Upload Endpoint', passed: response.status === 200 });
    } catch (error) {
        console.log(`❌ Upload Endpoint: ${error.message}`);
        tests.push({ name: 'Upload Endpoint', passed: false });
    }

    // 3. Frontend - Check if deployed
    console.log('\n🌐 Frontend Tests (Netlify)');
    console.log('-'.repeat(50));

    // Try to detect Netlify URL from common patterns
    const possibleFrontendUrls = [
        'https://reelio.netlify.app',
        'https://app.reelio.com',
        // Add more if known
    ];

    let frontendUrl = null;
    for (const url of possibleFrontendUrls) {
        try {
            const response = await axios.get(url, {
                timeout: 5000,
                validateStatus: () => true
            });
            if (response.status === 200) {
                frontendUrl = url;
                break;
            }
        } catch (error) {
            // Continue to next URL
        }
    }

    if (frontendUrl) {
        console.log(`✅ Frontend accessible at: ${frontendUrl}`);
        tests.push({ name: 'Frontend Deployed', passed: true });
    } else {
        console.log(`⚠️  Could not auto-detect frontend URL`);
        console.log(`   Please provide your Netlify URL to verify frontend deployment`);
        tests.push({ name: 'Frontend Deployed', passed: null });
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Summary');
    console.log('='.repeat(50));

    const passed = tests.filter(t => t.passed === true).length;
    const failed = tests.filter(t => t.passed === false).length;
    const unknown = tests.filter(t => t.passed === null).length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    if (unknown > 0) console.log(`⚠️  Unknown: ${unknown}`);

    console.log('\n📝 Next Steps:');
    if (failed > 0) {
        console.log('   - Check Render deployment logs');
        console.log('   - Verify environment variables are set');
    }
    if (unknown > 0) {
        console.log('   - Verify frontend is deployed to Netlify');
        console.log('   - Check Netlify deployment status');
    }
    if (failed === 0 && unknown === 0) {
        console.log('   ✅ All systems operational!');
        console.log('   - Test uploads on the live site');
        console.log('   - Check image display');
        console.log('   - Verify Gaming Hub works');
    }
}

verifyProduction().catch(console.error);
