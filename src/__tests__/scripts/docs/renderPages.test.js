/**
 * @file renderPages.test.js
 * @module src/__tests__/scripts/docs/renderPages
 * @testing scripts/docs/lib/renderPages.js
 * @description Contract tests for the per-page rendering pipeline
 * (convertMd), the depth-based relative-href adjustment (adjustTemplate),
 * and the recursive docs/ walk (processDir) including its skip list, the
 * index.md -> docs-index.html rename, and both error paths.
 *
 * These run against a real temporary directory rather than a mocked fs.
 * processDir's whole job is filesystem traversal, so mocking fs would
 * leave the actual behaviour under test -- recursion, skipping, naming,
 * write failure -- asserted only against the mock's own shape.
 *
 * Out of scope: markdown correctness (markedConfig.test.js), the two HTML
 * transforms (htmlPostprocess.test.js), and TOC structure
 * (tocBuilder.test.js). Here they are only checked to be wired in.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  convertMd,
  adjustTemplate,
  processDir,
} from '../../../../scripts/docs/lib/renderPages.js';

const TEMPLATE = '<title>{{TITLE}}</title><nav>{{TOC}}</nav><main>{{CONTENT}}</main>';

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'renderpages-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

/** Writes a markdown file into the temp tree and returns its absolute path. */
function writeMd(relPath, contents) {
  const full = path.join(tmpDir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, contents, 'utf8');
  return full;
}

