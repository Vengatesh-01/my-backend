const axios = require('axios');

async function verifyCommentsCount() {
    try {
        console.log('--- API COMMENTS COUNT TEST ---');
        const res = await axios.get('http://localhost:5000/api/reels?page=1');
        const reels = res.data;

        reels.forEach((r, i) => {
            console.log(`  ${i + 1}. [${r.isTamil ? 'Tamil' : 'Intl'}] ${r.creatorName}: commentsCount = ${r.commentsCount}`);
        });

        const hasCounts = reels.every(r => typeof r.commentsCount === 'number');
        if (hasCounts) {
            console.log('\n✅ commentsCount field verified in all results.');
        } else {
            console.log('\n⚠️ Some results are missing commentsCount.');
        }

    } catch (err) {
        console.error('API Verification Failed:', err.message);
    }
}

verifyCommentsCount();
