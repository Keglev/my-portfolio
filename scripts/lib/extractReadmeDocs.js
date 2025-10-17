// REMOVED: use ./docs/extractReadmeDocs.js
// This shim was removed and replaced by the implementation in the `docs/` folder.
// Kept as an inert marker during migration. Do not require this file.

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
