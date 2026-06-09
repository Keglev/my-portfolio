// Verifies findImageCandidateFromAst image node selection and isBadgeLike
// badge/shield URL detection, including null/empty and edge-case inputs.
const { findImageCandidateFromAst, isBadgeLike } = require('../../../../scripts/lib/parseReadme/images');

describe('isBadgeLike', () => {
  test('returns false for null/undefined/empty', () => {
    expect(isBadgeLike(null)).toBe(false);
    expect(isBadgeLike(undefined)).toBe(false);
    expect(isBadgeLike('')).toBe(false);
  });

  test('returns true for badge/shield/status/travis/circleci URLs', () => {
    expect(isBadgeLike('https://img.shields.io/badge/coverage-100.svg')).toBe(true);
    expect(isBadgeLike('https://example.com/shield/icon.svg')).toBe(true);
    expect(isBadgeLike('https://ci.example.com/status/build')).toBe(true);
    expect(isBadgeLike('https://travis-ci.org/user/repo.svg')).toBe(true);
    expect(isBadgeLike('https://app.circleci.com/pipelines/icon.svg')).toBe(true);
    expect(isBadgeLike('https://shields.io/badge/test-passing')).toBe(true);
    expect(isBadgeLike('https://github.com/actions/workflows/ci.yml/badge.svg')).toBe(true);
    expect(isBadgeLike('https://github.com/badges/shields/blob/master/README.md')).toBe(true);
  });

  test('returns false for normal image URLs', () => {
    expect(isBadgeLike('https://example.com/screenshot.png')).toBe(false);
    expect(isBadgeLike('https://raw.githubusercontent.com/user/repo/main/preview.jpg')).toBe(false);
    expect(isBadgeLike('/src/assets/imgs/project-image.png')).toBe(false);
  });
});

describe('findImageCandidateFromAst', () => {
  test('returns null for null/undefined/missing children', () => {
    expect(findImageCandidateFromAst(null)).toBeNull();
    expect(findImageCandidateFromAst(undefined)).toBeNull();
    expect(findImageCandidateFromAst({})).toBeNull();
    expect(findImageCandidateFromAst({ children: null })).toBeNull();
  });

  test('returns url from image node inside Screenshots heading section', () => {
    const ast = {
      children: [
        { type: 'heading', children: [{ value: 'Screenshots' }] },
        { type: 'image', url: 'https://example.com/screenshot.png' },
      ],
    };
    expect(findImageCandidateFromAst(ast)).toBe('https://example.com/screenshot.png');
  });

  test('returns url from html img inside gallery heading section', () => {
    const ast = {
      children: [
        { type: 'heading', children: [{ value: 'Gallery' }] },
        { type: 'html', value: '<img src="https://example.com/gallery.jpg" alt="demo" />' },
      ],
    };
    expect(findImageCandidateFromAst(ast)).toBe('https://example.com/gallery.jpg');
  });

  test('returns url from node children flattenNodeText inside image heading section', () => {
    const ast = {
      children: [
        { type: 'heading', children: [{ value: 'Screenshots' }] },
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'https://example.com/demo.png some text' },
          ],
        },
      ],
    };
    const result = findImageCandidateFromAst(ast);
    expect(result).toContain('https://example.com/demo.png');
  });

  test('returns project image url via walk when isLikelyProjectImage and isRaster', () => {
    const ast = {
      children: [
        {
          type: 'image',
          url: '/src/assets/imgs/project-image.png',
        },
      ],
    };
    expect(findImageCandidateFromAst(ast)).toBe('/src/assets/imgs/project-image.png');
  });

  test('falls back to raster non-badge image when no project image found', () => {
    const ast = {
      children: [
        { type: 'image', url: 'https://example.com/screenshot.jpg' },
      ],
    };
    expect(findImageCandidateFromAst(ast)).toBe('https://example.com/screenshot.jpg');
  });

  test('falls back to non-svg non-badge URL when no raster image found', () => {
    const ast = {
      children: [
        { type: 'image', url: 'https://example.com/image-no-extension' },
      ],
    };
    expect(findImageCandidateFromAst(ast)).toBe('https://example.com/image-no-extension');
  });

  test('returns first candidate when only badge-like or svg images are available', () => {
    const ast = {
      children: [
        { type: 'image', url: 'https://img.shields.io/badge/test-green.svg' },
      ],
    };
    expect(findImageCandidateFromAst(ast)).toBe('https://img.shields.io/badge/test-green.svg');
  });

  test('finds image via html img node during walk', () => {
    const ast = {
      children: [
        {
          type: 'html',
          value: '<img src="https://example.com/app.jpg" alt="App screenshot" />',
        },
      ],
    };
    expect(findImageCandidateFromAst(ast)).toBe('https://example.com/app.jpg');
  });

  test('recurses into nested children nodes when walking', () => {
    const ast = {
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'image', url: 'https://example.com/nested.png' },
          ],
        },
      ],
    };
    expect(findImageCandidateFromAst(ast)).toBe('https://example.com/nested.png');
  });

  test('returns null when no image candidates found', () => {
    const ast = {
      children: [
        { type: 'paragraph', children: [{ type: 'text', value: 'No images here.' }] },
      ],
    };
    expect(findImageCandidateFromAst(ast)).toBeNull();
  });

  test('prefers project-image raster over generic raster', () => {
    const ast = {
      children: [
        { type: 'image', url: 'https://example.com/generic.png' },
        { type: 'image', url: '/src/assets/imgs/project-image.png' },
      ],
    };
    expect(findImageCandidateFromAst(ast)).toBe('/src/assets/imgs/project-image.png');
  });

  test('skips non-image heading sections and finds preferred screenshot section', () => {
    const ast = {
      children: [
        { type: 'heading', children: [{ value: 'Introduction' }] },
        { type: 'paragraph', children: [{ type: 'text', value: 'Some intro text' }] },
        { type: 'heading', children: [{ value: 'Screenshots' }] },
        { type: 'image', url: 'https://example.com/preferred.png' },
      ],
    };
    expect(findImageCandidateFromAst(ast)).toBe('https://example.com/preferred.png');
  });
});
