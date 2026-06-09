#!/usr/bin/env node

/**
 * Converts a relative or same-origin docs path to an absolute raw.githubusercontent.com URL.
 * Absolute URLs are returned unchanged.
 *
 * @param {string} href - Link extracted from a README
 * @param {string} repoName - GitHub repository name (used to build the raw URL)
 * @returns {string} Absolute URL
 */
function toRawGithub(href, repoName) {
  if (!href) return href;
  if (/^https?:\/\//i.test(href)) return href;
  const p = String(href).trim().replace(/^\.\//, '').replace(/^\//, '');
  return `https://raw.githubusercontent.com/keglev/${repoName}/main/${p}`;
}

/**
 * Ensures all link fields inside a node's repoDocs object are absolute URLs.
 * Relative paths (e.g. `docs/api.html`) are expanded via toRawGithub.
 *
 * @param {object} node - Repository node with optional `repoDocs` sub-object
 * @returns {object} The same node, mutated in place
 */
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
