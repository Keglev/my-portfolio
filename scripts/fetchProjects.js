#!/usr/bin/env node
/*
  scripts/fetchProjects.js
  - Fetch pinned repositories via GitHub GraphQL using a server-side token
  - Writes public/projects.json for the client to consume during runtime
  Usage: set environment variable GH_PROJECTS_TOKEN (or GITHUB_TOKEN) in CI, then run:
    node scripts/fetchProjects.js
*/
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const OUT_PATH = path.join(__dirname, '..', 'public', 'projects.json');

const TOKEN = process.env.GH_PROJECTS_TOKEN || process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error('Missing GH_PROJECTS_TOKEN or GITHUB_TOKEN environment variable. Abort.');
  process.exit(2);
}

const query = `
  {
    user(login: "keglev") {
      pinnedItems(first: 6, types: [REPOSITORY]) {
        nodes {
          ... on Repository {
            name
            description
            url
            object(expression: "HEAD:README.md") {
              ... on Blob {
                text
              }
            }
          }
        }
      }
    }
  }
`;

async function fetchPinned() {
  try {
    const res = await axios.post(
      'https://api.github.com/graphql',
      { query },
      { headers: { Authorization: `Bearer ${TOKEN}`, 'X-GitHub-Api-Version': '2022-11-28' } }
    );

    const nodes = res.data && res.data.data && res.data.data.user && res.data.data.user.pinnedItems && res.data.data.user.pinnedItems.nodes;
    if (!Array.isArray(nodes)) {
      throw new Error('Unexpected GraphQL response shape');
    }

    // Write a compact json file for the client
    fs.writeFileSync(OUT_PATH, JSON.stringify(nodes, null, 2), 'utf8');
    console.log('Wrote', OUT_PATH);
  } catch (err) {
    console.error('Failed to fetch pinned repositories:', err.message || err);
    process.exit(3);
  }
}

fetchPinned();
