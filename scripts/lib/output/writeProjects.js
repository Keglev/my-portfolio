#!/usr/bin/env node
const fs = require('fs');

function writeProjectsJson(outPath, nodes) {
  fs.writeFileSync(outPath, JSON.stringify(nodes, null, 2), 'utf8');
}

module.exports = { writeProjectsJson };
