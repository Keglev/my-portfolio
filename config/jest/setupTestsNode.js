/** Jest setup for node/jsdom runs: polyfills React global and fetch, loads jest-dom matchers, suppresses known deprecation noise. */
try {
  if (typeof global.React === 'undefined') global.React = require('react');
} catch (e) {}

try {
  if (typeof global.fetch === 'undefined') {
    const nf = require('node-fetch');
    if (nf) global.fetch = nf;
  }
} catch (e) {}

try {
  require('@testing-library/jest-dom');
} catch (e) {}

try {
  // Required for React 18's act() to work correctly in jsdom
  if (typeof global !== 'undefined') global.IS_REACT_ACT_ENVIRONMENT = true;
} catch (e) {}

// Suppress ReactDOMTestUtils.act deprecation warning to keep test output clean
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
