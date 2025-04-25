const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Route for the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
// Add these near the top with other requires
const bodyParser = require('body-parser');

// Add after express.static middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Add after the GET route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Basic validation
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }
    
    // Here you would typically check against a database
    // For now, we'll just log and redirect
    console.log(`Login attempt: ${username}`);
    
    // Redirect to a success page or back to login with message
    res.redirect('/?message=Login+attempt+recorded');
});