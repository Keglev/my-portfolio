const parseReadme = require('../parseReadme');
const { toRawGithub, normalizeIfRelative } = require('./urlResolver');
const { extractArchitectureOverview } = require('./extractArchitecture');
const { extractApiDocumentation } = require('./extractApiDocs');
const { extractTestingLinks } = require('./extractTesting');
const { extractProductionUrl } = require('./extractProductionUrl');
const { translateDocFields } = require('./translateDocs');

const DEBUG_FETCH = process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true';

function stripAstJsonFragments(s) {
  try {
    if (!s || typeof s !== 'string') return s;
    let t = s.replace(/\{\s*"type"\s*:\s*"[a-z]+"[\s\S]*?\}/gi, '');
    t = t.replace(/\s+/g, ' ').trim();
    return t === '' ? null : t;
  } catch (e) { return s; }
}

async function extractRepoDocsDetailed(readmeText, repoName, translateWithCache) {
  if (!readmeText || !readmeText.length) return null;
  const out = { architectureOverview: null, apiDocumentation: null, testing: null, productionUrl: null };
  try {
    const ast = parseReadme.parseMarkdown(readmeText);
    const ctx = { toRawGithub: (href) => toRawGithub(href, repoName), parseReadme, strip: stripAstJsonFragments };
    out.architectureOverview = extractArchitectureOverview(ast, readmeText, ctx);
    out.apiDocumentation = extractApiDocumentation(ast, readmeText, ctx);
    out.testing = extractTestingLinks(ast, readmeText, ctx);
    out.productionUrl = extractProductionUrl(ast, readmeText, ctx);
    if (out.architectureOverview && out.architectureOverview.link) out.architectureOverview.link = normalizeIfRelative(out.architectureOverview.link, repoName);
    if (out.apiDocumentation && out.apiDocumentation.link) out.apiDocumentation.link = normalizeIfRelative(out.apiDocumentation.link, repoName);
    if (out.testing && out.testing.testingDocs && out.testing.testingDocs.link) out.testing.testingDocs.link = normalizeIfRelative(out.testing.testingDocs.link, repoName);
    if (out.productionUrl && out.productionUrl.link) out.productionUrl.link = normalizeIfRelative(out.productionUrl.link, repoName);
    if (translateWithCache) await translateDocFields(out, repoName, translateWithCache);
  } catch (e) { if (DEBUG_FETCH) console.log('extractRepoDocsDetailed error', e && e.message); }

  const foundAny = (out.architectureOverview && out.architectureOverview.link)
    || (out.apiDocumentation && out.apiDocumentation.link)
    || (out.testing && out.testing.coverage && out.testing.coverage.length > 0)
    || (out.productionUrl && out.productionUrl.link);

  if (!foundAny) {
    return {
      architectureOverview: null, apiDocumentation: null, testing: null,
      placeholder: { title: 'Under Construction', title_de: 'Noch in Entwicklung', description: 'Documentation will be developed soon', description_de: 'Dokumentation wird bald entwickelt' }
    };
  }
  return out;
}

function shouldTranslateUI(s) {
  try { return s && typeof s === 'string' && s.trim().length > 0 && s.trim().length <= 300; } catch (e) { return false; }
}

module.exports = { extractRepoDocsDetailed, shouldTranslateUI, stripAstJsonFragments };
