/**
 * @file projectsUtils.test.js
 * @module src/__tests__/components/projectsUtils
 * @testing components/Projects/projectsUtils.js
 * @description Contract tests for generatePlaceholderSVGDataUrl: it
 * produces a valid data URI, escapes angle brackets in the title to
 * prevent SVG text injection, and falls back to "Project" as the title
 * when none is given.
 */
import { generatePlaceholderSVGDataUrl } from '../../components/Projects/projectsUtils';

describe('projectsUtils', () => {
  it('should encode a placeholder SVG and escape angle brackets when the title contains them', () => {
    const svgUrl = generatePlaceholderSVGDataUrl('My <Project>');
    const decoded = decodeURIComponent(svgUrl.replace('data:image/svg+xml;charset=UTF-8,', ''));

    expect(svgUrl.startsWith('data:image/svg+xml;charset=UTF-8,')).toBe(true);
    expect(decoded).toContain('My &lt;Project&gt;');
    expect(decoded).toContain('Image not available');
  });

  it('should use "Project" as the SVG title when the title argument is falsy', () => {
    const svgUrl = generatePlaceholderSVGDataUrl(null);
    const decoded = decodeURIComponent(svgUrl.replace('data:image/svg+xml;charset=UTF-8,', ''));

    expect(decoded).toContain('Project');
    expect(svgUrl.startsWith('data:image/svg+xml;charset=UTF-8,')).toBe(true);
  });
});
