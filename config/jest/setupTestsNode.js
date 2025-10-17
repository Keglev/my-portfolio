// Centralized Jest setup for node/jsdom test runs
// Provide a minimal, robust environment for tests that need React, fetch, and jest-dom.
try {
  // Provide React global for older tests that rely on an implicit global
  if (typeof global.React === 'undefined') global.React = require('react');
} catch (e) { /* if react isn't available tests that need it will fail explicitly */ }

// Provide fetch polyfill only when node-fetch is available
try {
  // prefer global.fetch if already provided by environment
  if (typeof global.fetch === 'undefined') {
    // require node-fetch v2 style (commonjs)
    const nf = require('node-fetch');
    if (nf) global.fetch = nf;
  }
} catch (e) {
  // If node-fetch isn't available, tests that rely on fetch will need to mock it.
}

// Load jest-dom matchers to enable DOM assertions
try {
  require('@testing-library/jest-dom');
} catch (e) { /* optional */ }

// Small console suppression for a known ReactDOMTestUtils deprecation noise
try {
  const realConsoleError = console.error;
  console.error = (...args) => {
    try {
      const msg = args && args[0] && String(args[0]);
      if (msg && msg.includes('ReactDOMTestUtils.act is deprecated')) return;
    } catch (e) {}
    realConsoleError.apply(console, args);
  };
} catch (e) {}
