/**
 * @file speedInsightsMock.js
 * @module config/vitest/speedInsightsMock
 * @summary Stub for @vercel/speed-insights/react; renders nothing in tests.
 * @enterprise Aliased in vite.config.js's test.alias. The real SDK would
 * attempt to initialise Vercel telemetry during component tests. This is the
 * only mock module that survived the move off Jest -- the CSS, static-asset,
 * and react-dom/test-utils mocks that used to sit beside it are all handled
 * natively by Vite or made obsolete by React Testing Library v16.
 */
export const SpeedInsights = () => null;
