/**
 * @file injectBackLink.test.js
 * @module src/__tests__/scripts/ci/injectBackLink
 * @testing scripts/ci/injectBackLink.js
 * @description Contract tests for the back-to-docs link injector that
 * api-docs.yml runs over the coverage report and the code reference.
 *
 * Contract:
 * - Injects the anchor immediately after the opening <body> tag, whatever
 *   attributes that tag carries.
 * - Is idempotent: a page that already carries id="back-to-docs" is left
 *   byte-identical and is NOT written back. gh-pages is republished, not
 *   rebuilt, so this runs over its own previous output routinely.
 * - Never writes a file it did not change, and never throws on a missing
 *   file — the coverage download is continue-on-error, so the report can
 *   legitimately be absent.
 * - Takes colours from the theme's custom properties, not literals, so the
 *   link keeps following the docs theme.
 *
 * The filesystem is injected rather than mocked at module scope: these
 * assertions are about which calls happen (write vs. no write), which a
 * temp-directory test would only show indirectly through mtimes.
 */
import {
  buildMarkup,
  injectIntoHtml,
  injectIntoFile,
  runCli,
  LINK_ID,
  DEFAULT_HREF,
} from '../../../../scripts/ci/injectBackLink.js';

const PAGE = '<!DOCTYPE html><html><head><title>Coverage</title></head><body class="cov"><h1>Report</h1></body></html>';

/** Minimal fs double: an in-memory file table. */
function fakeFs(files) {
  return {
    existsSync: vi.fn((filePath) => Object.hasOwn(files, filePath)),
    readFileSync: vi.fn((filePath) => files[filePath]),
    writeFileSync: vi.fn((filePath, contents) => { files[filePath] = contents; }),
  };
}

describe('injectBackLink', () => {
  describe('buildMarkup', () => {
    it('should style the link from theme tokens rather than colour literals', () => {
      const markup = buildMarkup(DEFAULT_HREF);

      expect(markup).toContain('/my-portfolio/_theme/css/tokens.css');
      expect(markup).toContain('var(--surface,');
      expect(markup).toContain('var(--accent,');
    });

    it('should point the anchor at the href it is given', () => {
      const markup = buildMarkup('/elsewhere/');

      expect(markup).toContain(`<a id="${LINK_ID}" href="/elsewhere/">`);
    });
  });

  describe('injectIntoHtml', () => {
    it('should insert the link directly after the opening body tag', () => {
      const { html, status } = injectIntoHtml(PAGE, DEFAULT_HREF);

      expect(status).toBe('injected');
      expect(html).toContain(`<body class="cov"><link rel="stylesheet"`);
      expect(html).toContain(`id="${LINK_ID}"`);
      expect(html.indexOf(LINK_ID)).toBeLessThan(html.indexOf('<h1>Report</h1>'));
    });

    it('should leave a page that already carries the link untouched', () => {
      const once = injectIntoHtml(PAGE, DEFAULT_HREF).html;

      const { html, status } = injectIntoHtml(once, DEFAULT_HREF);

      expect(status).toBe('present');
      expect(html).toBe(once);
    });

    it('should report no-body and change nothing when there is no body tag', () => {
      const fragment = '<div>generated fragment</div>';

      const { html, status } = injectIntoHtml(fragment, DEFAULT_HREF);

      expect(status).toBe('no-body');
      expect(html).toBe(fragment);
    });

    it('should treat a $& in the href literally rather than expanding it', () => {
      const { html } = injectIntoHtml(PAGE, '/docs/$&/');

      expect(html).toContain('href="/docs/$&/"');
      expect(html).not.toContain('href="/docs/<body');
    });
  });

  describe('injectIntoFile', () => {
    it('should write the page back once when it injects', () => {
      const files = { 'docs/coverage/index.html': PAGE };
      const fileSystem = fakeFs(files);

      const status = injectIntoFile('docs/coverage/index.html', DEFAULT_HREF, fileSystem);

      expect(status).toBe('injected');
      expect(fileSystem.writeFileSync).toHaveBeenCalledTimes(1);
      expect(files['docs/coverage/index.html']).toContain(`id="${LINK_ID}"`);
    });

    it('should not rewrite a file whose link is already present', () => {
      const injected = injectIntoHtml(PAGE, DEFAULT_HREF).html;
      const fileSystem = fakeFs({ 'docs/coverage/index.html': injected });

      const status = injectIntoFile('docs/coverage/index.html', DEFAULT_HREF, fileSystem);

      expect(status).toBe('present');
      expect(fileSystem.writeFileSync).not.toHaveBeenCalled();
    });

    it('should report a missing file instead of throwing', () => {
      const fileSystem = fakeFs({});

      const status = injectIntoFile('docs/coverage/index.html', DEFAULT_HREF, fileSystem);

      expect(status).toBe('missing');
      expect(fileSystem.readFileSync).not.toHaveBeenCalled();
    });

    it('should default to the docs landing when no href is given', () => {
      const files = { 'page.html': PAGE };

      injectIntoFile('page.html', undefined, fakeFs(files));

      expect(files['page.html']).toContain(`href="${DEFAULT_HREF}"`);
    });
  });

  describe('runCli', () => {
    it('should report one line per target file and exit 0', () => {
      const log = vi.fn();

      const code = runCli(['node', 'injectBackLink.js', 'a.html', 'b.html'], log);

      expect(code).toBe(0);
      expect(log).toHaveBeenCalledTimes(2);
      expect(log).toHaveBeenCalledWith('[injectBackLink] a.html: missing');
      expect(log).toHaveBeenCalledWith('[injectBackLink] b.html: missing');
    });

    it('should exit non-zero when given no files, so a miswired step fails loudly', () => {
      const log = vi.fn();

      const code = runCli(['node', 'injectBackLink.js'], log);

      expect(code).toBe(1);
      expect(log).toHaveBeenCalledWith('[injectBackLink] No target files given.');
    });

    it('should read process.argv and log to the console when called with no arguments', () => {
      // The production call site is `process.exit(runCli())` with no
      // arguments, so both defaults are real entry-point behaviour rather
      // than test convenience.
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      const realArgv = process.argv;
      process.argv = ['node', 'scripts/ci/injectBackLink.js'];

      try {
        expect(runCli()).toBe(1);
        expect(consoleLog).toHaveBeenCalledWith('[injectBackLink] No target files given.');
      } finally {
        process.argv = realArgv;
        consoleLog.mockRestore();
      }
    });

    it('should not treat --href as a target file', () => {
      const log = vi.fn();

      const code = runCli(['node', 'injectBackLink.js', '--href=/x/', 'a.html'], log);

      expect(code).toBe(0);
      expect(log).toHaveBeenCalledTimes(1);
      expect(log).toHaveBeenCalledWith('[injectBackLink] a.html: missing');
    });
  });
});
