// Utility helpers for Projects component
export const getProjectImageUrl = (repoName, branch = 'main') => {
  return `https://raw.githubusercontent.com/keglev/${repoName}/${branch}/src/assets/imgs/project-image.png`;
};

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

export const generatePlaceholderSVGDataUrl = (title) => {
  const safe = (title || 'Project').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675' viewBox='0 0 1200 675'><rect width='100%' height='100%' fill='%230f2238' rx='8'/><text x='50%' y='45%' fill='%239ec7ef' font-family='Arial, Helvetica, sans-serif' font-size='36' font-weight='600' text-anchor='middle'>Image not available</text><text x='50%' y='58%' fill='%237aa7d9' font-family='Arial, Helvetica, sans-serif' font-size='20' text-anchor='middle'>${safe}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

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

export const getTechnologyWords = (readmeText) => {
  if (!readmeText) return [];
  const lines = readmeText.split(/\r?\n/);
  // locate start of technologies section
  let startIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].trim();
    const m = h.match(/^#{1,6}\s*(.*)$/);
    if (m) {
      const title = (m[1] || '').toLowerCase();
      if (/\btech\b|technolog/i.test(title)) { startIndex = i + 1; break; }
    }
  }
  if (startIndex === -1) return [];

  // find end of section
  let endIndex = lines.length;
  for (let i = startIndex; i < lines.length; i++) {
    if (/^#{1,6}\s+/.test(lines[i])) { endIndex = i; break; }
  }

  const sectionText = lines.slice(startIndex, endIndex).join('\n');
  const techWords = [];

  let pos = 0;
  while (pos < sectionText.length) {
    const open = sectionText.indexOf('**', pos);
    if (open === -1) break;
    const close = sectionText.indexOf('**', open + 2);
    if (close === -1) {
      // unmatched opener: break (end of section reached without a closer)
      break;
    }
    let content = sectionText.slice(open + 2, close).replace(/\s+/g, ' ').trim();
    if (content) {
      const token = normalizeTechToken(content);
      if (token && !techWords.includes(token)) techWords.push(token);
    }
    pos = close + 2;
  }

  return techWords;
};

function normalizeTechToken(raw) {
  if (!raw) return null;
  let token = String(raw).trim();
  // remove any trailing parenthetical piece
  const p = token.indexOf('(');
  if (p !== -1) token = token.slice(0, p).trim();
  // trim common surrounding punctuation
  const stripChars = new Set(['-', ':', '(', ')', '[', ']', '"', "'", ',', '.', ';']);
  while (token.length && (token[0].trim() === '' || stripChars.has(token[0]))) token = token.slice(1);
  while (token.length && (token[token.length - 1].trim() === '' || stripChars.has(token[token.length - 1]))) token = token.slice(0, -1);
  token = token.trim();
  return token || null;
}
