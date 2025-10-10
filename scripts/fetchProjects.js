#!/usr/bin/env node
/*
  scripts/fetchProjects.js
  - Fetch pinned repositories via GitHub GraphQL using a server-side token
  - Writes public/projects.json for the client to consume during runtime
  Usage: set environment variable GH_PROJECTS_TOKEN (or GITHUB_TOKEN) in CI, then run:
    node scripts/fetchProjects.js
*/
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const OUT_PATH = path.join(__dirname, '..', 'public', 'projects.json');

const GH_TOKEN = process.env.GH_PROJECTS_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
let TOKEN = null;

if (GH_TOKEN) {
  console.log('Using GH_PROJECTS_TOKEN from environment');
  TOKEN = GH_TOKEN;
} else if (GITHUB_TOKEN) {
  console.log('Using GITHUB_TOKEN from environment (workflow token)');
  TOKEN = GITHUB_TOKEN;
} else {
  // Do NOT fail the build if no token is present. Some environments (like Vercel) may provide their own tokens
  // or you might prefer to use a checked-in sample `public/projects.json` during development.
  console.warn('No GitHub token found in environment. Skipping fetch. If you expect a fetch, set GH_PROJECTS_TOKEN in Actions secrets.');
  // Exit 0 so the build can continue (use existing public/projects.json if present)
  process.exit(0);
}

const query = `
  {
    user(login: "keglev") {
      pinnedItems(first: 6, types: [REPOSITORY]) {
        nodes {
          ... on Repository {
            name
            description
            url
            object(expression: "HEAD:README.md") {
              ... on Blob {
                text
              }
            }
          }
        }
      }
    }
  }
`;

