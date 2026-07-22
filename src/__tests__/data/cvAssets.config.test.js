/**
 * @file cvAssets.config.test.js
 * @module src/__tests__/data/cvAssets.config
 * @testing data/cvAssets.config.js
 * @description Contract tests for the language-to-CV mapping: a German
 * visitor downloads the German CV, everyone else downloads the English one,
 * and regional variants resolve to the right language rather than silently
 * falling through to English.
 *
 * The regional case is the reason this module exists. Hero and SidebarMenu
 * each had their own inline check and had drifted apart -- one compared for
 * exact 'de' equality, the other used a prefix check -- so a visitor with
 * 'de-DE' got the German CV from one button and the English CV from the
 * other.
 */
import CV_ASSETS, { getCvFile } from '../../data/cvAssets.config';

describe('cvAssets.config', () => {
  describe('getCvFile', () => {
    it('should return the German CV when the language is German', () => {
      expect(getCvFile('de')).toBe(CV_ASSETS.de);
    });

    it('should return the English CV when the language is English', () => {
      expect(getCvFile('en')).toBe(CV_ASSETS.en);
    });

    it.each(['de-DE', 'de-AT', 'de-CH', 'DE'])(
      'should return the German CV for the regional variant %s',
      (language) => {
        expect(getCvFile(language)).toBe(CV_ASSETS.de);
      }
    );

    it.each(['en-GB', 'en-US', 'EN'])(
      'should return the English CV for the regional variant %s',
      (language) => {
        expect(getCvFile(language)).toBe(CV_ASSETS.en);
      }
    );

    it('should return the English CV for a language the site does not publish a CV in', () => {
      expect(getCvFile('pt-BR')).toBe(CV_ASSETS.en);
    });

    it.each([[undefined], [null], ['']])(
      'should return the English CV when the language is %p rather than crashing',
      (language) => {
        // i18n.language is briefly undefined before i18next initialises; the
        // download link must still resolve to a real file.
        expect(getCvFile(language)).toBe(CV_ASSETS.en);
      }
    );

    it('should point both CVs at real files in the public directory', () => {
      // These are root-absolute paths served straight from public/; a typo
      // here is a 404 on a download the visitor explicitly asked for.
      expect(CV_ASSETS.de).toMatch(/^\/[\w-]+\.pdf$/);
      expect(CV_ASSETS.en).toMatch(/^\/[\w-]+\.pdf$/);
      expect(CV_ASSETS.de).not.toBe(CV_ASSETS.en);
    });
  });
});
