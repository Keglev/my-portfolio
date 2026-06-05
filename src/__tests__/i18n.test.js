// Prevent react-i18next from running browser-specific plugin setup
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}));

import i18n from '../i18n';

describe('i18n module', () => {
  test('is initialized after import', () => {
    expect(i18n.isInitialized).toBe(true);
  });

  test('default language is German (de)', () => {
    expect(i18n.language).toBe('de');
  });

  test('fallback language includes English (en)', () => {
    const fallback = i18n.options.fallbackLng;
    const langs = Array.isArray(fallback) ? fallback : [fallback];
    expect(langs).toContain('en');
  });

  test('has English resource bundle', () => {
    expect(i18n.hasResourceBundle('en', 'translation')).toBe(true);
  });

  test('has German resource bundle', () => {
    expect(i18n.hasResourceBundle('de', 'translation')).toBe(true);
  });

  test('React escaping is disabled (React already handles it)', () => {
    expect(i18n.options.interpolation.escapeValue).toBe(false);
  });

  test('returns a translation string for a known key', () => {
    const value = i18n.t('aboutSection.heading');
    expect(typeof value).toBe('string');
    expect(value.length).toBeGreaterThan(0);
  });
});
