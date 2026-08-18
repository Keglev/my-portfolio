/**
 * @file analyticsMock.js
 * @module config/vitest/analyticsMock
 * @summary Stub for @vercel/analytics/react; renders nothing in tests.
 * @enterprise Aliased in vite.config.js's test.alias. The real SDK would
 * attempt to initialise Vercel telemetry during component tests.
 */
export const Analytics = () => null;
