const parseReadme = require('../parseReadme');
const DEBUG_FETCH = process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true';
// dependencies: parseReadme only

function stripAstJsonFragments(s) {
  try {
    if (!s || typeof s !== 'string') return s;
    let t = s.replace(/\{\s*"type"\s*:\s*"[a-z]+"[\s\S]*?\}/gi, '');
    t = t.replace(/\s+/g, ' ').trim();
    return t === '' ? null : t;
  } catch (e) { return s; }
}

// Extract specific repo docs pieces per user's requirements and translate descriptions to German.
// Returns an object with found items or null when nothing found.
async function extractRepoDocsDetailed(readmeText, repoName, translateWithCache) {
  if (!readmeText || !readmeText.length) return null;
  const out = { architectureOverview: null, apiDocumentation: null, testing: null };
  try {
    const toRawGithub = (href) => {
      if (!href) return href;
      if (/^https?:\/\//i.test(href)) return href;
      let p = String(href).trim().replace(/^<|>$/g, '');
      p = p.replace(/^\.\//, '').replace(/^\//, '');
      if (!repoName) return p;
      return `https://raw.githubusercontent.com/keglev/${repoName}/main/${p}`;
    };
    try {
      const ast = parseReadme.parseMarkdown(readmeText);
      if (ast && Array.isArray(ast.children)) {
        for (let i = 0; i < ast.children.length; i++) {
          const n = ast.children[i];
          if (n.type === 'heading' && /architecture overview/i.test((n.children||[]).map(c=>c.value||'').join(''))) {
            let j = i+1;
            while (j < ast.children.length && ast.children[j].type !== 'heading') {
              const nn = ast.children[j];
              if (nn.type === 'paragraph' && Array.isArray(nn.children)) {
                for (const ch of nn.children) {
                  if (ch.type === 'link' && ch.url) {
                    const u = ch.url;
                    const label = (ch.children||[]).map(c=>c.value||'').join('');
                    if (/index/i.test(label) || /docs?/.test(u) || /index/.test(u)) {
                      out.architectureOverview = { title: label || 'Architecture Overview', link: toRawGithub(u), description: stripAstJsonFragments((nn.children||[]).filter(c=>c.type==='text').map(c=>c.value).join(' ').trim()) };
                      break;
                    }
                    if (!out.architectureOverview) out.architectureOverview = { title: label || 'Architecture Overview', link: toRawGithub(u), description: stripAstJsonFragments((nn.children||[]).filter(c=>c.type==='text').map(c=>c.value).join(' ').trim()) };
                  }
                }
              }
              if (nn.type === 'list' && Array.isArray(nn.children)) {
                for (const li of nn.children) {
                  const flatLinks = (parseReadme.extractTextFromListItem && typeof parseReadme.extractTextFromListItem === 'function') ? parseReadme.extractTextFromListItem(li) : parseReadme.flattenNodeText(li || '').replace(/\r?\n/g,' ');
                  const m = String(flatLinks).match(/https?:\/\/[^"']+/i);
                  if (m) {
                    const u = m[0];
                    if (/docs?|index|architecture/i.test(u) || /docs?/i.test(flatLinks)) {
                      out.architectureOverview = { title: 'Architecture Overview', link: toRawGithub(u), description: '' };
                      break;
                    }
                    if (!out.architectureOverview) out.architectureOverview = { title: 'Architecture Overview', link: toRawGithub(u), description: '' };
                  }
                }
              }
              j++;
            }
            if (out.architectureOverview) break;
          }
        }
      }
      if (!out.architectureOverview) {
        const archRe = /^\s*#{1,6}\s*.*architecture overview.*$/im;
        const archIdx = readmeText.search(archRe);
        if (archIdx !== -1) {
          const snippet = readmeText.slice(archIdx);
          const linkLine = snippet.match(/-\s*\.\s*\[([^\]]*Index[^\]]*)\]\(([^)]+)\)\s*[–—-]?\s*(.*)/i);
          if (linkLine) out.architectureOverview = { title: linkLine[1].trim(), link: toRawGithub(linkLine[2].trim()), description: stripAstJsonFragments((linkLine[3] || '').trim()) };
          else {
            const firstLink = snippet.match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\.?\/?[^)\s]+|[^)]+\.md)\)\s*-?\s*(.*)/i);
            if (firstLink) out.architectureOverview = { title: firstLink[1].trim(), link: toRawGithub(firstLink[2].trim()), description: stripAstJsonFragments((firstLink[3]||'').trim()) };
          }
        }
      }
    } catch (e) {
      if (DEBUG_FETCH) console.log('extractRepoDocsDetailed arch AST error', e && e.message);
    }

    try {
      const ast = parseReadme.parseMarkdown(readmeText);
      if (ast && Array.isArray(ast.children)) {
        for (let i = 0; i < ast.children.length; i++) {
          const n = ast.children[i];
          if (n.type === 'heading' && /api documentation hub|api docs|api documentation/i.test((n.children||[]).map(c=>c.value||'').join(''))) {
            let j = i+1;
            while (j < ast.children.length && ast.children[j].type !== 'heading') {
              const nn = ast.children[j];
              if (nn.type === 'paragraph' && Array.isArray(nn.children)) {
                for (const ch of nn.children) {
                  if (ch.type === 'link' && ch.url) {
                    const u = ch.url; const label = (ch.children||[]).map(c=>c.value||'').join('');
                    if (/complete api|api docs|swagger|openapi|docs?/i.test(label + ' ' + u)) {
                      out.apiDocumentation = { title: label || 'API Documentation', link: u, description: stripAstJsonFragments((nn.children||[]).filter(c=>c.type==='text').map(c=>c.value).join(' ').trim()) };
                      break;
                    }
                    if (!out.apiDocumentation) out.apiDocumentation = { title: label || 'API Documentation', link: u, description: stripAstJsonFragments((nn.children||[]).filter(c=>c.type==='text').map(c=>c.value).join(' ').trim()) };
                  }
                }
              }
              if (nn.type === 'list' && Array.isArray(nn.children)) {
                for (const li of nn.children) {
                  const flat = (parseReadme.extractTextFromListItem && typeof parseReadme.extractTextFromListItem === 'function') ? parseReadme.extractTextFromListItem(li) : parseReadme.flattenNodeText(li || '').replace(/\r?\n/g,' ');
                  const m = String(flat).match(/https?:\/\/[^"']+/i);
                  if (m) {
                    const u = m[0];
                    if (/api|openapi|swagger|docs?/i.test(u) || /api/i.test(flat)) {
                      out.apiDocumentation = { title: 'API Documentation', link: u, description: '' };
                      break;
                    }
                    if (!out.apiDocumentation) out.apiDocumentation = { title: 'API Documentation', link: u, description: '' };
                  }
                }
              }
              j++;
            }
            if (out.apiDocumentation) break;
          }
        }
      }
      if (!out.apiDocumentation) {
        const apiRe = /^\s*#{1,6}\s*.*api documentation hub.*$/im;
        const apiIdx = readmeText.search(apiRe);
        if (apiIdx !== -1) {
          const snippet = readmeText.slice(apiIdx);
          const compLink = snippet.match(/\[([^\]]*Complete API[^\]]*)\]\(([^)]+)\)\s*[–—-]?\s*(.*)/i);
          if (compLink) out.apiDocumentation = { title: compLink[1].trim(), link: compLink[2].trim(), description: stripAstJsonFragments((compLink[3]||'').trim()) };
          else {
            const firstLink = snippet.match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\.?\/?[^)\s]+|[^)]+\.md)\)\s*-?\s*(.*)/i);
            if (firstLink) out.apiDocumentation = { title: firstLink[1].trim(), link: firstLink[2].trim(), description: stripAstJsonFragments((firstLink[3]||'').trim()) };
          }
        }
      }
    } catch (e) {
      if (DEBUG_FETCH) console.log('extractRepoDocsDetailed api AST error', e && e.message);
    }

    try {
      const ast = parseReadme.parseMarkdown(readmeText);
      if (ast && Array.isArray(ast.children)) {
        for (let i = 0; i < ast.children.length; i++) {
          const n = ast.children[i];
          if (n.type === 'heading' && /testing & code quality|testing/i.test((n.children||[]).map(c=>c.value||'').join(''))) {
            let j = i+1;
            while (j < ast.children.length && ast.children[j].type !== 'heading') {
              const nn = ast.children[j];
              if (nn.type === 'paragraph' && Array.isArray(nn.children)) {
                for (const ch of nn.children) {
                  if (ch.type === 'link' && ch.url) {
                    const u = ch.url; const label = (ch.children||[]).map(c=>c.value||'').join('');
                    if (/coverage|coverage badge|coveralls|codecov|coverage report/i.test(label + ' ' + u)) {
                      out.testing = out.testing || {}; out.testing.coverage = { title: label || 'Coverage', link: u, description: stripAstJsonFragments((nn.children||[]).filter(c=>c.type==='text').map(c=>c.value).join(' ').trim()) };
                    }
                    if (/testing architecture|testing docs|test architecture/i.test(label + ' ' + u)) {
                      out.testing = out.testing || {}; out.testing.testingDocs = { title: label || 'Testing Architecture', link: u, description: stripAstJsonFragments((nn.children||[]).filter(c=>c.type==='text').map(c=>c.value).join(' ').trim()) };
                    }
                    if (out.testing && out.testing.coverage && out.testing.testingDocs) break;
                    if (!out.testing) out.testing = out.testing || {};
                  }
                }
              }
              if (nn.type === 'list' && Array.isArray(nn.children)) {
                for (const li of nn.children) {
                  const flat = (parseReadme.extractTextFromListItem && typeof parseReadme.extractTextFromListItem === 'function') ? parseReadme.extractTextFromListItem(li) : parseReadme.flattenNodeText(li || '').replace(/\r?\n/g,' ');
                  const m = String(flat).match(/https?:\/\/[^"']+/i);
                  if (m) {
                    const u = m[0];
                    if (/coverage|codecov|coveralls/i.test(u)) {
                      out.testing = out.testing || {};
                      out.testing.coverage = out.testing.coverage || { title: 'Coverage', link: u, description: '' };
                    }
                    if (/testing|test|architecture/i.test(u)) {
                      out.testing = out.testing || {};
                      out.testing.testingDocs = out.testing.testingDocs || { title: 'Testing Architecture', link: u, description: '' };
                    }
                  }
                }
              }
              j++;
            }
            if (out.testing && (out.testing.coverage || out.testing.testingDocs)) break;
          }
        }
      }
      if (!out.testing) {
        const testRe = /^\s*#{1,6}\s*.*testing & code quality.*$/im;
        const testIdx = readmeText.search(testRe);
        if (testIdx !== -1) {
          const snippet = readmeText.slice(testIdx);
          const coverageMatch = snippet.match(/\[([^\]]*coverage[^\]]*)\]\((https?:\/\/[^)\s]+)\)\s*[–—-]?\s*(.*)/i);
          if (coverageMatch) { out.testing = out.testing || {}; out.testing.coverage = { title: coverageMatch[1].trim(), link: coverageMatch[2].trim(), description: stripAstJsonFragments((coverageMatch[3]||'').trim()) }; }
          const archTestMatch = snippet.match(/\[([^\]]*Testing Architecture Documentation[^\]]*)\]\(([^)]+)\)\s*[–—-]?\s*(.*)/i);
          if (archTestMatch) { out.testing = out.testing || {}; out.testing.testingDocs = { title: archTestMatch[1].trim(), link: archTestMatch[2].trim(), description: stripAstJsonFragments((archTestMatch[3]||'').trim()) }; }
        }
      }
    } catch (e) {
      if (DEBUG_FETCH) console.log('extractRepoDocsDetailed testing AST error', e && e.message);
    }

    const normalizeIfRelative = (href) => {
      if (!href) return href;
      if (/^https?:\/\//i.test(href)) return href;
      return toRawGithub(href);
    };
    if (out.architectureOverview && out.architectureOverview.link) out.architectureOverview.link = normalizeIfRelative(out.architectureOverview.link);
    if (out.apiDocumentation && out.apiDocumentation.link) out.apiDocumentation.link = normalizeIfRelative(out.apiDocumentation.link);
    if (out.testing && out.testing.testingDocs && out.testing.testingDocs.link) out.testing.testingDocs.link = normalizeIfRelative(out.testing.testingDocs.link);

    if (out.architectureOverview && out.architectureOverview.description) {
      const t = translateWithCache ? await translateWithCache(repoName, out.architectureOverview.description) : { text: null };
      out.architectureOverview.description_de = t && t.text ? t.text : null;
    }
    if (out.apiDocumentation && out.apiDocumentation.description) {
      const t = translateWithCache ? await translateWithCache(repoName, out.apiDocumentation.description) : { text: null };
      out.apiDocumentation.description_de = t && t.text ? t.text : null;
    }
    if (out.testing) {
      if (out.testing.coverage && out.testing.coverage.description) {
        const t = translateWithCache ? await translateWithCache(repoName, out.testing.coverage.description) : { text: null };
        out.testing.coverage.description_de = t && t.text ? t.text : null;
      }
      if (out.testing.testingDocs && out.testing.testingDocs.description) {
        const t = translateWithCache ? await translateWithCache(repoName, out.testing.testingDocs.description) : { text: null };
        out.testing.testingDocs.description_de = t && t.text ? t.text : null;
      }
    }

    try {
      if (out.architectureOverview && shouldTranslateUI && typeof shouldTranslateUI === 'function' && shouldTranslateUI(out.architectureOverview.title)) {
        const tt = translateWithCache ? await translateWithCache(repoName, out.architectureOverview.title) : { text: null };
        out.architectureOverview.title_de = tt && tt.text ? tt.text : null;
      }
      if (out.apiDocumentation && shouldTranslateUI && typeof shouldTranslateUI === 'function' && shouldTranslateUI(out.apiDocumentation.title)) {
        const tt = translateWithCache ? await translateWithCache(repoName, out.apiDocumentation.title) : { text: null };
        out.apiDocumentation.title_de = tt && tt.text ? tt.text : null;
      }
      if (out.testing && out.testing.testingDocs && shouldTranslateUI && typeof shouldTranslateUI === 'function' && shouldTranslateUI(out.testing.testingDocs.title)) {
        const tt = translateWithCache ? await translateWithCache(repoName, out.testing.testingDocs.title) : { text: null };
        out.testing.testingDocs.title_de = tt && tt.text ? tt.text : null;
      }
    } catch (e) { if (DEBUG_FETCH) console.log('title translation failed', e && e.message); }
  } catch (e) { if (DEBUG_FETCH) console.log('extractRepoDocsDetailed error', e && e.message); }
  const foundAny = (out.architectureOverview || out.apiDocumentation || out.testing) && ( (out.architectureOverview && out.architectureOverview.link) || (out.apiDocumentation && out.apiDocumentation.link) || (out.testing && (out.testing.coverage || out.testing.testingDocs)) );
  return foundAny ? out : null;
}

// minimal local helper guard (import parseReadme's shouldTranslateUI when available)
function shouldTranslateUI(s) {
  try { return s && typeof s === 'string' && s.trim().length > 0 && s.trim().length <= 300; } catch (e) { return false; }
}

module.exports = { extractRepoDocsDetailed, shouldTranslateUI };
