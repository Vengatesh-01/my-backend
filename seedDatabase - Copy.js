const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
require('dotenv').config();

const seedUsers = [
    { username: 'john_doe', email: 'john@example.com', password: 'password123', fullname: 'John Doe' },
    { username: 'emma_wilson', email: 'emma@example.com', password: 'password123', fullname: 'Emma Wilson' },
    { username: 'mike_smith', email: 'mike@example.com', password: 'password123', fullname: 'Mike Smith' },
    { username: 'sarah_jones', email: 'sarah@example.com', password: 'password123', fullname: 'Sarah Jones' },
    { username: 'alex_brown', email: 'alex@example.com', password: 'password123', fullname: 'Alex Brown' }
];

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/social-media');
        console.log('Connected to MongoDB');

        // Clear existing data (optional - comment out if you want to keep existing data)
        // await User.deleteMany({ username: { $in: seedUsers.map(u => u.username) } });
        // await Conversation.deleteMany({});
        // await Message.deleteMany({});

        // Create users
        const createdUsers = [];
        for (const userData of seedUsers) {
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
                console.log(`User ${userData.username} already exists`);
                createdUsers.push(existingUser);
            } else {
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                const user = new User({
                    username: userData.username,
                    email: userData.email,
                    password: hashedPassword,
                    fullname: userData.fullname,
                    profilePic: `https://ui-avatars.com/api/?name=${userData.fullname}&background=random`
                });
                await user.save();
                createdUsers.push(user);
                console.log(`Created user: ${userData.username}`);
            }
        }

        // Create some conversations
        if (createdUsers.length >= 2) {
            // Conversation 1: john_doe and emma_wilson
            const conv1 = await Conversation.findOne({
                participants: { $all: [createdUsers[0]._id, createdUsers[1]._id] }
            });

            if (!conv1) {
                const newConv1 = new Conversation({
                    participants: [createdUsers[0]._id, createdUsers[1]._id]
                });
                await newConv1.save();

                // Add some messages
                const msg1 = new Message({
                    conversationId: newConv1._id,
                    sender: createdUsers[0]._id,
                    text: 'Hey Emma! How are you?'
                });
                await msg1.save();

                const msg2 = new Message({
                    conversationId: newConv1._id,
                    sender: createdUsers[1]._id,
                    text: 'Hi John! I\'m doing great, thanks!'
                });
                await msg2.save();

                newConv1.lastMessage = msg2._id;
                await newConv1.save();
                console.log('Created conversation between john_doe and emma_wilson');
            }

            // Conversation 2: mike_smith and sarah_jones
            if (createdUsers.length >= 4) {
                const conv2 = await Conversation.findOne({
                    participants: { $all: [createdUsers[2]._id, createdUsers[3]._id] }
                });

                if (!conv2) {
                    const newConv2 = new Conversation({
                        participants: [createdUsers[2]._id, createdUsers[3]._id]
                    });
                    await newConv2.save();

                    const msg3 = new Message({
                        conversationId: newConv2._id,
                        sender: createdUsers[2]._id,
                        text: 'Sarah, did you see the new project?'
                    });
                    await msg3.save();

                    newConv2.lastMessage = msg3._id;
                    await newConv2.save();
                    console.log('Created conversation between mike_smith and sarah_jones');
                }
            }

            // Group conversation: All 5 users
            if (createdUsers.length === 5) {
                const groupConv = await Conversation.findOne({
                    isGroup: true,
                    groupName: 'Team Chat'
                });

                if (!groupConv) {
                    const newGroupConv = new Conversation({
                        participants: createdUsers.map(u => u._id),
                        isGroup: true,
                        groupName: 'Team Chat',
                        groupPic: 'https://ui-avatars.com/api/?name=Team+Chat&background=6366f1'
                    });
                    await newGroupConv.save();

                    const groupMsg = new Message({
                        conversationId: newGroupConv._id,
                        sender: createdUsers[0]._id,
                        text: 'Welcome to the team chat everyone!'
                    });
                    await groupMsg.save();

                    newGroupConv.lastMessage = groupMsg._id;
                    await newGroupConv.save();
                    console.log('Created group conversation: Team Chat');
                }
            }
        }

        console.log('\n✅ Database seeded successfully!');
        console.log('\nTest Users Created:');
        seedUsers.forEach(u => {
            console.log(`  - ${u.username} (${u.email}) - password: password123`);
        });
        console.log('\nYou can now login with any of these accounts!');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
