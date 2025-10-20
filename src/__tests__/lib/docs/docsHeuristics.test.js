const docsHeur = require('../../../../scripts/lib/docs/docsHeuristics');

describe('docsHeuristics', () => {
  test('exports functions', () => {
    expect(typeof docsHeur.backfillDocsFromText).toBe('function');
    expect(typeof docsHeur.backfillFromAstHeading).toBe('function');
    expect(typeof docsHeur.postProcessDocsLinkCandidates).toBe('function');
  });
});
