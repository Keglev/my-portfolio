/**
 * @file react-scroll.js
 * @module __mocks__/react-scroll
 * @summary Manual mock for react-scroll: renders Link as a plain anchor.
 * @enterprise react-scroll's Link registers a scroll-spy handler on mount
 * that needs a real scrolling container; under jsdom it throws on
 * `spyCallbacks`. Mapping `to` onto href keeps the rendered structure
 * assertable without that machinery.
 *
 * Lives at the repo root, not src/__mocks__/: Vitest resolves manual mocks
 * for node_modules packages relative to the project root. It is also NOT
 * applied automatically -- unlike Jest, Vitest requires an explicit
 * `vi.mock('react-scroll')` in each test file that wants it.
 */
export function Link({ children, to }) {
  return <a href={to ? `#${to}` : '#'}>{children}</a>;
}
