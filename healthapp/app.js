const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Route for the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to handle login form submission
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    // Log the login attempt (replace with database check in production)
    console.log(`Login attempt: ${username}`);

    // Redirect to a success page or back to login with a message
    res.redirect('/?message=Login+attempt+recorded');
});

module.exports = app;
