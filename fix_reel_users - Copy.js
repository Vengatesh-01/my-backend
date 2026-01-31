const mongoose = require('mongoose');
const User = require('./models/User'); // Ensure paths are correct
require('dotenv').config();

const ReelSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: String,
    isTamil: Boolean
}, { strict: false });

const Reel = mongoose.model('Reel', ReelSchema);

const fixReelUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log("MongoDB Connected");

        // Find a default user to assign (or create one)
        let defaultUser = await User.findOne({ username: 'john_doe' });
        if (!defaultUser) {
            defaultUser = await User.findOne();
        }

        if (!defaultUser) {
            console.log("No users found to assign!");
            process.exit(1);
        }

        console.log(`Assigning orphaned reels to user: ${defaultUser.username} (${defaultUser._id})`);

        const result = await Reel.updateMany(
            { user: { $exists: false } },
            { $set: { user: defaultUser._id, status: 'approved', isTamil: true } }
        );

        console.log(`Updated ${result.modifiedCount} reels with missing users.`);

        // Also fix any that might have "user" but are pending
        const result2 = await Reel.updateMany(
            { status: { $ne: 'approved' } },
            { $set: { status: 'approved' } }
        );
        console.log(`Updated ${result2.modifiedCount} pending reels to approved.`);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixReelUsers();
