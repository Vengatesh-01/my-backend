const Report = require('../models/Report');

// @desc    Submit a report
// @route   POST /api/reports
// @access  Private
const submitReport = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Report message is required' });
        }

        const report = await Report.create({
            user: req.user._id,
            message
        });

        res.status(201).json({
            message: 'Report submitted successfully',
            report
        });
    } catch (error) {
        console.error('Submit Report Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    submitReport
};
