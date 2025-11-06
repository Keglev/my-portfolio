#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
let axios = null;
function getAxios() {
  if (axios) return axios;
  try { const _a = require('axios'); axios = _a && _a.default ? _a.default : _a; return axios; } catch (e) { axios = null; return null; }
}
const parseReadme = require('./parseReadme');
const fetchGithub = require('./fetchGithub');
const mediaDownloader = require('./media/mediaDownloader');
const translation = require('./translation');
const shouldTranslateUI = translation.shouldTranslateUI;
const translateWithCache = translation.translateWithCache;
 
const TOKEN = process.env.GH_PROJECTS_TOKEN || process.env.GITHUB_TOKEN;
const DEBUG_FETCH = process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true';

const OUT_PATH = path.join(__dirname, '..', '..', 'public', 'projects.json');
const MEDIA_ROOT = path.join(__dirname, '..', '..', 'public', 'projects_media');

const QUERY = `query getPinned($login: String!) { user(login: $login) { pinnedItems(first: 12, types: [REPOSITORY]) { nodes { __typename ... on Repository { name description url } } } } }`;

async function fetchGraphQL() {
  // If we don't have a GitHub token, try to fall back to an existing
  // generated projects.json in the repo so the pipeline can run in
  // offline/unauthed mode and re-process existing nodes (e.g. to
  // re-normalize doc links using the extractor's safe fallback).
  if (!TOKEN) {
    try {
      const raw = fs.readFileSync(OUT_PATH, 'utf8');
      const nodes = JSON.parse(raw);
      if (Array.isArray(nodes)) return nodes;
    } catch (e) {
      // No token and couldn't read an existing projects.json file.
      // Bail with a clear error so callers understand how to proceed.
      throw new Error('No GH token set and failed to read existing public/projects.json; provide GH_PROJECTS_TOKEN or create public/projects.json');
    }
  }
  if (!fetchGithub || !fetchGithub.runGraphQL) throw new Error('fetchGithub.runGraphQL not available');
  return fetchGithub.runGraphQL(TOKEN, QUERY, { login: 'keglev' });
}

