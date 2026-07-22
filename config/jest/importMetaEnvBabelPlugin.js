/**
 * @file importMetaEnvBabelPlugin.js
 * @module config/jest/importMetaEnvBabelPlugin
 * @summary Babel plugin that rewrites `import.meta.env` to `process.env` so
 * the Jest CommonJS transform can parse source files using Vite's
 * build-time env API.
 * @enterprise TEMPORARY BRIDGE -- this file exists only for the window
 * between the Vite migration and the Vitest migration. Vitest evaluates
 * `import.meta.env` natively, so this plugin and its jest.node.config.js
 * wiring are deleted along with the rest of config/jest/ when the test
 * runner consolidates.
 *
 * A syntax-only plugin is not sufficient: Babel parses `import.meta` fine,
 * but @babel/plugin-transform-modules-commonjs (pulled in by preset-env's
 * default CommonJS output, which Jest requires) then throws because
 * `import.meta` has no CommonJS equivalent. The expression has to be
 * replaced outright, before that transform runs -- which it is, since
 * Babel applies plugins before presets.
 */
module.exports = function importMetaEnvBabelPlugin({ types: t }) {
  return {
    name: 'import-meta-env-to-process-env',
    visitor: {
      MetaProperty(path) {
        // Only the `import.meta.env` form is rewritten. A bare `import.meta`
        // has no CommonJS equivalent and no legitimate use in this codebase,
        // so it is left alone to keep failing loudly rather than being
        // silently reinterpreted as `process.env`.
        const parent = path.parent;
        const isImportMetaEnv =
          parent.type === 'MemberExpression' &&
          parent.object === path.node &&
          !parent.computed &&
          parent.property.type === 'Identifier' &&
          parent.property.name === 'env';

        if (isImportMetaEnv) {
          path.parentPath.replaceWith(
            t.memberExpression(t.identifier('process'), t.identifier('env'))
          );
        }
      },
    },
  };
};
