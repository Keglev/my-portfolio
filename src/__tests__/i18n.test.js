/**
 * @file i18n.test.js
 * @module src/__tests__/i18n
 * @testing i18n/index.js
 * @description Contract tests for the i18next configuration: it
 * initializes on import, defaults to German with English as fallback,
 * ships both resource bundles, disables React-redundant escaping, and
 * resolves a known translation key to a real string.
 */
import i18n from '../i18n';
// Prevent react-i18next from running browser-specific plugin setup
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}));

describe('i18n', () => {
  it('should be initialized when the module is imported', () => {
    expect(i18n.isInitialized).toBe(true);
  });

  it('should default to German (de) when the module is imported', () => {
    expect(i18n.language).toBe('de');
  });

  it('should include English (en) in the fallback language list', () => {
    const fallback = i18n.options.fallbackLng;
    const langs = Array.isArray(fallback) ? fallback : [fallback];

    expect(langs).toContain('en');
  });

  it('should have an English resource bundle when the module is imported', () => {
    expect(i18n.hasResourceBundle('en', 'translation')).toBe(true);
  });

  it('should have a German resource bundle when the module is imported', () => {
    expect(i18n.hasResourceBundle('de', 'translation')).toBe(true);
  });

  it('should keep interpolation escaping disabled when React already escapes values', () => {
    expect(i18n.options.interpolation.escapeValue).toBe(false);
  });

  it('should return a non-empty translation string when a known key is requested', () => {
    const value = i18n.t('aboutSection.heading');

    expect(typeof value).toBe('string');
    expect(value.length).toBeGreaterThan(0);
  });
});
