var express = require('express');
var router = express.Router();
const { ensureAuth, ensureGuest } = require('../middleware/auth')

/* GET home page. */
router.get('/', ensureGuest, function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
