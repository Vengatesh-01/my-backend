const mongoose = require('mongoose');
require('dotenv').config();

const ReelSchema = new mongoose.Schema({
    status: String,
    isTamil: Boolean
}, { strict: false });

const Reel = mongoose.model('Reel', ReelSchema);

const fixReels = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log("MongoDB Connected");

        const result = await Reel.updateMany(
            {},
            { $set: { status: 'approved', isTamil: true } }
        );

        console.log(`Updated ${result.modifiedCount} reels to be approved and Tamil.`);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixReels();
