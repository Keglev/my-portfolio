/**
 * @file buildDocs.test.js
 * @module src/__tests__/scripts/docs/buildDocs
 * @testing scripts/docs/build_docs.js
 * @description Contract tests for the docs build: CSS cascade
 * concatenation, bilingual landing assembly, and run()'s orchestration
 * (template preflight, page conversion, stylesheet and landing output).
 *
 * run() is driven against a temporary docs tree via its directory
 * overrides. Without that seam the only way to exercise it would be to let
 * it rewrite every tracked file under the repo's real docs/ as a side
 * effect of running the test suite.
 *
 * Out of scope: markdown rendering and the docs/ walk, both covered by
 * renderPages.test.js. Here they are only checked to be wired in.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assembleLanding, concatCss, run } from '../../../../scripts/docs/build_docs.js';

const CSS_PARTS = [
  'tokens.css', 'base.css', 'layout.css', 'components.css', 'content.css', 'landing.css',
];

let tmpRoot;
let docsDir;
let tmplDir;
let cssDir;

/** Builds a minimal but complete docs tree: templates, CSS parts, one page. */
function scaffold({ omitTemplate } = {}) {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'builddocs-'));
  docsDir = path.join(tmpRoot, 'docs');
  tmplDir = path.join(docsDir, '_theme', 'templates');
  cssDir = path.join(docsDir, '_theme', 'css');
  fs.mkdirSync(tmplDir, { recursive: true });
  fs.mkdirSync(cssDir, { recursive: true });

  const templates = {
    'header.html': '<title>{{TITLE}}</title>',
    'footer.html': '</footer>',
    'page.html': '<nav>{{TOC}}</nav><main>{{CONTENT}}</main>',
    'landing-en.html': '<main>EN LANDING</main>',
    'landing-de.html': '<main>DE LANDING</main>',
  };
  for (const [name, contents] of Object.entries(templates)) {
    if (name === omitTemplate) continue;
    fs.writeFileSync(path.join(tmplDir, name), contents, 'utf8');
  }
  CSS_PARTS.forEach((name) => {
    fs.writeFileSync(path.join(cssDir, name), `/* ${name} */`, 'utf8');
  });
  fs.writeFileSync(path.join(docsDir, 'guide.md'), '# Guide\n\nBody.', 'utf8');
}

