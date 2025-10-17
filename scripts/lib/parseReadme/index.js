const parser = require('./parser');
const extractors = require('./extractors');
const normalize = require('./normalize');

module.exports = Object.assign({}, parser, extractors, normalize);
