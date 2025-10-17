// Encapsulates batching of short UI strings to translate and maps results back onto node
async function translateTitlesBatch(node, translateWithCache, shouldTranslateUI) {
  if (!node || !translateWithCache || !shouldTranslateUI) return;
  try {
    const titleTasks = [];
    const mapToResultIndex = [];
    const summaryForTranslation = (node.summary && typeof node.summary === 'string') ? node.summary : '';
    const docsTitleForTranslation = (node.docsTitle && typeof node.docsTitle === 'string') ? node.docsTitle : '';

    if (shouldTranslateUI(summaryForTranslation)) { titleTasks.push(translateWithCache(node.name, summaryForTranslation)); mapToResultIndex.push(['summary']); }
    if (shouldTranslateUI(docsTitleForTranslation)) { titleTasks.push(translateWithCache(node.name, docsTitleForTranslation)); mapToResultIndex.push(['docsTitle']); }
    if (node.repoDocs) {
      if (node.repoDocs.apiDocumentation && shouldTranslateUI(node.repoDocs.apiDocumentation.title)) { titleTasks.push(translateWithCache(node.name, node.repoDocs.apiDocumentation.title)); mapToResultIndex.push(['repoDocs','apiDocumentation','title']); }
      if (node.repoDocs.architectureOverview && shouldTranslateUI(node.repoDocs.architectureOverview.title)) { titleTasks.push(translateWithCache(node.name, node.repoDocs.architectureOverview.title)); mapToResultIndex.push(['repoDocs','architectureOverview','title']); }
      if (node.repoDocs.testing && node.repoDocs.testing.testingDocs && shouldTranslateUI(node.repoDocs.testing.testingDocs.title)) { titleTasks.push(translateWithCache(node.name, node.repoDocs.testing.testingDocs.title)); mapToResultIndex.push(['repoDocs','testing','testingDocs','title']); }
    }
    const results = await Promise.all(titleTasks);
    for (let ri = 0; ri < results.length; ri++) {
      const res = results[ri] || { text: null };
      const pathArr = mapToResultIndex[ri];
      if (!pathArr || !Array.isArray(pathArr) || !res || !res.text) continue;
      try {
        if (pathArr.length === 1 && pathArr[0] === 'summary') node.summary_de = res.text;
        else if (pathArr.length === 1 && pathArr[0] === 'docsTitle') node.docsTitle_de = res.text;
        else if (pathArr[0] === 'repoDocs') {
          if (!node.repoDocs) node.repoDocs = {};
          if (pathArr[1] === 'apiDocumentation') {
            node.repoDocs.apiDocumentation = node.repoDocs.apiDocumentation || {};
            node.repoDocs.apiDocumentation.title_de = res.text;
          }
          if (pathArr[1] === 'architectureOverview') {
            node.repoDocs.architectureOverview = node.repoDocs.architectureOverview || {};
            node.repoDocs.architectureOverview.title_de = res.text;
          }
          if (pathArr[1] === 'testing' && pathArr[2] === 'testingDocs') {
            node.repoDocs.testing = node.repoDocs.testing || {};
            node.repoDocs.testing.testingDocs = node.repoDocs.testing.testingDocs || {};
            node.repoDocs.testing.testingDocs.title_de = res.text;
          }
        }
      } catch (e) { /* ignore mapping failures */ }
    }
  } catch (e) { if (process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true') console.log('translateTitlesBatch error', e && e.message); }
}

module.exports = { translateTitlesBatch };
