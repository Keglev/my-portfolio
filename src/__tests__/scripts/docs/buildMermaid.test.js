/**
 * @file buildMermaid.test.js
 * @module src/__tests__/scripts/docs/buildMermaid
 * @testing scripts/docs/build_mermaid.js
 * @description Contract tests for the Mermaid pre-render pass: mmdc
 * discovery order, diagram-block extraction, the recursive HTML walk and
 * its skip list, and -- most importantly -- the clean no-op exit when mmdc
 * is not installed.
 *
 * That last one is load-bearing CI behaviour: mmdc is NOT a devDependency,
 * so every architecture-docs.yml run takes the "not found" path. If it ever
 * threw or exited non-zero instead of returning quietly, the docs deploy
 * would break on a machine where nothing is actually wrong.
 *
 * Out of scope: renderDiagram, which shells out to the real mmdc binary.
 * Asserting on a mocked execSync there would only prove the mock was called
 * with a string this test itself wrote.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  findMmdc,
  extractBlocks,
  collectHtmlFiles,
  processFile,
  run,
} from '../../../../scripts/docs/build_mermaid.js';

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'buildmermaid-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

/** Writes an HTML file into the temp tree and returns its absolute path. */
function writeHtml(relPath, contents) {
  const full = path.join(tmpDir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, contents, 'utf8');
  return full;
}

const wrapper = (code) =>
  `<div class="mermaid-wrapper"><pre class="mermaid">${code}</pre></div>`;

describe('build_mermaid', () => {
  describe('findMmdc', () => {
    it('should return null when mmdc is installed neither locally nor on PATH', () => {
      // This is the path every CI run actually takes -- mmdc is not a
      // devDependency of this repo. PATH is emptied rather than mocking
      // execSync: the module resolves child_process through a CommonJS
      // require, which vi.mock does not intercept, so a mock here would
      // silently let a real `which mmdc` run and make the result depend on
      // whether the host happens to have mmdc installed globally.
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      vi.stubEnv('PATH', '');
      vi.stubEnv('Path', '');

      const result = findMmdc();

      expect(result).toBeNull();
    });

    it('should prefer the local node_modules/.bin binary when one exists', () => {
      // Local wins over global so a pinned devDependency version is used in
      // preference to whatever happens to be on the developer's PATH.
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);

      const result = findMmdc();

      expect(result).toContain(path.join('node_modules', '.bin', 'mmdc'));
    });
  });

  describe('extractBlocks', () => {
    it('should return an empty array when the HTML contains no mermaid wrappers', () => {
      const blocks = extractBlocks('<p>Nothing here.</p>');

      expect(blocks).toEqual([]);
    });

    it('should extract the trimmed diagram source when a wrapper is present', () => {
      const blocks = extractBlocks(wrapper('\n  flowchart LR\n  A --> B\n'));

      expect(blocks).toHaveLength(1);
      expect(blocks[0].code).toBe('flowchart LR\n  A --> B');
    });

    it('should record the character offset and full match so replacement can be positional', () => {
      const html = `<p>lead</p>${wrapper('graph A')}`;

      const blocks = extractBlocks(html);

      expect(blocks[0].index).toBe(html.indexOf('<div'));
      expect(html.slice(blocks[0].index, blocks[0].index + blocks[0].fullMatch.length))
        .toBe(blocks[0].fullMatch);
    });

    it('should extract every wrapper in document order when a page has several', () => {
      const html = `${wrapper('first')}<p>x</p>${wrapper('second')}`;

      const blocks = extractBlocks(html);

      expect(blocks.map((b) => b.code)).toEqual(['first', 'second']);
      expect(blocks[0].index).toBeLessThan(blocks[1].index);
    });

    it('should ignore a plain mermaid pre that is not inside a wrapper div', () => {
      // The wrapper div is what build_docs emits and what the replacement
      // logic swaps out; a bare pre would be replaced at the wrong boundary.
      const blocks = extractBlocks('<pre class="mermaid">graph A</pre>');

      expect(blocks).toEqual([]);
    });
  });

  describe('collectHtmlFiles', () => {
    it('should collect .html files from the given directory', () => {
      writeHtml('page.html', '<p>x</p>');

      const files = collectHtmlFiles(tmpDir);

      expect(files).toHaveLength(1);
      expect(files[0]).toContain('page.html');
    });

    it('should recurse into subdirectories', () => {
      writeHtml('architecture/09-decisions/adr.html', '<p>x</p>');

      const files = collectHtmlFiles(tmpDir);

      expect(files[0]).toContain('adr.html');
    });

    it.each(['coverage', '_theme'])(
      'should skip the %s directory, which is generated by another tool or contains no diagrams',
      (skipped) => {
        writeHtml(path.join(skipped, 'generated.html'), '<p>x</p>');
        writeHtml('real.html', '<p>x</p>');

        const files = collectHtmlFiles(tmpDir);

        expect(files).toHaveLength(1);
        expect(files[0]).toContain('real.html');
      }
    );

    it('should ignore non-HTML files', () => {
      fs.writeFileSync(path.join(tmpDir, 'notes.md'), '# not html', 'utf8');

      const files = collectHtmlFiles(tmpDir);

      expect(files).toEqual([]);
    });
  });

  describe('processFile', () => {
    it('should report zero diagrams and leave the file untouched when it contains none', () => {
      const original = '<h2>No diagrams here</h2>';
      const file = writeHtml('plain.html', original);

      const count = processFile(file, '/nonexistent/mmdc');

      expect(count).toBe(0);
      expect(fs.readFileSync(file, 'utf8')).toBe(original);
    });

    it('should warn and leave the diagram in place when rendering fails', () => {
      // A broken or missing mmdc must degrade to the client-side CDN
      // rendering already present in the page, not corrupt the HTML or abort
      // the docs build.
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const original = `<p>before</p>${wrapper('flowchart LR')}<p>after</p>`;
      const file = writeHtml('diagram.html', original);

      const count = processFile(file, path.join(tmpDir, 'no-such-mmdc'));

      expect(count).toBe(0);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('Could not render diagram'));
      expect(fs.readFileSync(file, 'utf8')).toBe(original);
    });

    it('should warn once per diagram when several fail to render', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const file = writeHtml('two.html', `${wrapper('a')}${wrapper('b')}`);

      const count = processFile(file, path.join(tmpDir, 'no-such-mmdc'));

      expect(count).toBe(0);
      expect(warn).toHaveBeenCalledTimes(2);
    });
  });

  describe('run', () => {
    it('should exit cleanly with guidance when mmdc is not installed', () => {
      // The behaviour every CI docs build depends on: no throw, no non-zero
      // exit, and an actionable message. Diagrams still render client-side
      // via the CDN script in page.html.
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const exit = vi.spyOn(process, 'exit').mockImplementation(() => {});
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      vi.stubEnv('PATH', '');
      vi.stubEnv('Path', '');

      expect(() => run()).not.toThrow();

      const output = log.mock.calls.flat().join('\n');
      expect(output).toContain('mmdc not found');
      expect(output).toContain('@mermaid-js/mermaid-cli');
      expect(exit).not.toHaveBeenCalled();
    });
  });
});
