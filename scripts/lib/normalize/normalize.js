#!/usr/bin/env node
// Small normalization helpers for docs links and repoDocs
function toRawGithub(href, repoName) {
  if (!href) return href;
  if (/^https?:\/\//i.test(href)) return href;
  const p = String(href).trim().replace(/^\.\//, '').replace(/^\//, '');
  return `https://raw.githubusercontent.com/keglev/${repoName}/main/${p}`;
}

function normalizeRepoDocsLinks(node) {
  if (!node || !node.repoDocs) return node;
  try {
    if (node.repoDocs.architectureOverview && node.repoDocs.architectureOverview.link) {
      node.repoDocs.architectureOverview.link = toRawGithub(node.repoDocs.architectureOverview.link, node.name);
    }
    if (node.repoDocs.apiDocumentation && node.repoDocs.apiDocumentation.link) {
      node.repoDocs.apiDocumentation.link = toRawGithub(node.repoDocs.apiDocumentation.link, node.name);
    }
    if (node.repoDocs.testing && node.repoDocs.testing.testingDocs && node.repoDocs.testing.testingDocs.link) {
      node.repoDocs.testing.testingDocs.link = toRawGithub(node.repoDocs.testing.testingDocs.link, node.name);
    }
  } catch (e) { /* swallow */ }
  return node;
}

module.exports = { toRawGithub, normalizeRepoDocsLinks };