describe('build_docs', () => {
  describe('concatCss', () => {
    it('should join the sources in the order given, since the cascade depends on it', () => {
      // tokens must precede anything referencing them, and landing.css must
      // come last so it can override shared component rules.
      const read = (name) => `/* ${name} */`;

      const css = concatCss(['tokens', 'base', 'landing'], read);

      expect(css).toBe('/* tokens */\n/* base */\n/* landing */');
    });

    it('should separate each source with a newline so a trailing comment cannot swallow the next file', () => {
      const read = (name) => (name === 'a' ? '/* unterminated-looking' : '.x{}');

      const css = concatCss(['a', 'b'], read);

      expect(css.split('\n')).toHaveLength(2);
    });

    it('should return an empty string when given no sources', () => {
      const css = concatCss([], () => 'unused');

      expect(css).toBe('');
    });

    it('should propagate a read failure rather than emitting a partial stylesheet', () => {
      // A half-written stylesheet would deploy silently broken styling; the
      // build must fail loudly instead.
      const read = (name) => {
        if (name === 'missing') throw new Error('ENOENT');
        return '.ok{}';
      };

      expect(() => concatCss(['ok', 'missing'], read)).toThrow('ENOENT');
    });
  });

  describe('assembleLanding', () => {
    it('should substitute the title into the header when assembling', () => {
      const html = assembleLanding('<title>{{TITLE}}</title>', '<main>', '</footer>', 'My Title');

      expect(html).toContain('<title>My Title</title>');
      expect(html).not.toContain('{{TITLE}}');
    });

    it('should order the output as header, body, then footer', () => {
      const html = assembleLanding('HEAD{{TITLE}}', 'BODY', 'FOOT', 'T');

      expect(html.indexOf('HEAD')).toBeLessThan(html.indexOf('BODY'));
      expect(html.indexOf('BODY')).toBeLessThan(html.indexOf('FOOT'));
    });

    it('should keep the two language variants distinct when given different bodies and titles', () => {
      // The EN and DE landings share a header and footer; only the body and
      // title differ, and mixing them up ships the wrong language.
      const en = assembleLanding('<title>{{TITLE}}</title>', 'EN-BODY', 'F', 'Documentation');
      const de = assembleLanding('<title>{{TITLE}}</title>', 'DE-BODY', 'F', 'Dokumentation');

      expect(en).toContain('Documentation');
      expect(en).toContain('EN-BODY');
      expect(de).toContain('Dokumentation');
      expect(de).toContain('DE-BODY');
      expect(en).not.toContain('DE-BODY');
    });

    it('should replace only the first title placeholder when the header repeats it', () => {
      // Guards the documented single-replace behaviour of String.replace with
      // a string pattern -- an og:title placeholder must not silently absorb
      // the page title too.
      const html = assembleLanding('{{TITLE}}|{{TITLE}}', 'B', 'F', 'X');

      expect(html).toContain('X|{{TITLE}}');
    });
  });

  describe('run', () => {
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      if (tmpRoot) fs.rmSync(tmpRoot, { recursive: true, force: true });
      tmpRoot = undefined;
      vi.restoreAllMocks();
    });

    it('should convert markdown pages to HTML when the docs tree is complete', () => {
      scaffold();

      run({ docsDir, tmplDir, cssDir });

      expect(fs.existsSync(path.join(docsDir, 'guide.html'))).toBe(true);
    });

    it('should write the concatenated stylesheet in cascade order', () => {
      scaffold();

      run({ docsDir, tmplDir, cssDir });
      const css = fs.readFileSync(path.join(cssDir, 'styles.css'), 'utf8');

      expect(css).toBe(CSS_PARTS.map((n) => `/* ${n} */`).join('\n'));
    });

    it('should write both language landings with their own titles and bodies', () => {
      scaffold();

      run({ docsDir, tmplDir, cssDir });
      const en = fs.readFileSync(path.join(docsDir, 'index.html'), 'utf8');
      const de = fs.readFileSync(path.join(docsDir, 'index-de.html'), 'utf8');

      expect(en).toContain('my-portfolio — Documentation');
      expect(en).toContain('EN LANDING');
      expect(de).toContain('my-portfolio — Dokumentation');
      expect(de).toContain('DE LANDING');
    });

    it('should not let a converted index.md overwrite the assembled landing page', () => {
      // The landing owns docs/index.html; index.md becomes docs-index.html.
      // Getting this wrong destroys the documentation hub on every build.
      scaffold();
      fs.writeFileSync(path.join(docsDir, 'index.md'), '# Docs Index', 'utf8');

      run({ docsDir, tmplDir, cssDir });

      expect(fs.readFileSync(path.join(docsDir, 'index.html'), 'utf8')).toContain('EN LANDING');
      expect(fs.existsSync(path.join(docsDir, 'docs-index.html'))).toBe(true);
    });

    it.each([
      'header.html',
      'footer.html',
      'page.html',
      'landing-en.html',
      'landing-de.html',
    ])('should fail fast with a named error when the %s template is missing', (missing) => {
      // A missing template would otherwise produce pages with unsubstituted
      // placeholders rather than an obvious failure.
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const exit = vi.spyOn(process, 'exit').mockImplementation(() => {});
      scaffold({ omitTemplate: missing });

      run({ docsDir, tmplDir, cssDir });

      expect(exit).toHaveBeenCalledWith(1);
      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining(missing));
    });

    it('should create the css directory when it does not already exist', () => {
      scaffold();
      fs.rmSync(cssDir, { recursive: true, force: true });

      expect(() => run({ docsDir, tmplDir, cssDir })).toThrow();
      expect(fs.existsSync(cssDir)).toBe(true);
    });
  });
});
