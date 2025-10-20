const React = require('react');

// Simple manual mock for react-scroll Link used in tests.
// Renders a plain anchor and maps the `to` prop to href so tests can assert on text/structure
function Link({ children, to }) {
  return React.createElement('a', { href: to ? `#${to}` : '#' }, children);
}

module.exports = { Link };
