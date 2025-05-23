const express = require('express');
const router = express.Router();
const User = require('../models/users');

// Middleware to ensure authentication
const fs = require('fs').promises;
const path = require('path');
const TOKENS_FILE = path.join(__dirname, '..', 'data', 'tokens.json');

async function ensureAnyAuth(req, res, next) {
    // Passport session (Google OAuth)
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    // Custom token (users.json)
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
        const data = await fs.readFile(TOKENS_FILE, 'utf8');
        const tokens = JSON.parse(data);
        if (tokens[token]) {
            req.user = tokens[token]; // Attach user info to req.user
            return next();
        }
    } catch (err) {}
    return res.status(403).json({ error: 'Forbidden' });
}

// Save a food log entry
router.post('/log', ensureAnyAuth, async (req, res) => {
    console.log('req.user:', req.user);
    console.log('POST /food/log', req.body, req.user); // Add this line
    const { date, entry } = req.body;
    try {
        let user = await User.findById(req.user.id);
        let log = user.foodLogs.find(l => l.date === date);
        // Ensure meal field exists
        if (!entry.meal) entry.meal = 'breakfast';
        if (!log) {
            user.foodLogs.push({ date, entries: [entry] });
        } else {
            log.entries.push(entry);
        }
        await user.save();
        res.json({ success: true });
    } catch (err) {
        console.error('Error saving food log:', err);
        res.status(500).json({ error: 'Failed to save log' });
    }
});

// Get food logs for a date
router.get('/log/:date', ensureAnyAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const log = user.foodLogs.find(l => l.date === req.params.date);
        res.json({ entries: log ? log.entries : [] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// Delete a food entry by date and entry ID
router.delete('/log/:date/:entryId', async (req, res) => {
    try {
        const userId = req.user.id;
        const { date, entryId } = req.params;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        const foodLog = user.foodLogs.find(log => log.date === date);
        if (!foodLog) return res.status(404).json({ success: false, error: 'Log not found' });

        const entryIndex = foodLog.entries.findIndex(e => e._id.toString() === entryId);
        if (entryIndex === -1) return res.status(404).json({ success: false, error: 'Entry not found' });

        foodLog.entries.splice(entryIndex, 1);
        await user.save();

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to delete entry' });
    }
});

module.exports = router;