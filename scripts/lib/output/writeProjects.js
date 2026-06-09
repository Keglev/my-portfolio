#!/usr/bin/env node
const fs = require('fs');

/**
 * Serializes the projects array to disk as pretty-printed JSON.
 * Overwrites the existing file so the React app always reads the latest pipeline output.
 *
 * @param {string} outPath - Absolute path to write (typically public/projects.json)
 * @param {object[]} nodes - Enriched repository nodes
 * @returns {void}
 */
function writeProjectsJson(outPath, nodes) {
  fs.writeFileSync(outPath, JSON.stringify(nodes, null, 2), 'utf8');
}

module.exports = { writeProjectsJson };
