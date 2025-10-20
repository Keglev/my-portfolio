/**
 * media/index.js
 * Exposes media-related helpers used by the fetch pipeline. Kept very small
 * so consumers can require a single entrypoint.
 */
module.exports = {
  /**
   * processNodeMedia(node, mediaRoot, getAxios, opts)
   * - node: repository node object (must include `name` and optionally `object.text`)
   * - mediaRoot: absolute path where media will be persisted under `mediaRoot/<repo>`
   * - getAxios: function that returns an axios instance or null (used for HTTP probes)
   * - opts: optional overrides (parseReadme, isBadgeLike, mediaDownloader, readme, ast)
   * Returns: Promise<string|null> - filename (relative to repo media dir) or null
   */
  processNodeMedia: require('./mediaHelper').processNodeMedia
};
