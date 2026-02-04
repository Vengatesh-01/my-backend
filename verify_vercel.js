const axios = require('axios');

async function verifyVercelDeployment() {
    console.log('🔍 Verifying Vercel Production Deployment');
    console.log('='.repeat(60));
    console.log('Frontend: https://frontend-vercel-azure.vercel.app');
    console.log('Backend: https://reelio.onrender.com');
    console.log('='.repeat(60));
    console.log('');

    const results = [];

    // 1. Check Frontend is live
    console.log('📱 Frontend Tests');
    console.log('-'.repeat(60));
    try {
        const response = await axios.get('https://frontend-vercel-azure.vercel.app', {
            timeout: 10000,
            validateStatus: () => true
        });
        const status = response.status === 200 ? '✅' : '❌';
        console.log(`${status} Frontend accessible: ${response.status} ${response.statusText}`);
        results.push({ test: 'Frontend Live', passed: response.status === 200 });
    } catch (error) {
        console.log(`❌ Frontend error: ${error.message}`);
        results.push({ test: 'Frontend Live', passed: false });
    }

    // 2. Check Backend endpoints
    console.log('\n🔧 Backend Tests');
    console.log('-'.repeat(60));

    try {
        const response = await axios.get('https://reelio.onrender.com/gaming-hub/', {
            timeout: 10000,
            validateStatus: () => true
        });
        const status = response.status === 200 ? '✅' : '❌';
        console.log(`${status} Gaming Hub: ${response.status}`);
        results.push({ test: 'Gaming Hub', passed: response.status === 200 });
    } catch (error) {
        console.log(`❌ Gaming Hub: ${error.message}`);
        results.push({ test: 'Gaming Hub', passed: false });
    }

    try {
        const response = await axios.options('https://reelio.onrender.com/api/upload', {
            timeout: 10000,
            validateStatus: () => true
        });
        const status = response.status === 200 ? '✅' : '❌';
        console.log(`${status} Upload Endpoint: ${response.status}`);
        results.push({ test: 'Upload Endpoint', passed: response.status === 200 });
    } catch (error) {
        console.log(`❌ Upload Endpoint: ${error.message}`);
        results.push({ test: 'Upload Endpoint', passed: false });
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary');
    console.log('='.repeat(60));

    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    console.log(`\n✅ Passed: ${passed}/${total}`);

    if (passed === total) {
        console.log('\n🎉 All systems operational on Vercel!');
        console.log('\n✅ Your production app should now have:');
        console.log('   - Cloudinary images displaying correctly');
        console.log('   - Upload functionality working');
        console.log('   - Gaming Hub accessible');
        console.log('\n📝 Next: Test these features on your Vercel site!');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the errors above.');
    }
}

verifyVercelDeployment().catch(console.error);
