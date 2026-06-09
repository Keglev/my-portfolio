/**
 * Builds the raw GitHub URL for a project's preview image.
 * Used as a fallback when the local /projects_media/ copy is absent.
 *
 * @param {string} repoName - Repository name on GitHub
 * @param {string} [branch='main'] - Branch to read the image from
 * @returns {string} Raw GitHub content URL
 */
export const getProjectImageUrl = (repoName, branch = 'main') => {
  return `https://raw.githubusercontent.com/keglev/${repoName}/${branch}/src/assets/imgs/project-image.png`;
};

/**
 * Resolves the best available preview image for a project.
 * Prefers an explicit primaryImage field, then a /projects_media/ path found in
 * the README, and finally falls back to the raw GitHub URL.
 *
 * @param {object} project - Project data object from projects.json
 * @returns {string} Image URL or raw GitHub fallback
 */
export const getPrimaryImage = (project) => {
  try {
    if (project && project.primaryImage) return project.primaryImage;
    const readme = project.object && project.object.text;
    if (readme) {
      const re = new RegExp('/projects_media/' + project.name + '/[^ "\')]+', 'i');
      const m = readme.match(re);
      if (m && m[0]) return m[0];
    }
  } catch (e) {
    // ignore
  }
  return getProjectImageUrl(project.name);
};

/**
 * Generates an inline SVG data URI to show when no real project image is found.
 * Escapes the title to prevent SVG text injection.
 *
 * @param {string} title - Project name displayed inside the placeholder
 * @returns {string} data:image/svg+xml URI
 */
export const generatePlaceholderSVGDataUrl = (title) => {
  const safe = (title || 'Project').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675' viewBox='0 0 1200 675'><rect width='100%' height='100%' fill='%230f2238' rx='8'/><text x='50%' y='45%' fill='%239ec7ef' font-family='Arial, Helvetica, sans-serif' font-size='36' font-weight='600' text-anchor='middle'>Image not available</text><text x='50%' y='58%' fill='%237aa7d9' font-family='Arial, Helvetica, sans-serif' font-size='20' text-anchor='middle'>${safe}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

/**
 * Extracts and sanitizes the text under an "About" heading in a README.
 * Strips Markdown syntax so the result can render as plain text in a card summary.
 *
 * @param {string|null} readmeText - Raw README content
 * @returns {string|null} Truncated plain-text excerpt, or null if no About heading exists
 */
export const getAboutSection = (readmeText) => {
  if (!readmeText) return null;
  const match = readmeText.match(/(^|\n)#{1,6}\s*about\b/i);
  if (!match) return null;
  const start = match.index + match[0].length;
  const after = readmeText.slice(start);
  const lines = after.split('\n');
  const aboutLines = [];
  for (const line of lines) {
    if (/^#{1,6}\s+/.test(line)) break;
    if (line.trim()) aboutLines.push(line.trim());
  }
  if (aboutLines.length === 0) return null;
  let about = aboutLines.join(' ');
  about = about.replace(/^#+\s*/, '')
               .replace(/\*\*(.*?)\*\*/g, '$1')
               .replace(/\*(.*?)\*/g, '$1')
               .replace(/`([^`]*)`/g, '$1')
               .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
               .replace(/<[^>]+>/g, '')
               .replace(/\s+/g, ' ')
               .trim();
  const MAX = 240;
  return about.length > MAX ? about.slice(0, MAX).trim() + '...' : about;
};

/**
 * Parses **bold** technology names from the Technologies section of a README.
 * Stops collecting at the next heading that is the same level or higher than the
 * Technologies heading, so sibling sections are not included.
 *
 * @param {string|null} readmeText - Raw README content
 * @returns {string[]} Deduplicated list of normalized technology names
 */
export const getTechnologyWords = (readmeText) => {
  if (!readmeText) return [];
  const lines = readmeText.split(/\r?\n/);
  let startIndex = -1;
  let headingLevel = 0;
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].trim();
    const m = h.match(/^#{1,6}\s*(.*)$/);
    if (m) {
      const title = (m[1] || '').toLowerCase();
      if (/\btech\b|technolog/i.test(title)) {
        startIndex = i + 1;
        const hashes = (h.match(/^#+/) || [''])[0];
        headingLevel = hashes.length || 0;
        break;
      }
    }
  }
  if (startIndex === -1) return [];

  let endIndex = lines.length;
  for (let i = startIndex; i < lines.length; i++) {
    const h = lines[i].trim();
    const m = h.match(/^#{1,6}\s*(.*)$/);
    if (m) {
      const hashes = (h.match(/^#+/) || [''])[0];
      const level = hashes.length || 0;
      // stop at the next heading that is the same or higher level than the tech heading
      if (headingLevel && level <= headingLevel) { endIndex = i; break; }
      // otherwise, it's a subheading (e.g., ###) and we continue
    }
  }

  const sectionText = lines.slice(startIndex, endIndex).join('\n');
  const techWords = [];
  const sectionLines = sectionText.split(/\r?\n/);
  const boldRe = /\*\*([^*]+?)\*\*/g;
  for (const l of sectionLines) {
    if (!l || !l.trim()) continue;
    const matches = Array.from(l.matchAll(boldRe));
    for (const m of matches) {
      const raw = (m && m[1]) ? m[1].trim() : '';
      if (!raw) continue;
      const token = normalizeTechToken(raw);
      if (token && !techWords.includes(token)) techWords.push(token);
    }
  }

  return techWords;
};

function normalizeTechToken(raw) {
  if (!raw) return null;
  let token = String(raw).trim();
  const p = token.indexOf('(');
  if (p !== -1) token = token.slice(0, p).trim();
  const stripChars = new Set(['-', ':', '(', ')', '[', ']', '"', "'", ',', '.', ';']);
  while (token.length && (token[0].trim() === '' || stripChars.has(token[0]))) token = token.slice(1);
  while (token.length && (token[token.length - 1].trim() === '' || stripChars.has(token[token.length - 1]))) token = token.slice(0, -1);
  token = token.trim();
  return token || null;
}

/**
 * Converts a raw.githubusercontent.com URL to its GitHub blob viewer equivalent.
 * Raw URLs serve plain text; blob URLs render with GitHub's syntax highlighting
 * and standard file navigation UI.
 *
 * @param {string} link
 * @returns {string} GitHub blob URL, or the original link unchanged if it doesn't match the pattern
 */
export const convertRawToBlob = (link) => {
  if (!link) return link;
  const m = link.match(/^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/i);
  if (!m) return link;
  const [, user, repo, branch, path] = m;
  return `https://github.com/${user}/${repo}/blob/${branch}/${path}`;
};
