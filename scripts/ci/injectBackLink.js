/**
 * @file injectBackLink.js
 * @module scripts/ci/injectBackLink
 * @summary Injects a fixed-position "Back to docs" link into generated
 * report pages (the coverage report and the JSDoc code reference) that the
 * docs theme does not own and cannot template.
 * @enterprise Both reports are third-party generator output published to
 * gh-pages beside the docs site. A reader who follows a card from the docs
 * landing into either one has no way back except the browser button: the
 * generators emit their own shell, so the theme's header never appears.
 * Rewriting the generators' templates would mean forking them; injecting one
 * anchor post-generation would not.
 *
 * This is a script with tests rather than a sed line in api-docs.yml
 * because the behaviour that matters is conditional -- the injection must be
 * idempotent (gh-pages is not rebuilt from scratch, so a republished page
 * can already carry the link) and must tolerate a missing file (the coverage
 * download is continue-on-error, and the very first run has no artifact at
 * all). Neither condition is assertable in inline YAML.
 *
 * Usage (from repo root):
 *   node scripts/ci/injectBackLink.js docs/coverage/index.html docs/jsdoc/index.html
 *   node scripts/ci/injectBackLink.js --href=/other/ docs/coverage/index.html
 */
const fs = require('fs');

/** Marker id -- also the idempotency key: present means already injected. */
const LINK_ID = 'back-to-docs';

/** Default target: the docs landing at the gh-pages site root. */
const DEFAULT_HREF = '/my-portfolio/';

/** Matches the opening <body> tag, with or without attributes. */
const BODY_OPEN = /<body[^>]*>/i;

/**
 * Builds the markup injected into a report page.
 *
 * Colours come from the docs theme's token file rather than literals: the
 * link is a piece of the docs site that happens to sit on someone else's
 * page, so it has to keep following the theme when the theme changes.
 * tokens.css is published to gh-pages alongside the rest of docs/_theme and
 * declares custom properties only -- no element rules -- so loading it into
 * a generator's page cannot restyle that page. The var() fallbacks cover the
 * one case where that guarantee does not hold: a report opened from a local
 * directory, where the absolute stylesheet path resolves to nothing.
 *
 * The block is injected into <body> rather than <head> so that one marker,
 * at one insertion point, covers the whole injection.
 *
 * @param {string} href - Target of the link (the docs landing)
 * @returns {string}
 */
function buildMarkup(href) {
  return [
    `<link rel="stylesheet" href="/my-portfolio/_theme/css/tokens.css">`,
    `<style>#${LINK_ID}{position:fixed;top:8px;right:12px;z-index:9999;`,
    `padding:6px 12px;border-radius:var(--radius-sm,4px);`,
    `background:var(--surface,#1A1D2E);color:var(--text,#E2E8F0);`,
    `border:1px solid var(--border,#2D3047);`,
    `font:500 14px/1.2 Inter,system-ui,sans-serif;text-decoration:none}`,
    `#${LINK_ID}:hover{border-color:var(--accent,#3B82F6)}</style>`,
    `<a id="${LINK_ID}" href="${href}">&larr; Back to docs</a>`,
  ].join('');
}

/**
 * Returns `html` with the back link injected after the opening body tag.
 *
 * Returns the input unchanged when the link is already there (idempotent
 * republish) or when there is no <body> to inject into -- callers report
 * both, and neither is a failure.
 *
 * @param {string} html
 * @param {string} href
 * @returns {{html: string, status: 'injected'|'present'|'no-body'}}
 */
function injectIntoHtml(html, href) {
  if (html.includes(`id="${LINK_ID}"`)) return { html, status: 'present' };
  if (!BODY_OPEN.test(html)) return { html, status: 'no-body' };

  // Callback form, not a '$&...' replacement string: the href could contain a
  // '$&' sequence, which the string form would expand into the matched tag.
  return {
    html: html.replace(BODY_OPEN, (bodyTag) => bodyTag + buildMarkup(href)),
    status: 'injected',
  };
}

/**
 * Injects the link into one file, writing it back in place.
 *
 * @param {string} filePath
 * @param {string} href
 * @param {typeof fs} [fileSystem] - injected for testing
 * @returns {'injected'|'present'|'no-body'|'missing'}
 */
function injectIntoFile(filePath, href = DEFAULT_HREF, fileSystem = fs) {
  if (!fileSystem.existsSync(filePath)) return 'missing';

  const { html, status } = injectIntoHtml(fileSystem.readFileSync(filePath, 'utf8'), href);
  if (status === 'injected') fileSystem.writeFileSync(filePath, html, 'utf8');
  return status;
}

/**
 * CLI entry: injects into every path given, reporting one line per file.
 *
 * Exits 0 for every outcome except "no file argument". A missing report is
 * expected (coverage may not have been downloaded this run), and a page with
 * no <body> is worth reporting but is not worth failing a publish over.
 *
 * @param {string[]} argv - process.argv-shaped array
 * @param {(msg: string) => void} [log]
 * @returns {number} intended exit code
 */
function runCli(argv = process.argv, log = console.log) {
  const args = argv.slice(2);
  const hrefArg = args.find((arg) => arg.startsWith('--href='));
  const href = hrefArg ? hrefArg.slice('--href='.length) : DEFAULT_HREF;
  const files = args.filter((arg) => !arg.startsWith('--'));

  if (files.length === 0) {
    log('[injectBackLink] No target files given.');
    return 1;
  }

  for (const file of files) {
    log(`[injectBackLink] ${file}: ${injectIntoFile(file, href)}`);
  }
  return 0;
}

if (require.main === module) {
  process.exit(runCli());
}

module.exports = { buildMarkup, injectIntoHtml, injectIntoFile, runCli, LINK_ID, DEFAULT_HREF };
