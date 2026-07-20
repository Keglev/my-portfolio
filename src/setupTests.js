/**
 * @file setupTests.js
 * @module src/setupTests
 * @summary CRA's auto-loaded Jest setup file for the test:cra runner.
 * @enterprise Loaded automatically by react-scripts test via CRA's
 * setupFilesAfterEach convention -- not wired in explicitly anywhere, and
 * distinct from config/jest/setupTestsNode.js, which serves the same role
 * for the separate test:node runner (see jest.node.config.js). The two
 * files exist because this repo runs two Jest configurations for two
 * different runtime targets; keeping them separate avoids one runner's
 * bootstrap needing to special-case the other's environment.
 */
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Ensure React's act environment flag is set so testing utilities use the
// modern `React.act` implementation. This avoids the deprecation warning
// coming from older compatibility layers.
try {
		// prefer Node global, fall back to window for browser-like test environments
		if (typeof global !== 'undefined') global.IS_REACT_ACT_ENVIRONMENT = true;
		else if (typeof window !== 'undefined') window.IS_REACT_ACT_ENVIRONMENT = true;
} catch (e) {
	// no-op if globalThis isn't writable in some environments
}

// Keep a targeted suppression for the specific ReactDOMTestUtils.act deprecation
// message emitted by the testing-library/react compat layer. The real message
// wraps the identifier in backticks ("`ReactDOMTestUtils.act` is deprecated"),
// so we match on the identifier alone. Other warnings still surface.
const _realConsoleError = console.error;
console.error = (...args) => {
	try {
		const msg = args && args[0] && String(args[0]);
		if (msg && msg.includes('ReactDOMTestUtils.act')) return;
	} catch (e) {}
	_realConsoleError.apply(console, args);
};
