const axios = require('axios');

async function verifyInterleaving() {
    try {
        console.log('--- API INTERLEAVING TEST ---');
        const res = await axios.get('http://localhost:5000/api/reels?page=1');
        const reels = res.data;

        console.log(`Fetched ${reels.length} reels.`);

        const counts = reels.reduce((acc, r) => {
            acc[r.isTamil ? 'Tamil' : 'International']++;
            return acc;
        }, { Tamil: 0, International: 0 });

        console.log('Results in this batch:');
        console.log(`- Tamil: ${counts.Tamil}`);
        console.log(`- International: ${counts.International}`);

        reels.forEach((r, i) => {
            console.log(`  ${i + 1}. [${r.isTamil ? 'Tamil' : 'Intl'}] ${r.creatorName}: ${r.caption.substring(0, 40)}...`);
        });

        if (counts.Tamil >= 3 && counts.International >= 1) {
            console.log('\n✅ Interleaving logic verified.');
        } else {
            console.log('\n⚠️ Interleaving logic might need check (or not enough data in pools).');
        }

    } catch (err) {
        console.error('API Verification Failed:', err.message);
    }
}

verifyInterleaving();
