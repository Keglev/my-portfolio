import {
  getProjectImageUrl,
  getPrimaryImage,
  generatePlaceholderSVGDataUrl,
  getAboutSection,
  getTechnologyWords,
} from '../../components/Projects/projectsUtils';

describe('projectsUtils', () => {
  it('builds the expected GitHub raw image URL', () => {
    expect(getProjectImageUrl('demo-repo')).toBe(
      'https://raw.githubusercontent.com/keglev/demo-repo/main/src/assets/imgs/project-image.png'
    );
    expect(getProjectImageUrl('demo-repo', 'master')).toBe(
      'https://raw.githubusercontent.com/keglev/demo-repo/master/src/assets/imgs/project-image.png'
    );
  });

  it('prefers a project primaryImage and parses README image paths before falling back', () => {
    expect(getPrimaryImage({ name: 'demo', primaryImage: '/img/demo.png' })).toBe('/img/demo.png');

    const parsed = getPrimaryImage({
      name: 'demo',
      object: { text: 'See /projects_media/demo/project-image.png for details' },
    });
    expect(parsed).toBe('/projects_media/demo/project-image.png');

    expect(getPrimaryImage({ name: 'fallback', object: { text: 'No image here' } })).toBe(
      'https://raw.githubusercontent.com/keglev/fallback/main/src/assets/imgs/project-image.png'
    );
  });

  it('falls back cleanly when project metadata access throws', () => {
    const project = {
      name: 'broken',
      get object() {
        throw new Error('boom');
      },
    };

    expect(getPrimaryImage(project)).toBe(
      'https://raw.githubusercontent.com/keglev/broken/main/src/assets/imgs/project-image.png'
    );
  });

  it('encodes placeholder SVGs and escapes angle brackets in the title', () => {
    const svgUrl = generatePlaceholderSVGDataUrl('My <Project>');
    const decoded = decodeURIComponent(svgUrl.replace('data:image/svg+xml;charset=UTF-8,', ''));

    expect(svgUrl.startsWith('data:image/svg+xml;charset=UTF-8,')).toBe(true);
    expect(decoded).toContain('My &lt;Project&gt;');
    expect(decoded).toContain('Image not available');
  });

  it('extracts and normalizes the About section', () => {
    const readme = [
      '# Demo',
      '## About',
      'This is **bold** and `code` with [a link](https://example.com).',
      'More text here.',
      '## Next Section',
      'Ignored',
    ].join('\n');

    expect(getAboutSection(readme)).toBe('This is bold and code with a link. More text here.');
  });

  it('returns a truncated About section when the text is long', () => {
    const longText = 'A'.repeat(260);
    const readme = ['## About', longText, '## Next'].join('\n');
    const about = getAboutSection(readme);

    expect(about).toHaveLength(243);
    expect(about.endsWith('...')).toBe(true);
  });

  it('returns technology keywords from the tech section and stops at the next same-level heading', () => {
    const readme = [
      '# Demo',
      '## Technologies',
      '- **React (18),**',
      '- **React**',
      '### Tools',
      '- **TypeScript:**',
      '## Other',
      '- **Ignored**',
    ].join('\n');

    expect(getTechnologyWords(readme)).toEqual(['React', 'TypeScript']);
  });

  it('returns empty technology lists when the section is missing or empty', () => {
    expect(getTechnologyWords('')).toEqual([]);
    expect(getTechnologyWords('## About\nNothing relevant')).toEqual([]);
  });

  it('returns null for getAboutSection on null/undefined input or when About heading is absent', () => {
    expect(getAboutSection(null)).toBeNull();
    expect(getAboutSection(undefined)).toBeNull();
    expect(getAboutSection('# Title\n## Other\nSome text')).toBeNull();
  });

  it('returns null when the About section contains only blank lines before the next heading', () => {
    expect(getAboutSection('## About\n\n## Next')).toBeNull();
  });

  it('skips blank lines inside the About section without including them in output', () => {
    const readme = '## About\n\nActual content here.\n\n## Next';
    const result = getAboutSection(readme);
    expect(result).toBe('Actual content here.');
  });

  it('uses "Project" as the SVG title when generatePlaceholderSVGDataUrl receives a falsy value', () => {
    const svgUrl = generatePlaceholderSVGDataUrl(null);
    const decoded = decodeURIComponent(svgUrl.replace('data:image/svg+xml;charset=UTF-8,', ''));
    expect(decoded).toContain('Project');
    expect(svgUrl.startsWith('data:image/svg+xml;charset=UTF-8,')).toBe(true);
  });

  it('skips bold entries that are only whitespace when extracting technology words', () => {
    const readme = '## Technologies\n- **  **\n- **React**';
    expect(getTechnologyWords(readme)).toEqual(['React']);
  });
});