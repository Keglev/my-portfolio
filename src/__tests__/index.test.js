/**
 * @file index.test.js
 * @module src/__tests__/index
 * @testing index.jsx
 * @description Contract tests for the entry point: it calls
 * ReactDOM.createRoot on the #root element, calls render exactly once
 * with a React element, and roots that tree in React.StrictMode.
 *
 * Note: createRoot/render calls are tracked via a plain array in the mock
 * factory closure rather than vi.fn(). The array is read back through the
 * mocked module's own `__renders` export, which guarantees the assertions
 * inspect the same instance index.jsx wrote to -- importing the entry point
 * dynamically means module identity, not closure scope, is what ties them
 * together.
 */
import React from 'react';

vi.mock('../App', () => ({ default: function App() { return null; } }));

vi.mock('../components/ErrorBoundary/ErrorBoundary', () => ({
  default: function ErrorBoundary({ children }) { return children || null; },
}));

vi.mock('react-dom/client', () => {
  const renders = [];
  const createRoot = (container) => ({
    render(element) { renders.push({ container, element }); },
  });
  return { default: { createRoot }, createRoot, __renders: renders };
});

describe('index', () => {
  let renders;

  beforeAll(async () => {
    document.body.innerHTML = '<div id="root"></div>';

    // Importing the entry point is what executes it -- index.jsx runs its
    // createRoot/render at module scope, so the import IS the act phase for
    // every test below.
    await import('../index.jsx');
    ({ __renders: renders } = await import('react-dom/client'));
  });

  it('should call createRoot with the #root DOM element when index.jsx runs', () => {
    expect(renders).toHaveLength(1);
    expect(renders[0].container).toBe(document.getElementById('root'));
  });

  it('should call root.render exactly once when index.jsx runs', () => {
    expect(renders).toHaveLength(1);
  });

  it('should pass a React element (JSX tree) to render when index.jsx runs', () => {
    const jsx = renders[0].element;

    expect(jsx).toBeDefined();
    expect(typeof jsx).toBe('object');
    expect(jsx.props).toBeDefined();
  });

  it('should root the render tree in React.StrictMode when index.jsx runs', () => {
    const jsx = renders[0].element;

    expect(jsx.type).toBe(React.StrictMode);
  });
});
