/*
 * Tests for src/index.js entry point
 * Covers: ReactDOM.createRoot call with #root element and render with the App tree.
 *
 * Note: createRoot/render calls are tracked via a plain array in the factory closure
 * to avoid two CRA Jest incompatibilities: jest.fn(impl) in factories (silently
 * ignored) and const variables in factories (undefined after hoisting).
 */

const React = require('react');

jest.mock('../App', () => function App() { return null; });

jest.mock('../components/ErrorBoundary/ErrorBoundary', () =>
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

  test('render tree is rooted in React.StrictMode', () => {
    const { __renders } = require('react-dom/client');
    const jsx = __renders[0].element;
    expect(jsx.type).toBe(React.StrictMode);
  });
});
