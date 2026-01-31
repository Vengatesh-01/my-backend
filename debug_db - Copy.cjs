const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/social_media_platform';
const adminUserSchema = new mongoose.Schema({ email: String, password: { type: String, select: true } }, { collection: 'admin_users' });
const AdminUserDebug = mongoose.model('AdminUserDebug', adminUserSchema);
mongoose.connect(MONGO_URI).then(async () => {
    const owners = await AdminUserDebug.find({});
    console.log('\n--- DB DEBUG ---');
    console.log(`Found ${owners.length} accounts.`);
    owners.forEach(o => {
        console.log(`Email: ${o.email}`);
        console.log(`Password length: ${o.password ? o.password.length : 'N/A'}`);
        console.log(`Is hashed ($2a$ or $2b$): ${o.password && (o.password.startsWith('$2a$') || o.password.startsWith('$2b$'))}`);
    });
    process.exit();
}).catch(err => { console.error(err); process.exit(1); });
