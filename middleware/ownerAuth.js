const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');

const protectOwner = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Use a separate secret for owner JWT to ensure full isolation
            const decoded = jwt.verify(token, process.env.OWNER_JWT_SECRET || 'owner_secret_123');

            req.owner = await AdminUser.findById(decoded.id).select('-password');

            if (!req.owner || req.owner.role !== 'owner') {
                return res.status(401).json({ message: 'Not authorized as owner' });
            }

            return next();
        } catch (error) {
            console.error('Owner Auth Error:', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protectOwner };