async function fetchPinned() {
  try {
    const res = await axios.post(
      'https://api.github.com/graphql',
      { query },
      { headers: { Authorization: `Bearer ${TOKEN}`, 'X-GitHub-Api-Version': '2022-11-28' } }
    );

    const nodes = res.data && res.data.data && res.data.data.user && res.data.data.user.pinnedItems && res.data.data.user.pinnedItems.nodes;
    if (!Array.isArray(nodes)) {
      throw new Error('Unexpected GraphQL response shape');
    }

    // Prepare: ensure README text exists (GraphQL may omit it). Try raw.githubusercontent fallback.
    for (const node of nodes) {
      if (!node.object || !node.object.text) {
        const owner = 'keglev';
        const repo = node.name;
        const readmeCandidates = [
          `https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`,
          `https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`,
        ];
        for (const cand of readmeCandidates) {
          try {
            const r = await axios.get(cand, { responseType: 'text' });
            if (r && r.status === 200 && r.data) {
              node.object = node.object || {};
              node.object.text = r.data;
              break;
            }
          } catch (e) {
            // continue to next candidate
          }
        }
      }
    }

    // For each repo README, download referenced images and rewrite URLs to local paths
    const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB per-image cap
    for (const node of nodes) {
      try {
        const readme = node.object && node.object.text;
        if (!readme || typeof readme !== 'string') continue;

        const repo = node.name;
        const mediaDir = path.join(__dirname, '..', 'public', 'projects_media', repo);
        if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

        // Load or initialize meta for revalidation
        const metaPath = path.join(mediaDir, 'meta.json');
        let meta = { readmeHash: null, files: [] };
        try {
          if (fs.existsSync(metaPath)) {
            meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) || meta;
          }
        } catch (e) {
          meta = { readmeHash: null, files: [] };
        }

        // compute current readme hash
        const crypto = require('crypto');
        const currentReadmeHash = crypto.createHash('md5').update(readme || '').digest('hex');

  // Find markdown image links: ![alt](url)
  const imgRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
  let match;
  let updatedReadme = readme;

        while ((match = imgRegex.exec(readme)) !== null) {
          let imgUrl = match[1].trim();

          // remove optional title after space: url "title"
          const spaceIndex = imgUrl.indexOf(' ');
          if (spaceIndex !== -1 && !imgUrl.startsWith('<')) {
            imgUrl = imgUrl.slice(0, spaceIndex);
          }

          // strip surrounding <> if present
          if (imgUrl.startsWith('<') && imgUrl.endsWith('>')) {
            imgUrl = imgUrl.slice(1, -1);
          }

          // determine candidates for download
          const candidates = [];
          if (/^https?:\/\//i.test(imgUrl)) {
            candidates.push(imgUrl);
          } else {
            // relative path inside repo - try common branches
            const relativePath = imgUrl.replace(/^\.\/?/, '');
            const owner = 'keglev';
            candidates.push(`https://raw.githubusercontent.com/${owner}/${repo}/main/${relativePath}`);
            candidates.push(`https://raw.githubusercontent.com/${owner}/${repo}/master/${relativePath}`);
          }

          let downloaded = false;
          for (const candidate of candidates) {
            try {
              // Determine file name and output path
              const parsed = new URL(candidate);
              const ext = path.extname(parsed.pathname) || '.img';
              const base = path.basename(parsed.pathname, ext);
              const hash = crypto.createHash('md5').update(candidate).digest('hex').slice(0, 8);
              const filename = `${base}-${hash}${ext}`;
              const outPath = path.join(mediaDir, filename);

              // If meta indicates unchanged README and filename already present, skip download
              if (meta.readmeHash === currentReadmeHash && meta.files && meta.files.includes(filename) && fs.existsSync(outPath)) {
                const publicPath = `/projects_media/${repo}/${filename}`;
                updatedReadme = updatedReadme.split(match[1]).join(publicPath);
                downloaded = true;
                break;
              }

              // HEAD request to check MIME type and content-length (if available)
              try {
                const head = await axios.head(candidate, { maxRedirects: 5 });
                const ct = head.headers['content-type'] || '';
                const cl = head.headers['content-length'] ? parseInt(head.headers['content-length'], 10) : null;
                if (!/^image\//i.test(ct)) {
                  // Not an image, skip this candidate
                  continue;
                }
                if (cl && cl > MAX_SIZE_BYTES) {
                  // Too large, skip candidate
                  continue;
                }
              } catch (e) {
                // HEAD may fail on some hosts; proceed to GET which will be capped by axios
              }

              // Download with size cap
              const res = await axios.get(candidate, { responseType: 'arraybuffer', maxContentLength: MAX_SIZE_BYTES });
              if (res && res.status === 200 && res.data) {
                fs.writeFileSync(outPath, res.data);

                // Update meta
                meta.files = meta.files || [];
                if (!meta.files.includes(filename)) meta.files.push(filename);

                // Replace the URL in the README with the local public path
                const publicPath = `/projects_media/${repo}/${filename}`;
                updatedReadme = updatedReadme.split(match[1]).join(publicPath);
                downloaded = true;
                break;
              }
            } catch (e) {
              // try next candidate
            }
          }

          if (!downloaded) {
            // leave the original URL (best-effort). Continue.
          }
        }

        // write back modified README
        node.object.text = updatedReadme;

        // if README changed, update meta readmeHash and persist meta
        if (meta.readmeHash !== currentReadmeHash) {
          meta.readmeHash = currentReadmeHash;
          try {
            fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
          } catch (e) {
            // ignore meta write failures
          }
        }
      } catch (e) {
        // if media processing fails for a repo, continue with others
        console.warn(`Media processing failed for repo ${node.name}:`, e.message || e);
      }
    }

    // Add lightweight summary & mediaDownloaded flag per repo
    for (const node of nodes) {
      const readme = node.object && node.object.text;
      node.summary = (readme && typeof readme === 'string') ? readme.replace(/\s+/g, ' ').trim().slice(0, 160) : '';
      const repo = node.name;
      const mediaDir = path.join(__dirname, '..', 'public', 'projects_media', repo);
      node.mediaDownloaded = fs.existsSync(mediaDir) && fs.readdirSync(mediaDir).filter(f => f !== 'meta.json').length > 0;
    }

    // Write a compact json file for the client
    fs.writeFileSync(OUT_PATH, JSON.stringify(nodes, null, 2), 'utf8');
    console.log('Wrote', OUT_PATH);
  } catch (err) {
    console.error('Failed to fetch pinned repositories:', err.message || err);
    process.exit(3);
  }
}

fetchPinned();
