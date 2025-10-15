// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Silence specific ReactDOMTestUtils.act deprecation warning that appears during tests.
// This is safe to ignore and avoids modifying third-party libraries.
const realConsoleError = console.error;
console.error = (...args) => {
	try {
		const msg = args && args[0] && String(args[0]);
		if (msg && msg.includes('ReactDOMTestUtils.act is deprecated')) return;
	} catch (e) {}
	realConsoleError.apply(console, args);
};
