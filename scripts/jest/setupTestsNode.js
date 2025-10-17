global.React = require('react');
// Provide React global for older tests that rely on implicit React
global.React = require('react');
// Provide fetch polyfill for node Jest environment
try {
	global.fetch = require('node-fetch');
} catch (e) {
	// If node-fetch isn't available, tests that rely on fetch will need to be mocked.
}
// Load CRA's setupTests to provide jest-dom matchers and other project test setup
try {
	// src/setupTests.js uses ES module syntax; instead load jest-dom directly
	require('@testing-library/jest-dom');
	// replicate the small console suppression from src/setupTests.js
	const realConsoleError = console.error;
	console.error = (...args) => {
		try {
			const msg = args && args[0] && String(args[0]);
			if (msg && msg.includes('ReactDOMTestUtils.act is deprecated')) return;
		} catch (e) {}
		realConsoleError.apply(console, args);
	};
} catch (e) {
	// If src/setupTests.js doesn't exist or errors, ignore for node-run Jest.
}
