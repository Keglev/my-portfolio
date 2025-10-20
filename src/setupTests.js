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
// message. This avoids noisy test output while allowing other warnings to surface.
const _realConsoleError = console.error;
console.error = (...args) => {
	try {
		const msg = args && args[0] && String(args[0]);
		if (msg && msg.includes('ReactDOMTestUtils.act is deprecated')) return;
	} catch (e) {}
	_realConsoleError.apply(console, args);
};
