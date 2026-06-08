// Track createRoot/render calls via a plain array in the factory closure.
// This avoids two CRA Jest incompatibilities:
//   1. jest.fn(impl) in factories — the impl is silently ignored in CRA's runner
//   2. const variables referenced inside factories — they are undefined after hoisting
// Plain arrays and closures work identically in both jest.node.config.js and
// react-scripts test.

jest.mock('../App', () => function App() { return null; });

jest.mock('../components/ErrorBoundary', () =>
  function ErrorBoundary({ children }) { return children || null; }
);

jest.mock('react-dom/client', () => {
  const renders = [];
  const createRoot = (container) => ({
    render(element) { renders.push({ container, element }); },
  });
  return { createRoot, __renders: renders };
});

describe('src/index.js entry point', () => {
  beforeAll(() => {
    // Reset so index.js (and the mock) are loaded fresh, guaranteeing the
    // __renders array is from the same module instance that index.js uses.
    jest.resetModules();
    document.body.innerHTML = '<div id="root"></div>';
    require('../index');
  });

  test('calls createRoot with the #root DOM element', () => {
    const { __renders } = require('react-dom/client');
    expect(__renders).toHaveLength(1);
    expect(__renders[0].container).toBe(document.getElementById('root'));
  });

  test('calls root.render exactly once', () => {
    const { __renders } = require('react-dom/client');
    expect(__renders).toHaveLength(1);
  });

  test('render receives a React element (JSX tree)', () => {
    const { __renders } = require('react-dom/client');
    const jsx = __renders[0].element;
    expect(jsx).toBeDefined();
    expect(typeof jsx).toBe('object');
    expect(jsx.props).toBeDefined();
  });
});
