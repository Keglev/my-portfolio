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

const GH_TOKEN = process.env.GH_PROJECTS_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
let TOKEN = null;

if (GH_TOKEN) {
  console.log('Using GH_PROJECTS_TOKEN from environment');
  TOKEN = GH_TOKEN;
} else if (GITHUB_TOKEN) {
  console.log('Using GITHUB_TOKEN from environment (workflow token)');
  TOKEN = GITHUB_TOKEN;
} else {
  // Do NOT fail the build if no token is present. Some environments (like Vercel) may provide their own tokens
  // or you might prefer to use a checked-in sample `public/projects.json` during development.
  console.warn('No GitHub token found in environment. Skipping fetch. If you expect a fetch, set GH_PROJECTS_TOKEN in Actions secrets.');
  // Exit 0 so the build can continue (use existing public/projects.json if present)
  process.exit(0);
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
