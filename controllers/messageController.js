const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// @desc    Get or create a 1-on-1 conversation
// @route   POST /api/messages/conversation
// @access  Private
exports.getOrCreateConversation = async (req, res) => {
    try {
        const { recipientId } = req.body;
        const senderId = req.user._id;

        if (!recipientId) {
            return res.status(400).json({ message: 'Recipient ID is required' });
        }

        let conversation = await Conversation.findOne({
            isGroup: false,
            participants: { $all: [senderId, recipientId] }
        }).populate('participants', 'username profilePic');

        if (!conversation) {
            const recipient = await User.findById(recipientId);
            const isRequest = !recipient.followers.some(id => id.toString() === senderId.toString());

            conversation = await Conversation.create({
                participants: [senderId, recipientId],
                isRequest,
                requestedTo: isRequest ? recipientId : null
            });
            conversation = await conversation.populate('participants', 'username profilePic');

            // Notify recipient if it's a request
            if (isRequest && global.io) {
                global.io.to(recipientId.toString()).emit('new-request-notification', {
                    conversationId: conversation._id,
                    sender: {
                        _id: req.user._id,
                        username: req.user.username,
                        profilePic: req.user.profilePic
                    }
                });
            }
        }

        res.status(200).json(conversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
    try {
        const { conversationId, recipientId, text, media, replyTo, vanishMode } = req.body;
        const senderId = req.user._id;

        let conversation;
        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        } else if (recipientId) {
            // Check for existing 1-on-1 conversation
            conversation = await Conversation.findOne({
                isGroup: false,
                participants: { $all: [senderId, recipientId] }
            });

            if (!conversation) {
                const recipient = await User.findById(recipientId);
                const isRequest = !recipient.followers.some(id => id.toString() === senderId.toString());

                conversation = await Conversation.create({
                    participants: [senderId, recipientId],
                    isRequest,
                    requestedTo: isRequest ? recipientId : null
                });
            }
        }

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        const newMessage = await Message.create({
            conversationId: conversation._id,
            sender: senderId,
            text,
            media,
            replyTo,
            vanishMode: vanishMode || false,
            status: 'sent'
        });

        conversation.lastMessage = newMessage._id;
        await conversation.save();

        const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'username profilePic');

        // Emit socket event to all participants
        if (global.io) {
            conversation.participants.forEach(pId => {
                if (pId.toString() !== senderId.toString()) {
                    global.io.to(pId.toString()).emit('new-message', populatedMessage);
                }
            });
        }

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a group conversation
// @route   POST /api/messages/group
// @access  Private
exports.createGroup = async (req, res) => {
    try {
        const { participantIds, groupName, groupPic } = req.body;
        const senderId = req.user._id;

        const conversation = await Conversation.create({
            participants: [...new Set([...participantIds, senderId.toString()])],
            isGroup: true,
            groupName,
            groupPic,
            groupAdmins: [senderId]
        });

        res.status(201).json(conversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark messages as seen
// @route   PUT /api/messages/seen/:conversationId
// @access  Private
exports.markAsSeen = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        await Message.updateMany(
            { conversationId, sender: { $ne: userId }, status: { $ne: 'seen' } },
            { $set: { status: 'seen' } }
        );

        // Notify sender that messages were seen
        if (global.io) {
            const conversation = await Conversation.findById(conversationId);
            conversation.participants.forEach(pId => {
                if (pId.toString() !== userId.toString()) {
                    global.io.to(pId.toString()).emit('messages-seen', { conversationId, seenBy: userId });
                }
            });
        }

        res.status(200).json({ message: 'Messages marked as seen' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add reaction to message
// @route   PUT /api/messages/react/:messageId
// @access  Private
exports.addReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        const existingReaction = message.reactions.find(r => r.user.toString() === userId.toString());
        if (existingReaction) {
            existingReaction.emoji = emoji;
        } else {
            message.reactions.push({ user: userId, emoji });
        }

        await message.save();

        if (global.io) {
            const conversation = await Conversation.findById(message.conversationId);
            conversation.participants.forEach(pId => {
                global.io.to(pId.toString()).emit('message-reaction', { messageId, userId, emoji });
            });
        }

        res.status(200).json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all conversations
exports.getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: { $in: [req.user._id] }
        })
            .populate('participants', 'username profilePic')
            .populate('lastMessage')
            .sort({ updatedAt: -1 });

        res.status(200).json(conversations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get messages for conversation
exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({
            conversationId: req.params.conversationId
        })
            .populate('sender', 'username profilePic')
            .populate({
                path: 'replyTo',
                populate: { path: 'sender', select: 'username' }
            })
            .sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Accept conversation request
// @route   PUT /api/messages/accept/:conversationId
// @access  Private
exports.acceptConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

        conversation.isRequest = false;
        conversation.category = 'primary';
        conversation.requestedTo = null;
        await conversation.save();

        res.status(200).json(conversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle conversation category (Primary/General)
// @route   PUT /api/messages/category/:conversationId
// @access  Private
exports.toggleConversationCategory = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

        // Toggle between primary and general
        conversation.category = conversation.category === 'primary' ? 'general' : 'primary';
        await conversation.save();

        res.status(200).json(conversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete conversation
// @route   DELETE /api/messages/:conversationId
// @access  Private
exports.deleteConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const Message = require('../models/Message');
        const Conversation = require('../models/Conversation');

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

        // Check if participant
        const isParticipant = conversation.participants.some(p => p.toString() === req.user._id.toString());
        if (!isParticipant) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Delete all messages in the conversation
        await Message.deleteMany({ conversationId });

        // Delete the conversation itself
        await Conversation.findByIdAndDelete(conversationId);

        res.status(200).json({ message: 'Conversation deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle mute conversation
// @route   PUT /api/messages/mute/:conversationId
// @access  Private
exports.toggleMute = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const Conversation = require('../models/Conversation');
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

        const isMuted = conversation.mutedBy.some(id => id.toString() === req.user._id.toString());

        if (isMuted) {
            conversation.mutedBy = conversation.mutedBy.filter(id => id.toString() !== req.user._id.toString());
        } else {
            conversation.mutedBy.push(req.user._id);
        }

        await conversation.save();
        res.status(200).json(conversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Edit a message
// @route   PUT /api/messages/message/:messageId
// @access  Private
exports.editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { text } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        // Only the sender can edit their message
        if (message.sender.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this message' });
        }

        message.text = text;
        message.isEdited = true;
        await message.save();

        const populatedMessage = await Message.findById(messageId).populate('sender', 'username profilePic');

        // Notify participants via socket
        if (global.io) {
            const conversation = await Conversation.findById(message.conversationId);
            conversation.participants.forEach(pId => {
                global.io.to(pId.toString()).emit('message-edited', populatedMessage);
            });
        }

        res.status(200).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a single message
// @route   DELETE /api/messages/message/:messageId
// @access  Private
exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Only the sender can delete their message
        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this message' });
        }

        await Message.findByIdAndDelete(messageId);
        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
