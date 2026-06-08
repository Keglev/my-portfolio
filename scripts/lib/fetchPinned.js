#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const parseReadme = require('./parseReadme');
const fetchGithub = require('./fetchGithub');
const mediaDownloader = require('./media/mediaDownloader');
const translation = require('./translation');
const { shouldTranslateUI, translateWithCache } = translation;
const { getAxios } = require('./axiosLoader');

const TOKEN = process.env.GH_PROJECTS_TOKEN || process.env.GITHUB_TOKEN;
const DEBUG_FETCH = process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true';
const OUT_PATH = path.join(__dirname, '..', '..', 'public', 'projects.json');
const MEDIA_ROOT = path.join(__dirname, '..', '..', 'public', 'projects_media');

const QUERY = `query getPinned($login: String!) { user(login: $login) { pinnedItems(first: 12, types: [REPOSITORY]) { nodes { __typename ... on Repository { name description url } } } } }`;

async function fetchGraphQL() {
  if (!TOKEN) {
    try {
      const raw = fs.readFileSync(OUT_PATH, 'utf8');
      const nodes = JSON.parse(raw);
      if (Array.isArray(nodes)) return nodes;
    } catch (e) {
      throw new Error('No GH token set and failed to read existing public/projects.json; provide GH_PROJECTS_TOKEN or create public/projects.json');
    }
  }
  if (!fetchGithub || !fetchGithub.runGraphQL) throw new Error('fetchGithub.runGraphQL not available');
  return fetchGithub.runGraphQL(TOKEN, QUERY, { login: 'keglev' });
}

function convertToGhPages(link, repoName) {
  if (!link || !repoName) return null;
  const s = String(link).trim();
  const raw = s.match(/^https?:\/\/raw\.githubusercontent\.com\/keglev\/([^/]+)\/(?:main|master)\/(.+)$/i);
  if (raw && raw[1] && raw[2]) {
    const urlPath = raw[2].replace(/^\/*/, '');
    if (/\.md$/i.test(urlPath)) return null;
    if (/\bdocs\b/i.test(urlPath) || /api\.(?:md|html)$/i.test(urlPath) || /\bapi\b/i.test(urlPath)) {
      return `https://keglev.github.io/${raw[1]}/${urlPath}`;
    }
  }
  const blob = s.match(/^https?:\/\/github\.com\/keglev\/([^/]+)\/blob\/(?:main|master)\/(.+)$/i);
  if (blob && blob[1] && blob[2]) {
    const urlPath = blob[2].replace(/^\/*/, '');
    if (/\.md$/i.test(urlPath)) return null;
    if (/\bdocs\b/i.test(urlPath) || /api\.(?:md|html)$/i.test(urlPath) || /\bapi\b/i.test(urlPath)) {
      return `https://keglev.github.io/${blob[1]}/${urlPath}`;
    }
  }
  const rel = s.match(/(?:src\/(?:main\/)?docs|docs)\/(.+\.(?:md|html))/i);
  if (rel && rel[1]) return `https://keglev.github.io/${repoName}/${rel[0].replace(/^\/*/, '')}`;
  return null;
}

async function applyGithubIoPreferences(nodes) {
  const { applyGithubIoToNode } = require('./normalize/githubIoPreferer');
  for (const node of nodes) {
    try { await applyGithubIoToNode(node, getAxios, DEBUG_FETCH); } catch (e) { if (DEBUG_FETCH) console.log('applyGithubIoPreferences failed for', node.name, e && e.message); }
  }
}

function applyGhPagesConversion(nodes) {
  for (const node of nodes) {
    try {
      if (!node) continue;
      if (node.docsLink) { const c = convertToGhPages(node.docsLink, node.name); if (c) node.docsLink = c; }
      if (node.repoDocs) {
        const rd = node.repoDocs;
        if (rd.apiDocumentation && rd.apiDocumentation.link) { const c = convertToGhPages(rd.apiDocumentation.link, node.name); if (c) rd.apiDocumentation.link = c; }
        if (rd.architectureOverview && rd.architectureOverview.link) { const c = convertToGhPages(rd.architectureOverview.link, node.name); if (c) rd.architectureOverview.link = c; }
        if (rd.testing && rd.testing.testingDocs && rd.testing.testingDocs.link) { const c = convertToGhPages(rd.testing.testingDocs.link, node.name); if (c) rd.testing.testingDocs.link = c; }
      }
    } catch (e) { if (DEBUG_FETCH) console.log('applyGhPagesConversion failed for', node.name, e && e.message); }
  }
}

function runNormalizationPass(nodes) {
  const { normalizeRepoDocsLinks } = require('./normalize/normalize');
  for (const node of nodes) {
    try { normalizeRepoDocsLinks(node); } catch (e) { if (DEBUG_FETCH) console.log('normalize failed for', node.name, e && e.message); }
  }
}

async function fetchPinned() {
  try {
    const nodes = await fetchGraphQL();
    if (!Array.isArray(nodes)) throw new Error('Invalid response from GraphQL');
    mediaDownloader.ensureDir(MEDIA_ROOT);
    const repoNodes = nodes.filter(n => n && n.__typename === 'Repository');
    const nodeProcessor = require('./pipeline/nodeProcessor');
    for (const node of repoNodes) {
      try {
        await nodeProcessor.processNode(node, { getAxios, MEDIA_ROOT, parseReadme, translateWithCache, shouldTranslateUI, DEBUG_FETCH });
      } catch (e) { if (DEBUG_FETCH) console.log('nodeProcessor failed for', node.name, e && e.message); }
    }
    runNormalizationPass(nodes);
    await applyGithubIoPreferences(nodes);
    applyGhPagesConversion(nodes);
    const writer = require('./output/writeProjects');
    writer.writeProjectsJson(OUT_PATH, nodes);
    console.log('Wrote', OUT_PATH);
  } catch (err) {
    console.error('Failed to fetch pinned repositories:', (err && err.message) || err);
    process.exit(3);
  }
}

module.exports = { fetchPinned };
