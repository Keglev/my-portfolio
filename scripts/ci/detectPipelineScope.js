/**
 * @file detectPipelineScope.js
 * @module scripts/ci/detectPipelineScope
 * @summary Stub for the pipeline scope detector; resolveScope is not
 * implemented yet.
 * @enterprise Placeholder so the contract test suite
 * (src/__tests__/scripts/ci/detectPipelineScope.test.js) can be written and
 * committed test-first. Throws deliberately so failures are attributed to
 * "not implemented" rather than a missing module or a silently wrong
 * return value.
 */

/**
 * @param {string[]} changedFiles
 * @returns {{apiDocs: boolean, coverage: boolean, archDocs: boolean, deploy: boolean}}
 */
function resolveScope(changedFiles) {
  throw new Error('resolveScope is not implemented yet');
}

module.exports = { resolveScope };
