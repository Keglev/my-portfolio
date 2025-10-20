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
