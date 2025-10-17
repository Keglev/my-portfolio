// DEPRECATED shim — media helper relocated to ./media/mediaHelper.js
// Keep a forwarder to the new implementation to avoid breaking older requires.
module.exports = require('./media').processNodeMedia;
