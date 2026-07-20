/**
 * @file index.test.js
 * @module src/__tests__/index
 * @testing index.js
 * @description Contract tests for the entry point: it calls
 * ReactDOM.createRoot on the #root element, calls render exactly once
 * with a React element, and roots that tree in React.StrictMode.
 *
 * Note: createRoot/render calls are tracked via a plain array in the
 * mock factory closure to avoid two CRA Jest incompatibilities:
 * jest.fn(impl) in factories (silently ignored) and const variables in
 * factories (undefined after hoisting).
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

describe('index', () => {
  beforeAll(() => {
    // Reset so index.js (and the mock) are loaded fresh, guaranteeing the
    // __renders array is from the same module instance that index.js uses.
    jest.resetModules();
    document.body.innerHTML = '<div id="root"></div>';
    require('../index');
  });

  it('should call createRoot with the #root DOM element when index.js runs', () => {
    const { __renders } = require('react-dom/client');

    expect(__renders).toHaveLength(1);
    expect(__renders[0].container).toBe(document.getElementById('root'));
  });

  it('should call root.render exactly once when index.js runs', () => {
    const { __renders } = require('react-dom/client');

    expect(__renders).toHaveLength(1);
  });

  it('should pass a React element (JSX tree) to render when index.js runs', () => {
    const { __renders } = require('react-dom/client');
    const jsx = __renders[0].element;

    expect(jsx).toBeDefined();
    expect(typeof jsx).toBe('object');
    expect(jsx.props).toBeDefined();
  });

  it('should root the render tree in React.StrictMode when index.js runs', () => {
    const { __renders } = require('react-dom/client');
    const jsx = __renders[0].element;

    expect(jsx.type).toBe(React.StrictMode);
  });
});
