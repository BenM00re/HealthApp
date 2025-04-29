const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const app = express();

// Constants
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const TOKENS_FILE = path.join(__dirname, 'data', 'tokens.json');

// Improved JSON file reading function
async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return data.trim() ? JSON.parse(data) : {};
    } catch (err) {
        if (err.code === 'ENOENT') {
            await fs.writeFile(filePath, '{}');
            return {};
        }
        throw err;
    }
}

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Initialize data files
async function init() {
    try {
        await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
        await Promise.all([
            fs.writeFile(USERS_FILE, '[]').catch(() => {}),
            fs.writeFile(TOKENS_FILE, '{}').catch(() => {})
        ]);
    } catch (err) {
        console.error('Initialization error:', err);
    }
}

// Auth Middleware
async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    
    if (!token) return res.sendStatus(401);

    try {
        const tokens = await readJsonFile(TOKENS_FILE);
        if (tokens[token]) {
            req.user = tokens[token];
            return next();
        }
    } catch (err) {
        console.error('Token verification error:', err);
    }
    
    return res.sendStatus(403);
}

// Routes
app.post('/auth/register', async (req, res) => {
    try {
        if (!req.body.username || !req.body.email || !req.body.password) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const users = await readJsonFile(USERS_FILE);
        if (users.some(u => u.username === req.body.username)) {
            return res.status(400).json({ success: false, error: 'Username exists' });
        }

        const newUser = {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        
        res.json({ success: true, redirect: '/index.html?registration=success' });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ success: false, error: 'Registration failed' });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const users = await readJsonFile(USERS_FILE);
        const user = users.find(u => u.username === req.body.username && u.password === req.body.password);
        
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const tokens = await readJsonFile(TOKENS_FILE);
        
        tokens[token] = {
            username: user.username,
            createdAt: new Date().toISOString()
        };
        
        await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens));
        
        res.json({ success: true, token, redirect: '/dashboard.html' });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
});

app.get('/auth/verify', authenticateToken, (req, res) => {
    res.json({ success: true, user: req.user });
});

app.post('/auth/logout', authenticateToken, async (req, res) => {
    try {
        const token = req.headers['authorization'].split(' ')[1];
        const tokens = await readJsonFile(TOKENS_FILE);
        delete tokens[token];
        await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

module.exports = app;