/** Redirects react-dom/test-utils imports to React's built-in act to silence deprecation warnings. */
try {
  const react = require('react');
  module.exports = { act: react.act };
} catch (e) {
  // Fallback noop when React is unavailable
  module.exports = { act: function noop(cb) { return cb && cb(); } };
}
