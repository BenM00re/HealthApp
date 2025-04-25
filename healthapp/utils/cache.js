const NodeCache = require('node-cache');

// stdTTL: default time-to-live in seconds (10 minutes)
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

module.exports = cache;