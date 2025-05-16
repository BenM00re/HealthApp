const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const app = express();
require('dotenv').config({ path: path.join(__dirname, 'apikey.env') });
const API_KEY = process.env.SPOONACULAR_API_KEY;
const food = require('./routes/food');
const connectDB = require('./config/db');
const session = require('express-session');
const passport = require('passport');
const foodlogRoutes = require('./routes/foodlog');
const profileRoutes = require('./routes/profile');
const User = require('./models/users');

// ===== MIDDLEWARE ORDER MATTERS =====

// Session and passport middleware
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Static files and home route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home_public.html'));
});

app.use(express.static(path.join(__dirname, 'public')));
// Body parser (for JSON POST bodies)
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use("/api/exercises", require("./routes/exercise"));

// Logging in dev mode
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Load config and passport
dotenv.config({ path: './config/config.env' });
require('./config/passport')(passport);

// Connect to MongoDB
connectDB();
const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:3000', // or your frontend URL
    credentials: true
}));

// ===== ROUTES =====
app.use('/api/spoonacular', food);
app.use('/food', foodlogRoutes);
app.use('/profile', profileRoutes);
app.use('/auth', require('./routes/auth'));

// Registration (MongoDB)
app.post('/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }
        const existing = await User.findOne({ $or: [{ username }, { email }] });
        if (existing) {
            return res.status(400).json({ success: false, error: 'Username or email already exists' });
        }
        const user = new User({ username, email, password });
        await user.save();
        res.json({ success: true, redirect: '/index.html?registration=success' });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ success: false, error: 'Registration failed' });
    }
});

// Login (MongoDB, simple version)
app.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        // Use Passport session for authentication
        req.login(user, function(err) {
            if (err) {
                return res.status(500).json({ success: false, error: 'Login failed' });
            }
            res.json({ success: true, redirect: '/dashboard.html' });
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
});

app.get('/auth/verify', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    console.log('SESSION:', req.session);
    console.log('USER:', req.user);
    console.log('IS AUTH:', req.isAuthenticated && req.isAuthenticated());
    if (req.isAuthenticated && req.isAuthenticated()) {
        res.json({ success: true, user: req.user });
    } else {
        res.status(401).json({ success: false, error: 'Not authenticated' });
    }
});

app.post('/auth/logout', (req, res) => {
    req.logout(() => {
        res.json({ success: true });
    });
});

const PORT = process.env.PORT || 3000;

app.listen(
    PORT,
    () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

module.exports = app;