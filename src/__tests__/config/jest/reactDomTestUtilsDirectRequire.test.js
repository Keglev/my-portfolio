/* eslint-env jest */
describe('react-dom-test-utils direct require', () => {
  const modPath = '../../../../config/jest/react-dom-test-utils';

  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it('exports act from React when React is present', () => {
    // Require the real module (React present)
    const mod = require(modPath);
    expect(mod).toHaveProperty('act');
  });

  it('uses fallback act when requiring while React throws', () => {
    // Replace the 'react' module with a factory that throws when required
    jest.resetModules();
    jest.doMock('react', () => { throw new Error('module not found'); });

    // Require the module under test in an isolated module registry so mocks apply
    jest.isolateModules(() => {
      const mod = require(modPath);
      expect(mod).toHaveProperty('act');

      let ran = false;
      const res = mod.act(() => { ran = true; return 'fallback'; });
      expect(ran).toBe(true);
      return expect(Promise.resolve(res)).resolves.toBe('fallback');
    });
  });
});
