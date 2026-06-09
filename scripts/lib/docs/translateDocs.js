const DEBUG_FETCH = process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true';

function shouldTranslate(s) {
  try { return s && typeof s === 'string' && s.trim().length > 0 && s.trim().length <= 300; } catch (e) { return false; }
}

async function translateDescriptions(out, repoName, translateFn) {
  if (out.architectureOverview && out.architectureOverview.description) {
    const t = await translateFn(repoName, out.architectureOverview.description);
    out.architectureOverview.description_de = t && t.text ? t.text : null;
  }
  if (out.apiDocumentation && out.apiDocumentation.description) {
    const t = await translateFn(repoName, out.apiDocumentation.description);
    out.apiDocumentation.description_de = t && t.text ? t.text : null;
  }
  if (out.testing && Array.isArray(out.testing.coverage)) {
    for (const cov of out.testing.coverage) {
      if (cov.description) {
        const t = await translateFn(repoName, cov.description);
        cov.description_de = t && t.text ? t.text : null;
      }
    }
  }
  if (out.testing && out.testing.testingDocs && out.testing.testingDocs.description) {
    const t = await translateFn(repoName, out.testing.testingDocs.description);
    out.testing.testingDocs.description_de = t && t.text ? t.text : null;
  }
}

async function translateTitles(out, repoName, translateFn) {
  if (out.architectureOverview && shouldTranslate(out.architectureOverview.title)) {
    const t = await translateFn(repoName, out.architectureOverview.title);
    out.architectureOverview.title_de = t && t.text ? t.text : null;
  }
  if (out.apiDocumentation && shouldTranslate(out.apiDocumentation.title)) {
    const t = await translateFn(repoName, out.apiDocumentation.title);
    out.apiDocumentation.title_de = t && t.text ? t.text : null;
  }
  if (out.testing && out.testing.testingDocs && shouldTranslate(out.testing.testingDocs.title)) {
    const t = await translateFn(repoName, out.testing.testingDocs.title);
    out.testing.testingDocs.title_de = t && t.text ? t.text : null;
  }
}

/**
 * Translates all description and title fields in the repoDocs object to German.
 * Operates in two sequential passes (descriptions, then titles) so DeepL API
 * calls are batched by type rather than interleaved per-field.
 *
 * @param {object} out - repoDocs object with architectureOverview, apiDocumentation, testing fields
 * @param {string} repoName - Repository name passed through to the translation cache
 * @param {Function} translateFn - translateWithCache(repo, text) → Promise<{ text, status }>
 * @returns {Promise<void>}
 */
async function translateDocFields(out, repoName, translateFn) {
  try {
    await translateDescriptions(out, repoName, translateFn);
    await translateTitles(out, repoName, translateFn);
  } catch (e) { if (DEBUG_FETCH) console.log('translateDocFields error', e && e.message); }
}

module.exports = { translateDocFields };
