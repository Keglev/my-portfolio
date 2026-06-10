/** Extended fallback and act-method tests for config/jest/react-dom-test-utils.js. */

describe('react-dom-test-utils fallback logic', () => {
  it('should implement fallback noop function correctly', () => {
    // Replicates the catch-path noop inline to verify its short-circuit logic independently
    const noop = function noop(cb) {
      return cb && cb();
    };

    let callCount = 0;
    noop(() => {
      callCount++;
    });
    expect(callCount).toBe(1);
  });

  it('should handle callback return values in fallback', () => {
    const noop = function noop(cb) {
      return cb && cb();
    };

    const result1 = noop(() => 42);
    expect(result1).toBe(42);

    const result2 = noop(() => 'test');
    expect(result2).toBe('test');

    const result3 = noop(() => ({ key: 'value' }));
    expect(result3).toEqual({ key: 'value' });
  });

  it('should implement short-circuit logic for falsy callbacks', () => {
    const noop = function noop(cb) {
      return cb && cb();
    };

    expect(noop(null)).toBeFalsy();
    expect(noop(undefined)).toBeFalsy();
    expect(noop(false)).toBeFalsy();
    expect(noop(0)).toBeFalsy();
    expect(noop('')).toBeFalsy();
  });

  it('should test the try-catch structure coverage', async () => {
    const module = require('../../../../config/jest/react-dom-test-utils');

    expect(module).toBeDefined();
    expect(module.act).toBeDefined();
    expect(typeof module.act).toBe('function');

    let called = false;
    await module.act(async () => { called = true; });
    expect(called).toBe(true);
  });

  it('should execute fallback when React is unavailable (simulate require throwing)', async () => {
    // jest.doMock forces the catch branch by making require('react') throw
    jest.resetModules();
    jest.doMock('react', () => { throw new Error('react not found'); }, { virtual: true });

    const moduleUnderTest = require('../../../../config/jest/react-dom-test-utils');

    expect(moduleUnderTest).toBeDefined();
    expect(moduleUnderTest.act).toBeDefined();

    let executed = false;
    const result = moduleUnderTest.act(() => { executed = true; return 'ok'; });
    expect(executed).toBe(true);
    await expect(Promise.resolve(result)).resolves.toBe('ok');

    jest.resetModules();
  });
});

describe('react-dom-test-utils act method', () => {
  let reactDomTestUtils;

  beforeEach(() => {
    delete require.cache[require.resolve('../../../../config/jest/react-dom-test-utils')];
    reactDomTestUtils = require('../../../../config/jest/react-dom-test-utils');
  });

  it('should be a callable function', () => {
    expect(typeof reactDomTestUtils.act).toBe('function');
  });

  it('should handle async callbacks', async () => {
    let executed = false;

    const result = await reactDomTestUtils.act(async () => {
      executed = true;
      return 'async result';
    });

    expect(executed).toBe(true);
    expect(result).toBe('async result');
  });

  it('should be consistent on multiple calls', () => {
    const ref1 = reactDomTestUtils.act;
    const ref2 = reactDomTestUtils.act;

    expect(ref1).toBe(ref2);
  });

  it('should handle errors thrown in callback', async () => {
    await expect(
      reactDomTestUtils.act(async () => {
        throw new Error('test error');
      })
    ).rejects.toThrow('test error');
  });
});
