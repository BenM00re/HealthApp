require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const foodApiRouter = require('./routes/api/food'); // New food API routes

const app = express();

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup (if using)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/food', foodApiRouter); // Mount food API routes

// Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({ error: err.message });
});

module.exports = app;
