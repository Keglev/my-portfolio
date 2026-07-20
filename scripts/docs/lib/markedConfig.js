/**
 * @file markedConfig.js
 * @module scripts/docs/lib/markedConfig
 * @summary Bootstraps the marked markdown parser and configures heading-id
 * injection, exporting a ready-to-use parse function.
 * @enterprise Resolves marked's parse function across its v4-v14 API shapes
 * (named export vs. module-level function vs. .parse), since the exact
 * export shape has changed between major versions and this repo pins a
 * range, not one exact version. Exits the process on load if marked isn't
 * installed or no parse function can be resolved, matching build_docs.js's
 * prior fail-fast behavior -- this module is only ever required by that
 * script's rendering pipeline, never imported where a softer failure mode
 * would be appropriate.
 */
let markedModule;
try {
  markedModule = require('marked');
} catch {
  console.error(
    '[build_docs] marked is not installed.\n' +
    'Run: npm install --save-dev marked'
  );
  process.exit(1);
}

// Support marked v4-v14 (named export or module-level function)
const markedFn =
  typeof markedModule.marked === 'function'  ? markedModule.marked :
  typeof markedModule        === 'function'  ? markedModule        :
  typeof markedModule.parse  === 'function'  ? markedModule.parse  : null;

if (!markedFn) {
  console.error('[build_docs] Could not resolve a parse function from marked.');
  process.exit(1);
}

const RendererCtor =
  markedModule.Renderer ||
  (markedModule.marked && markedModule.marked.Renderer);

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

if (RendererCtor) {
  const renderer = new RendererCtor();

  // marked v5+ passes a token object; older versions pass (text, depth, ...)
  renderer.heading = function (tokenOrText, maybeDepth) {
    const text  = typeof tokenOrText === 'object' ? tokenOrText.text  : tokenOrText;
    const depth = typeof tokenOrText === 'object' ? tokenOrText.depth : maybeDepth;
    const id    = slugify(text.replace(/<[^>]+>/g, ''));
    return `<h${depth} id="${id}">${text}</h${depth}>\n`;
  };

  const setOptions = markedFn.setOptions || (markedModule.marked && markedModule.marked.setOptions);
  if (setOptions) setOptions.call(markedFn, { renderer });
}

module.exports = { markedFn };
