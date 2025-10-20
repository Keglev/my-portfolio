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
  const techMatch = readmeText.match(/##+\s*Technologies/i);
  if (!techMatch) return [];
  const contentAfterTech = readmeText.substring(techMatch.index).split('\n').slice(1);
  const techWords = [];
  for (let line of contentAfterTech) {
    if (line.trim().startsWith('#')) break;
    if (!line.trim() || line.toLowerCase().includes('contributing') || line.startsWith('[')) continue;
    // Extract all bold tokens like **Docker** or **Node.js**
    const bolds = Array.from(line.matchAll(/\*\*([^*][^*]*?)\*\*/g));
    for (const b of bolds) {
      const token = (b && b[1]) ? b[1].trim() : null;
      if (token) techWords.push(token);
    }
  }
  return techWords;
};
