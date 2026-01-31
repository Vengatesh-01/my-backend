const mongoose = require('mongoose');
const User = require('./models/User'); // Ensure paths are correct
require('dotenv').config();

const ReelSchema = new mongoose.Schema({}, { strict: false });
const Reel = mongoose.model('Reel', ReelSchema);

const debugReels = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log("MongoDB Connected");

        // 1. Check a raw reel
        const rawReel = await Reel.findOne({ isTamil: true, status: 'approved' });
        if (!rawReel) {
            console.log("No approved tamil reels found!");
            process.exit();
        }
        console.log("\n--- Raw Reel ---");
        console.log("ID:", rawReel._id, "Type:", rawReel._id.constructor.name);
        console.log("User Field:", rawReel.user, "Type:", rawReel.user ? rawReel.user.constructor.name : 'N/A');

        // 2. Check the user it points to
        if (rawReel.user) {
            const user = await User.findById(rawReel.user);
            console.log("\n--- Associated User ---");
            if (user) {
                console.log("ID:", user._id, "Type:", user._id.constructor.name);
                console.log("Found User:", user.username);
            } else {
                console.log("USER NOT FOUND in User collection!");
            }
        }

        // 3. Test Aggregation exactly as in Controller
        console.log("\n--- Testing Aggregation ---");
        const matchQuery = { _id: rawReel._id };
        const aggResult = await Reel.aggregate([
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            // { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } } // Commented out to see raw lookup result
        ]);

        console.log("Aggregation Result:", JSON.stringify(aggResult, null, 2));

        if (aggResult[0] && aggResult[0].user && aggResult[0].user.length === 0) {
            console.log("LookUP FAILED: 'user' array is empty.");
        } else {
            console.log("LookUP SUCCEEDED.");
        }

        process.exit();

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debugReels();
