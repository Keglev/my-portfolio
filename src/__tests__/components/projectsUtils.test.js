/*
 * Tests for projectsUtils.js
 * Covers: SVG placeholder generation and title escaping.
 */
import { generatePlaceholderSVGDataUrl } from '../../components/Projects/projectsUtils';

describe('projectsUtils', () => {
  it('encodes placeholder SVGs and escapes angle brackets in the title', () => {
    const svgUrl = generatePlaceholderSVGDataUrl('My <Project>');
    const decoded = decodeURIComponent(svgUrl.replace('data:image/svg+xml;charset=UTF-8,', ''));

    expect(svgUrl.startsWith('data:image/svg+xml;charset=UTF-8,')).toBe(true);
    expect(decoded).toContain('My &lt;Project&gt;');
    expect(decoded).toContain('Image not available');
  });

  it('uses "Project" as the SVG title when generatePlaceholderSVGDataUrl receives a falsy value', () => {
    const svgUrl = generatePlaceholderSVGDataUrl(null);
    const decoded = decodeURIComponent(svgUrl.replace('data:image/svg+xml;charset=UTF-8,', ''));
    expect(decoded).toContain('Project');
    expect(svgUrl.startsWith('data:image/svg+xml;charset=UTF-8,')).toBe(true);
  });
});
