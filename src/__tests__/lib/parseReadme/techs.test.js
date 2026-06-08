const { extractTechnologiesFromAst } = require('../../../../scripts/lib/parseReadme/techs');

describe('extractTechnologiesFromAst', () => {
  test('returns [] for null/missing ast', () => {
    expect(extractTechnologiesFromAst(null)).toEqual([]);
    expect(extractTechnologiesFromAst({})).toEqual([]);
  });

  test('extracts bold tokens from list items (bold list path)', () => {
    const ast = {
      children: [
        {
          type: 'heading',
          depth: 2,
          children: [{ type: 'text', value: 'Technologies' }],
        },
        {
          type: 'list',
          children: [
            {
              type: 'listItem',
              children: [
                {
                  type: 'paragraph',
                  children: [{ type: 'text', value: '**React** and **TypeScript**' }],
                },
              ],
            },
          ],
        },
      ],
    };
    const result = extractTechnologiesFromAst(ast);
    expect(result).toContain('React');
    expect(result).toContain('TypeScript');
  });

  test('extracts bold tokens from paragraph nodes (bold paragraph path)', () => {
    const ast = {
      children: [
        {
          type: 'heading',
          depth: 2,
          children: [{ type: 'text', value: 'Tech Stack' }],
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', value: '**Node.js** + **Express** for the backend' }],
        },
      ],
    };
    const result = extractTechnologiesFromAst(ast);
    expect(result).toContain('Node.js');
    expect(result).toContain('Express');
  });

  test('falls back to legacy plain-list extraction when no bold tokens found', () => {
    const ast = {
      children: [
        {
          type: 'heading',
          depth: 2,
          children: [{ type: 'text', value: 'Technologies' }],
        },
        {
          type: 'list',
          children: [
            {
              type: 'listItem',
              children: [
                {
                  type: 'paragraph',
                  children: [{ type: 'text', value: 'React' }],
                },
              ],
            },
            {
              type: 'listItem',
              children: [
                {
                  type: 'paragraph',
                  children: [{ type: 'text', value: 'Jest, Testing Library' }],
                },
              ],
            },
          ],
        },
      ],
    };
    const result = extractTechnologiesFromAst(ast);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toContain('React');
  });

  test('stops collecting at next heading of equal or higher depth', () => {
    const ast = {
      children: [
        {
          type: 'heading',
          depth: 2,
          children: [{ type: 'text', value: 'Technologies' }],
        },
        {
          type: 'list',
          children: [
            {
              type: 'listItem',
              children: [{ type: 'paragraph', children: [{ type: 'text', value: '**React**' }] }],
            },
          ],
        },
        {
          type: 'heading',
          depth: 2,
          children: [{ type: 'text', value: 'About' }],
        },
        {
          type: 'list',
          children: [
            {
              type: 'listItem',
              children: [{ type: 'paragraph', children: [{ type: 'text', value: '**ShouldNotAppear**' }] }],
            },
          ],
        },
      ],
    };
    const result = extractTechnologiesFromAst(ast);
    expect(result).toContain('React');
    expect(result).not.toContain('ShouldNotAppear');
  });
});
