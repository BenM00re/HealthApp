const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
console.log('Looking for users.json at:', USERS_FILE);
console.log('Absolute path:', path.resolve(USERS_FILE));
router.post('/register', async (req, res) => {
    try {
        let users = [];
        // Debug: Check if file exists
        try {
            await fs.access(USERS_FILE);
            console.log('users.json exists');
        } catch {
            console.log('users.json does NOT exist');
            await fs.writeFile(USERS_FILE, '[]');
        }
        // Read existing users or create empty array
        try {
            const data = await fs.readFile(USERS_FILE, 'utf8');
            users = JSON.parse(data);
        } catch (err) {
            if (err.code !== 'ENOENT') throw err;
            await fs.writeFile(USERS_FILE, '[]');
        }

        // Check for existing user
        if (users.some(u => u.username === req.body.username)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Username exists' 
            });
        }

        // Add new user
        users.push({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password, // Should be pre-hashed
            createdAt: new Date().toISOString()
        });

        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        res.json({ success: true });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Server error' 
        });
    }
});

module.exports = router;