// Shim module to redirect imports of 'react-dom/test-utils' to use React's act
// implementation. This avoids the deprecation warning when other libraries import
// the old ReactDOMTestUtils.act.
try {
  const react = require('react');
  module.exports = { act: react.act };
} catch (e) {
  // fallback: if react isn't available, export a noop to avoid test failures
  module.exports = { act: function noop(cb) { return cb && cb(); } };
}