describe('renderPages', () => {
  describe('convertMd', () => {
    it('should use the first h1 as the page title when the markdown has one', () => {
      const md = writeMd('page.md', '# Real Title\n\nBody.');

      const html = convertMd(md, TEMPLATE);

      expect(html).toContain('<title>Real Title — my-portfolio docs</title>');
    });

    it('should fall back to the filename as the title when the markdown has no h1', () => {
      const md = writeMd('no-heading.md', 'Just body text.');

      const html = convertMd(md, TEMPLATE);

      expect(html).toContain('<title>no-heading — my-portfolio docs</title>');
    });

    it('should render the markdown body into the content placeholder', () => {
      const md = writeMd('page.md', '# T\n\nHello **world**.');

      const html = convertMd(md, TEMPLATE);

      expect(html).toContain('<strong>world</strong>');
      expect(html).not.toContain('{{CONTENT}}');
    });

    it('should apply the mermaid wrapper transform to fenced mermaid blocks', () => {
      const md = writeMd('diagram.md', '# D\n\n```mermaid\nflowchart LR\n```\n');

      const html = convertMd(md, TEMPLATE);

      expect(html).toContain('class="mermaid-wrapper"');
    });

    it('should rewrite internal .md cross-links to .html', () => {
      const md = writeMd('page.md', '# T\n\n[Other](other.md)');

      const html = convertMd(md, TEMPLATE);

      expect(html).toContain('href="other.html"');
    });

    it('should populate the TOC placeholder when the page has two or more headings', () => {
      const md = writeMd('page.md', '# T\n\n## First\n\ntext\n\n## Second\n\ntext');

      const html = convertMd(md, TEMPLATE);

      expect(html).toContain('doc-toc__list');
      expect(html).toContain('href="#first"');
    });

    it('should leave the TOC placeholder empty when the page has fewer than two headings', () => {
      const md = writeMd('page.md', '# T\n\n## Only one\n\ntext');

      const html = convertMd(md, TEMPLATE);

      expect(html).toContain('<nav></nav>');
    });
  });

  describe('adjustTemplate', () => {
    it('should return the template unchanged at depth 0', () => {
      const tmpl = '<link href="_theme/css/styles.css"><a href="index.html">';

      const out = adjustTemplate(tmpl, 0);

      expect(out).toBe(tmpl);
    });

    it('should prefix the stylesheet, script, and hub link with one level at depth 1', () => {
      const tmpl =
        '<link href="_theme/css/styles.css"><script src="_theme/js/docs.js"></script>' +
        '<a href="index.html">Home</a>';

      const out = adjustTemplate(tmpl, 1);

      expect(out).toContain('href="../_theme/css/styles.css"');
      expect(out).toContain('src="../_theme/js/docs.js"');
      expect(out).toContain('href="../index.html"');
    });

    it('should prefix every landing href, not just the first, in both languages', () => {
      // header.html carries index.html twice (breadcrumb + the EN half of the
      // language switch) and index-de.html once. Rewriting only the first
      // match left the language switch pointing at whatever index.html sat in
      // the current directory -- architecture/index.html, for instance.
      const tmpl =
        '<a href="index.html">my-portfolio</a>' +
        '<span class="lang-switch"><a href="index.html">EN</a><a href="index-de.html">DE</a></span>';

      const out = adjustTemplate(tmpl, 1);

      expect(out).not.toContain('href="index.html"');
      expect(out).not.toContain('href="index-de.html"');
      expect(out.match(/href="\.\.\/index\.html"/g)).toHaveLength(2);
      expect(out).toContain('href="../index-de.html"');
    });

    it('should repeat the prefix once per level when nested more deeply', () => {
      const tmpl = '<link href="_theme/css/styles.css">';

      const out = adjustTemplate(tmpl, 3);

      expect(out).toContain('href="../../../_theme/css/styles.css"');
    });
  });

  describe('processDir', () => {
    it('should write an .html file next to each .md source', () => {
      writeMd('guide.md', '# Guide');

      processDir(tmpDir, 0, TEMPLATE, tmpDir);

      expect(fs.existsSync(path.join(tmpDir, 'guide.html'))).toBe(true);
    });

    it('should rename docs/index.md to docs-index.html so it cannot overwrite the landing page', () => {
      // index.html at depth 0 belongs to the assembled bilingual landing;
      // converting index.md into it would destroy the hub.
      writeMd('index.md', '# Docs Index');

      processDir(tmpDir, 0, TEMPLATE, tmpDir);

      expect(fs.existsSync(path.join(tmpDir, 'docs-index.html'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'index.html'))).toBe(false);
    });

    it('should keep the index name for a nested index.md, which owns its own directory slot', () => {
      writeMd('architecture/index.md', '# Architecture');

      processDir(tmpDir, 0, TEMPLATE, tmpDir);

      expect(fs.existsSync(path.join(tmpDir, 'architecture', 'index.html'))).toBe(true);
    });

    it('should recurse into subdirectories when converting', () => {
      writeMd('architecture/09-decisions/ADR-001.md', '# ADR 1');

      processDir(tmpDir, 0, TEMPLATE, tmpDir);

      expect(
        fs.existsSync(path.join(tmpDir, 'architecture', '09-decisions', 'ADR-001.html'))
      ).toBe(true);
    });

    it.each(['jsdoc', 'coverage', '_theme'])(
      'should never walk the %s directory, whose contents are generated by other tools',
      (skipped) => {
        writeMd(path.join(skipped, 'should-not-convert.md'), '# Generated');

        processDir(tmpDir, 0, TEMPLATE, tmpDir);

        expect(
          fs.existsSync(path.join(tmpDir, skipped, 'should-not-convert.html'))
        ).toBe(false);
      }
    );

    it('should apply the depth prefix to pages in subdirectories', () => {
      writeMd('architecture/chapter.md', '# Chapter');

      processDir(tmpDir, 0, '<link href="_theme/css/styles.css">{{TITLE}}{{TOC}}{{CONTENT}}', tmpDir);
      const html = fs.readFileSync(path.join(tmpDir, 'architecture', 'chapter.html'), 'utf8');

      expect(html).toContain('href="../_theme/css/styles.css"');
    });

    it('should ignore non-markdown files when walking', () => {
      fs.writeFileSync(path.join(tmpDir, 'notes.txt'), 'not markdown', 'utf8');

      processDir(tmpDir, 0, TEMPLATE, tmpDir);

      expect(fs.existsSync(path.join(tmpDir, 'notes.html'))).toBe(false);
    });

    it('should log an error and return without throwing when the directory cannot be read', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const missing = path.join(tmpDir, 'does-not-exist');

      expect(() => processDir(missing, 0, TEMPLATE, tmpDir)).not.toThrow();
      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Cannot read'));
    });

    it('should log a per-file failure and continue when one page cannot be written', () => {
      // One unwritable page must not abort the whole docs build.
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(console, 'log').mockImplementation(() => {});
      writeMd('broken.md', '# Broken');
      writeMd('fine.md', '# Fine');
      const realWrite = fs.writeFileSync;
      vi.spyOn(fs, 'writeFileSync').mockImplementation((target, ...rest) => {
        if (String(target).endsWith('broken.html')) throw new Error('EACCES');
        return realWrite(target, ...rest);
      });

      processDir(tmpDir, 0, TEMPLATE, tmpDir);

      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('FAIL'));
      expect(fs.existsSync(path.join(tmpDir, 'fine.html'))).toBe(true);
    });
  });
});