async function fetchPinned() {
  try {
    const nodes = await fetchGraphQL();
    if (!Array.isArray(nodes)) throw new Error('Invalid response from GraphQL');

  // ensure media root exists
    mediaDownloader.ensureDir(MEDIA_ROOT);

    // filter for repository nodes (pinnedItems can contain other types)
    const repoNodes = nodes.filter(n => n && n.__typename === 'Repository');
    const nodeProcessor = require('./pipeline/nodeProcessor');
    for (const node of repoNodes) {
      try {
        await nodeProcessor.processNode(node, { getAxios, MEDIA_ROOT, parseReadme, translateWithCache, shouldTranslateUI, DEBUG_FETCH });
      } catch (e) { if (DEBUG_FETCH) console.log('nodeProcessor failed for', node.name, e && e.message); }
    }

    const { normalizeRepoDocsLinks } = require('./normalize/normalize');
    // Final normalization pass
    try {
      for (const node of nodes) {
        try { normalizeRepoDocsLinks(node); } catch (e) { if (DEBUG_FETCH) console.log('final normalize failed for', node.name, e && e.message); }
      }
    } catch (e) { if (DEBUG_FETCH) console.log('final normalization pass error', e && e.message); }

    // Post-process: prefer github.io hosted docs pages when raw.githubusercontent links are found
    try {
      const { tryGithubIo } = require('./normalize/githubIoPreferer');
      for (const node of nodes) {
        try {
          if (node.docsLink && /raw\.githubusercontent\.com/i.test(node.docsLink)) {
            const prefer = await tryGithubIo(node, node.docsLink, getAxios, DEBUG_FETCH);
            if (prefer) node.docsLink = prefer;
          }
          if (node.repoDocs) {
            if (node.repoDocs.apiDocumentation && node.repoDocs.apiDocumentation.link && /raw\.githubusercontent\.com/i.test(node.repoDocs.apiDocumentation.link)) {
              const prefer = await tryGithubIo(node, node.repoDocs.apiDocumentation.link, getAxios, DEBUG_FETCH);
              if (prefer) node.repoDocs.apiDocumentation.link = prefer;
            }
            if (node.repoDocs.architectureOverview && node.repoDocs.architectureOverview.link && /raw\.githubusercontent\.com/i.test(node.repoDocs.architectureOverview.link)) {
              const prefer = await tryGithubIo(node, node.repoDocs.architectureOverview.link, getAxios, DEBUG_FETCH);
              if (prefer) node.repoDocs.architectureOverview.link = prefer;
            }
            if (node.repoDocs.testing && node.repoDocs.testing.testingDocs && node.repoDocs.testing.testingDocs.link && /raw\.githubusercontent\.com/i.test(node.repoDocs.testing.testingDocs.link)) {
              const prefer = await tryGithubIo(node, node.repoDocs.testing.testingDocs.link, getAxios, DEBUG_FETCH);
              if (prefer) node.repoDocs.testing.testingDocs.link = prefer;
            }
          }
        } catch (e) { if (DEBUG_FETCH) console.log('post-process github.io pref failed for', node.name, e && e.message); }
      }
    } catch (e) { if (DEBUG_FETCH) console.log('github.io post-process error', e && e.message); }

    // Automated, conservative post-processing: convert known raw/github blob or
    // repo-local docs paths into github.io URLs for nodes when they match safe
    // documentation patterns. This avoids leaving raw.githubusercontent links in
    // the final projects.json when the README indicates a docs path layout.
    try {
      const convertToGhPages = (link, repoName) => {
        if (!link || !repoName) return null;
        const s = String(link).trim();
        // raw.githubusercontent.com/keglev/<repo>/(main|master)/<path>
  const raw = s.match(/^https?:\/\/raw\.githubusercontent\.com\/keglev\/([^/]+)\/(?:main|master)\/(.+)$/i);
        if (raw && raw[1] && raw[2]) {
          const repo = raw[1];
          const path = raw[2].replace(/^\/*/, '');
          // Loosened safe check: convert if path contains a docs/ segment or looks like an API doc
          if (/\bdocs\b/i.test(path) || /api\.(?:md|html)$/i.test(path) || /\bapi\b/i.test(path)) {
            return `https://keglev.github.io/${repo}/${path}`;
          }
        }
        // github.com/keglev/<repo>/blob/(main|master)/<path>
  const blob = s.match(/^https?:\/\/github\.com\/keglev\/([^/]+)\/blob\/(?:main|master)\/(.+)$/i);
        if (blob && blob[1] && blob[2]) {
          const repo = blob[1];
          const path = blob[2].replace(/^\/*/, '');
          if (/\bdocs\b/i.test(path) || /api\.(?:md|html)$/i.test(path) || /\bapi\b/i.test(path)) {
            return `https://keglev.github.io/${repo}/${path}`;
          }
        }
        // Relative-looking paths (src/main/docs/..., docs/..., src/docs/...) already handled upstream
        // but as a final measure, if link contains those segments, build the gh-pages URL.
        const rel = s.match(/(?:src\/(?:main\/)?docs|docs)\/(.+\.(?:md|html))/i);
        if (rel && rel[1]) {
          const path = rel[0].replace(/^\/*/, '');
          return `https://keglev.github.io/${repoName}/${path}`;
        }
        return null;
      };

      for (const node of nodes) {
        try {
          if (node && node.repoDocs) {
            const rd = node.repoDocs;
            if (rd.apiDocumentation && rd.apiDocumentation.link) {
              const conv = convertToGhPages(rd.apiDocumentation.link, node.name);
              if (conv) rd.apiDocumentation.link = conv;
            }
            if (rd.architectureOverview && rd.architectureOverview.link) {
              const conv = convertToGhPages(rd.architectureOverview.link, node.name);
              if (conv) rd.architectureOverview.link = conv;
            }
            if (rd.testing && rd.testing.testingDocs && rd.testing.testingDocs.link) {
              const conv = convertToGhPages(rd.testing.testingDocs.link, node.name);
              if (conv) rd.testing.testingDocs.link = conv;
            }
          }
          // also consider top-level docsLink
          if (node && node.docsLink) {
            const conv = convertToGhPages(node.docsLink, node.name);
            if (conv) node.docsLink = conv;
          }
        } catch (e) { if (DEBUG_FETCH) console.log('automated gh-pages conversion failed for', node.name, e && e.message); }
      }
    } catch (e) { if (DEBUG_FETCH) console.log('automated gh-pages conversion error', e && e.message); }

    try {
      const writer = require('./output/writeProjects');
      writer.writeProjectsJson(OUT_PATH, nodes);
      console.log('Wrote', OUT_PATH);
    } catch (e) { fs.writeFileSync(OUT_PATH, JSON.stringify(nodes, null, 2), 'utf8'); console.log('Wrote', OUT_PATH); }
  } catch (err) {
    console.error('Failed to fetch pinned repositories:', (err && err.message) || err);
    process.exit(3);
  }
}

module.exports = { fetchPinned };
