const express = require('express');
const router = express.Router();
const User = require('../models/users');
const { ensureAuth } = require('../middleware/auth');

// Get user profile data
router.get('/', ensureAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Return profile data if it exists
        return res.json({ 
            success: true, 
            profile: user.profile || {} 
        });
    } catch (err) {
        console.error('Error fetching profile:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update user profile data
router.post('/update', ensureAuth, async (req, res) => {
    try {
        const profileData = req.body;
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update user's profile data
        user.profile = profileData;
        await user.save();

        return res.json({ success: true, message: 'Profile updated successfully' });
    } catch (err) {
        console.error('Error updating profile:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;