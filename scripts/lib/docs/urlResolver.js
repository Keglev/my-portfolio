/**
 * Converts a docs href to an absolute URL. When no GitHub token is present the
 * function prefers public GitHub Pages or blob URLs over raw.githubusercontent.com,
 * because raw URLs require authentication for private repos and trigger CORS issues
 * in the browser. When a token is available, raw URLs are always safe to use.
 *
 * @param {string} href - Link extracted from a README (may be relative)
 * @param {string} repoName - Repository name used to build absolute URLs
 * @returns {string} Absolute URL suitable for the current environment
 */
function toRawGithub(href, repoName) {
  if (!href) return href;
  if (/^https?:\/\//i.test(href)) {
    if (!(process.env.GITHUB_TOKEN || process.env.GH_PROJECTS_TOKEN)) {
      const rawMatch = String(href).match(/^https?:\/\/raw\.githubusercontent\.com\/keglev\/([^/]+)\/(?:main|master)\/(.+)$/i);
      if (rawMatch) {
        const [, repo, rest] = rawMatch;
        return /\.md$/i.test(rest)
          ? `https://github.com/keglev/${repo}/blob/main/${rest}`
          : `https://keglev.github.io/${repo}/${rest}`;
      }
      const blobMatch = String(href).match(/^https?:\/\/github\.com\/keglev\/([^/]+)\/blob\/(?:main|master)\/(.+)$/i);
      if (blobMatch) {
        const [, repo, rest] = blobMatch;
        const safe = /^(?:docs\/architecture\/.+\.(?:html|md)|docs\/.+\.(?:html|md)|src\/(?:main\/)?docs\/.+\.(?:html|md))$/i;
        if (safe.test(rest) && !/\.md$/i.test(rest)) return `https://keglev.github.io/${repo}/${rest}`;
      }
    }
    return href;
  }
  let p = String(href).trim().replace(/^<|>$/g, '').replace(/^\.\//, '').replace(/^\//, '');
  p = p.replace(/\.\.\//g, '');
  if (!repoName) return p;
  if (process.env.GITHUB_TOKEN || process.env.GH_PROJECTS_TOKEN) {
    return `https://raw.githubusercontent.com/keglev/${repoName}/main/${p}`;
  }
  const safe = /^(?:docs\/architecture\/.+\.(?:html|md)|docs\/.+\.(?:html|md)|src\/(?:main\/)?docs\/.+\.(?:html|md))$/i;
  if (safe.test(p)) {
    const cleaned = p.replace(/^\/*/, '');
    return /\.md$/i.test(cleaned)
      ? `https://github.com/keglev/${repoName}/blob/main/${cleaned}`
      : `https://keglev.github.io/${repoName}/${cleaned}`;
  }
  return p;
}

/**
 * Passes absolute URLs through unchanged; converts relative paths via toRawGithub.
 *
 * @param {string} href - Link to normalize
 * @param {string} repoName - Repository name for building absolute URLs
 * @returns {string} Absolute URL
 */
function normalizeIfRelative(href, repoName) {
  if (!href) return href;
  if (/^https?:\/\//i.test(href)) return href;
  return toRawGithub(href, repoName);
}

module.exports = { toRawGithub, normalizeIfRelative };
