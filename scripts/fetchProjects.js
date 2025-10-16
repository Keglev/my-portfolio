#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
// resilient parser factory: try unified/remark at runtime, but provide a synchronous fallback AST
let parserFactory = null;
try { parserFactory = require('unified'); } catch (e) { parserFactory = null; }

function buildFallbackAst(text) {
  // very small markdown -> AST fallback sufficient for our extraction needs
  const lines = String(text || '').split(/\r?\n/);
  const children = [];
  let paraBuf = [];
  const flushPara = () => {
    if (paraBuf.length) {
      const text = paraBuf.join(' ').trim();
      // inline parse links [label](url) into link children
      const parts = [];
      let lastIndex = 0;
  const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)]+|\.?\/+[^)]+|[^)]+\.md)\)/g;
      let m;
      while ((m = linkRe.exec(text)) !== null) {
        if (m.index > lastIndex) parts.push({ type: 'text', value: text.slice(lastIndex, m.index) });
        parts.push({ type: 'link', url: m[2], children: [{ type: 'text', value: m[1] }] });
        lastIndex = m.index + m[0].length;
      }
      if (lastIndex < text.length) parts.push({ type: 'text', value: text.slice(lastIndex) });
      // fallback to single text child if no parts
      const childrenNodes = (parts.length ? parts : [{ type: 'text', value: text }]);
      children.push({ type: 'paragraph', children: childrenNodes });
      paraBuf = [];
    }
  };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const h = l.match(/^\s*(#{1,6})\s*(.*)$/);
    if (h) {
      flushPara();
      children.push({ type: 'heading', depth: h[1].length, children: [{ type: 'text', value: h[2].trim() }] });
      continue;
    }
    const imgMd = l.match(/!\[[^\]]*\]\(([^)]+)\)/);
    if (imgMd) {
      flushPara();
      children.push({ type: 'image', url: imgMd[1].trim(), alt: '' });
      continue;
    }
    const htmlImg = l.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (htmlImg) {
      flushPara();
      children.push({ type: 'html', value: l });
      continue;
    }
    if (/^\s*[-*+]\s+/.test(l)) {
      // simple list handling: collect contiguous list items
      const listItems = [];
      let j = i;
      while (j < lines.length && /^\s*[-*+]\s+/.test(lines[j])) {
        listItems.push({ type: 'listItem', children: [{ type: 'paragraph', children: [{ type: 'text', value: lines[j].replace(/^\s*[-*+]\s+/, '').trim() }] }] });
        j++;
      }
      children.push({ type: 'list', children: listItems });
      i = j - 1;
      continue;
    }
    if (l.trim() === '') { flushPara(); continue; }
    paraBuf.push(l.trim());
  }
  flushPara();
  return { type: 'root', children };
}

function parseMarkdown(text) {
  if (!text) return null;
  try {
    // try unified/remark at runtime (may be ESM in node_modules); if it fails, fallback
    if (parserFactory) {
      try {
        const factory = (typeof parserFactory === 'function') ? parserFactory : (parserFactory && parserFactory.default) ? parserFactory.default : null;
        if (factory && typeof factory === 'function') {
          let remarkParse = null;
          try { remarkParse = require('remark-parse'); } catch (e) { remarkParse = null; }
          if (remarkParse) return factory().use(remarkParse).parse(text);
        }
      } catch (e) {
        if (DEBUG_FETCH) console.log('unified parse error', e && e.message);
      }
    }
    try {
      const remarkPkg = require('remark');
      const remarkFactory = (typeof remarkPkg === 'function') ? remarkPkg : (remarkPkg && remarkPkg.default) ? remarkPkg.default : null;
      let remarkParse = null;
      try { remarkParse = require('remark-parse'); } catch (e) { remarkParse = null; }
      if (remarkFactory && remarkParse) return remarkFactory().use(remarkParse).parse(text);
    } catch (e) {
      // ignore
    }
  } catch (e) {
    if (DEBUG_FETCH) console.log('parseMarkdown error', e && e.message);
  }
  // final fallback: simple synchronous AST
  return buildFallbackAst(text);
}

// Fallback: extract a section by heading name using regex when AST parsing isn't available
function extractSectionWithRegex(text, headingRegexes) {
  if (!text) return null;
  try {
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const re of headingRegexes) {
        if (re.test(line)) {
          // collect following non-heading lines
          const parts = [];
          let j = i + 1;
          while (j < lines.length && !/^#{1,6}\s+/.test(lines[j])) {
            if (lines[j].trim()) parts.push(lines[j].trim());
            j++;
          }
          if (parts.length) return parts.join('\n\n');
          return null;
        }
      }
    }
  } catch (e) { if (DEBUG_FETCH) console.log('extractSectionWithRegex error', e && e.message); }
  return null;
}

// Output path for the client JSON
const OUT_PATH = path.join(__dirname, '..', 'public', 'projects.json');
const MEDIA_ROOT = path.join(__dirname, '..', 'public', 'projects_media');

const TOKEN = process.env.GH_PROJECTS_TOKEN || process.env.GITHUB_TOKEN;
const DEBUG_FETCH = process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true';
// NOTE: do not exit at require-time so helper functions can be imported by other scripts.
// The token presence will be checked when running as a script (see bottom guard).

const MAX = 2 * 1024 * 1024; // 2 MB max image download
// Use a named query that declares a $login variable and fetches the user's pinned repositories; README content will be fetched via raw.githubusercontent per-repo.
// We request __typename and use a minimal inline fragment for Repository fields.
const QUERY = `query getPinned($login: String!) { user(login: $login) { pinnedItems(first: 12, types: [REPOSITORY]) { nodes { __typename ... on Repository { name description url } } } } }`;

function isBadgeLike(u) {
  if (!u) return false;
  const s = String(u).toLowerCase();
  // common badge patterns and CI hosts
  if (s.includes('badge') || s.includes('shield') || s.includes('status') || s.includes('travis') || s.includes('circleci') || s.includes('shields.io') || s.includes('actions/workflows') || s.includes('github.com/badges')) return true;
  // prefer raster images over SVGs (badges are frequently svg) unless no other choice
  if (s.endsWith('.svg')) return true;
  return false;
}

async function fetchGraphQL() {
  const variables = { login: 'keglev' };
  const TEST_Q = '{ viewer { login } }';
  try {
    // quick auth/test query to ensure tokens and endpoint are healthy
    try {
      if (DEBUG_FETCH) console.log('DEBUG: Running quick viewer { login } test');
      const testRes = await axios.post('https://api.github.com/graphql', { query: TEST_Q }, { headers: { Authorization: `Bearer ${TOKEN}` }, timeout: 8000 });
      if (testRes && testRes.data && testRes.data.errors && testRes.data.errors.length) {
        throw new Error('GraphQL test errors: ' + JSON.stringify(testRes.data.errors));
      }
      if (!testRes || !testRes.data || !testRes.data.data || !testRes.data.data.viewer) {
        if (DEBUG_FETCH) console.log('DEBUG: testRes body:', JSON.stringify(testRes && testRes.data).slice(0,1000));
        throw new Error('GraphQL test failed: unexpected response');
      }
    } catch (e) {
      throw new Error('GraphQL auth/test query failed: ' + (e && e.message));
    }
    if (DEBUG_FETCH) {
      console.log('DEBUG: GraphQL variables:', variables, 'Auth present:', !!TOKEN);
      try {
        console.log('DEBUG: QUERY length:', QUERY.length);
        const col = 228;
        const start = Math.max(0, col - 60);
        const end = Math.min(QUERY.length, col + 60);
        const snippet = QUERY.slice(start, end);
        const codes = snippet.split('').map(c => { const cc = c.charCodeAt(0); return (cc < 32 || cc > 126) ? ('\\u' + cc.toString(16).padStart(4,'0')) : c; }).join('');
        console.log('DEBUG: QUERY snippet around col', col, ':', codes);
        console.log('DEBUG: outbound payload preview:', JSON.stringify({ query: QUERY.slice(0,1000), variables: variables }, null, 2).slice(0,2000));
      } catch (e) { /* ignore debug failures */ }
    }
  // send variables only if the query actually declares variables
  const payload = QUERY.includes('$') ? { query: QUERY, variables } : { query: QUERY };
  if (DEBUG_FETCH) try { console.log('DEBUG: outbound payload length', JSON.stringify(payload).length); } catch(e){}
  const res = await axios.post('https://api.github.com/graphql', payload, { headers: { Authorization: `Bearer ${TOKEN}` }, timeout: 10000 });
    if (DEBUG_FETCH) {
      try { console.log('DEBUG: GraphQL response status:', res && res.status, 'body preview:', JSON.stringify(res.data).slice(0, 2000)); } catch (e) { /* ignore */ }
    }
    // surface GraphQL errors if present
    if (res && res.data && res.data.errors && res.data.errors.length) {
      if (DEBUG_FETCH) {
        try {
          console.log('DEBUG: GraphQL errors payload:', JSON.stringify(res.data.errors, null, 2));
          const err0 = res.data.errors[0];
          if (err0 && err0.locations && err0.locations[0] && typeof err0.locations[0].column === 'number') {
            const col = err0.locations[0].column; // 1-based
            const idx = Math.max(0, col - 1);
            const start = Math.max(0, idx - 40);
            const end = Math.min(QUERY.length, idx + 40);
            const snippet = QUERY.slice(start, end);
            const codes = snippet.split('').map(c => { const cc = c.charCodeAt(0); return (cc < 32 || cc > 126) ? ('\\u' + cc.toString(16).padStart(4,'0')) : c; }).join('');
            console.log('DEBUG: Query snippet around reported column', col, ':', codes);
          }
        } catch (e) { /* ignore */ }
      }
      throw new Error('GraphQL errors: ' + JSON.stringify(res.data.errors));
    }
    // Normalize response body and accept either pinnedItems.nodes or repositories.nodes
    const body = (res && res.data) ? res.data : null;
    const user = body && body.data && body.data.user;
    let nodes = null;
    if (user) {
      if (user.pinnedItems && Array.isArray(user.pinnedItems.nodes)) nodes = user.pinnedItems.nodes;
      else if (user.repositories && Array.isArray(user.repositories.nodes)) nodes = user.repositories.nodes;
    }
    if (!Array.isArray(nodes)) {
      const bstr = body ? JSON.stringify(body, null, 2) : String(res);
      if (DEBUG_FETCH) {
        try {
          console.log('DEBUG: GraphQL body keys:', Object.keys(body || {}));
          if (body && body.data && body.data.user) console.log('DEBUG: user keys:', Object.keys(body.data.user));
        } catch (e) {}
      }
      throw new Error('Invalid response from GraphQL: ' + bstr + '\nSent variables: ' + JSON.stringify(variables));
    }
    return nodes;
  } catch (err) {
    if (err.response && err.response.data) {
      throw new Error('GraphQL request failed: ' + JSON.stringify(err.response.data, null, 2) + '\nSent variables: ' + JSON.stringify(variables));
    }
    throw new Error((err && err.message) || String(err));
  }
}

function md5(input) { return crypto.createHash('md5').update(input || '').digest('hex'); }

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

// Persist per-repo meta.json with translation and docsTitle fields after translations
function persistMetaForNode(node) {
  try {
    const mediaDir = path.join(MEDIA_ROOT, node.name);
    ensureDir(mediaDir);
    const metaPath = path.join(mediaDir, 'meta.json');
    let meta = { readmeHash: null, files: [] };
    try { if (fs.existsSync(metaPath)) meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) || meta; } catch (e) { meta = { readmeHash: null, files: [] }; }
    // update fields
    try { meta.readmeHash = md5((node.object && node.object.text) || ''); } catch (e) {}
    meta.files = meta.files || [];
    if (node._imageSelection) meta.imageSelection = node._imageSelection;
    if (node.primaryImage) meta.primaryImage = node.primaryImage;
    if (node._summarySource) meta.summarySource = node._summarySource;
    if (node._translation) {
      // avoid storing large raw translation payload unless debug mode is enabled
      try {
        const transl = JSON.parse(JSON.stringify(node._translation));
        if (!DEBUG_FETCH) {
          if (transl.summary && transl.summary.raw) transl.summary.raw = undefined;
          if (transl.docsTitle && transl.docsTitle.raw) transl.docsTitle.raw = undefined;
        }
        meta.translation = transl;
      } catch (e) { meta.translation = node._translation; }
    }
    if (node.docsTitle_de) meta.docsTitle_de = node.docsTitle_de;
    if (node.docsTitle) meta.docsTitle = node.docsTitle;
    if (node.docsTitle_normalized) meta.docsTitle_normalized = node.docsTitle_normalized;
    if (node.summary_de) meta.summary_de = node.summary_de;
    try { fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8'); } catch (e) { if (DEBUG_FETCH) console.log('meta write failed for', node.name, e && e.message); }
  } catch (e) { if (DEBUG_FETCH) console.log('persistMetaForNode error', e && e.message); }
}

async function downloadIfNeeded(repo, url, candidate) {
  try {
    const parsed = new URL(url);
    const ext = path.extname(parsed.pathname) || '.img';
    const base = path.basename(parsed.pathname, ext).replace(/[^a-z0-9-_]/gi, '_').slice(0, 40) || 'img';
    const filename = `${base}-${md5(url).slice(0,8)}${ext}`;
    const mediaDir = path.join(MEDIA_ROOT, repo);
    ensureDir(mediaDir);
    const out = path.join(mediaDir, filename);
    const metaPath = path.join(mediaDir, 'meta.json');

    let meta = { readmeHash: null, files: [] };
    try { if (fs.existsSync(metaPath)) meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) || meta; } catch (e) { meta = { readmeHash: null, files: [] }; }

    // If the file already present and tracked, reuse
    if (meta.files && meta.files.includes(filename) && fs.existsSync(out)) return filename;

    // HEAD-check content-type and size when possible. Avoid downloading SVG badges unless the candidate is explicitly a project-image path.
    try {
      const h = await axios.head(url, { maxRedirects: 5 });
      const ct = h.headers['content-type'] || '';
      const cl = h.headers['content-length'] ? parseInt(h.headers['content-length'], 10) : null;
      if (!/^image\//i.test(ct)) return null;
      // skip svg badge-like images unless the original candidate indicates a project-image
      const isSvg = /svg/i.test(ct) || /\.svg$/i.test(url);
      const explicitProjectImage = /project[-_]?image|src\/assets\/imgs|assets\/imgs|assets\/img/i.test(candidate || '');
      if (isSvg && !explicitProjectImage) return null;
      if (cl && cl > MAX) return null;
    } catch (e) {
      // ignore head failures and try GET
    }

    const r = await axios.get(url, { responseType: 'arraybuffer', maxContentLength: MAX, maxRedirects: 5 });
    if (r && r.status === 200 && r.data) {
      // if content returned is SVG but candidate wasn't explicit, drop it
  const maybeText = (r.headers && r.headers['content-type']) || '';
      const isSvgResp = /svg/i.test(maybeText) || /<svg[\s>]/i.test(String(r.data).slice(0, 512));
      const explicitProjectImage2 = /project[-_]?image|src\/assets\/imgs|assets\/imgs|assets\/img/i.test(candidate || '');
      if (isSvgResp && !explicitProjectImage2) return null;
      fs.writeFileSync(out, r.data);
      meta.files = meta.files || [];
      if (!meta.files.includes(filename)) meta.files.push(filename);
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
      return filename;
    }
  } catch (e) {
    // ignore and return null
  }
  return null;
}

function findImageCandidateFromAst(ast) {
  if (!ast || !ast.children) return null;
  let candidate = null;
  // Helper to find images below a heading with a matching title (e.g., screenshots)
  const findUnderHeading = (titleRe) => {
    if (!ast || !Array.isArray(ast.children)) return null;
    for (let i = 0; i < ast.children.length; i++) {
      const n = ast.children[i];
      if (n.type === 'heading') {
        const txt = (n.children||[]).map(c=>c.value||'').join('').toLowerCase();
        if (titleRe.test(txt)) {
          // scan following nodes until next heading
          let j = i+1;
          while (j < ast.children.length && ast.children[j].type !== 'heading') {
            const nn = ast.children[j];
                if (nn.type === 'image' && nn.url) return nn.url;
            if (nn.type === 'html' && typeof nn.value === 'string') {
              const m = nn.value.match(/<img[^>]+src=["']?([^"' >]+)["']?/i);
              if (m && m[1]) return m[1];
            }
            if (nn.children && Array.isArray(nn.children)) {
              // search children for inline images
                  const flat = JSON.stringify(nn);
                   const r = flat.match(/https?:\/\/[^"']+|\/.+?\.(png|jpe?g|gif|svg)/i);
              if (r && r[0]) return r[0];
            }
            j++;
          }
        }
      }
    }
    return null;
  };

  // Prefer images under screenshots-like headings first
  const preferred = findUnderHeading(/screenshots|screenshot|images|gallery/i);
  if (preferred) return preferred;
  const walk = (n) => {
    if (!n || candidate) return;
    if (n.type === 'image' && n.url) {
      const u = n.url;
      // prefer explicit project-image or assets/imgs references and raster formats (your standard)
      if (/project[-_]?image|src\/assets\/imgs|src\/assets|assets\/imgs|assets\/img|project-image/i.test(u) && /\.(png|jpe?g|gif)$/i.test(u)) { candidate = u; candidate = u; candidate = u; candidate = u; candidate = u; candidate = u; candidate = u; candidate = u; candidate = u; candidate = u; candidate = u; candidate = u; candidate = u; candidate = u; return; }
      if (!isBadgeLike(u) && /\.(png|jpe?g|gif)$/i.test(u)) { candidate = u; return; }
      if (!isBadgeLike(u) && !candidate) candidate = u;
    }
    // handle raw HTML <img src="..."> nodes which remark parses as 'html'
    if (n.type === 'html' && typeof n.value === 'string') {
      // find img src attributes
      const html = n.value;
      const m = html.match(/<img[^>]+src=["']?([^"' >]+)["']?/i);
      if (m && m[1]) {
        const u = m[1];
        if (/project[-_]?image|src\/assets\/imgs|src\/assets|assets\/imgs|assets\/img|project-image/i.test(u) && /\.(png|jpe?g|gif)$/i.test(u)) { candidate = u; return; }
        if (!isBadgeLike(u) && /\.(png|jpe?g|gif)$/i.test(u)) { candidate = u; return; }
        if (!isBadgeLike(u) && !candidate) candidate = u;
      }
    }
    if (n.children && Array.isArray(n.children)) for (const c of n.children) walk(c);
  };
  walk(ast);
  return candidate;
}

function extractTechnologiesFromAst(ast) {
  try {
    const techs = [];
    if (!ast || !Array.isArray(ast.children)) return techs;
    for (let i = 0; i < ast.children.length; i++) {
      const el = ast.children[i];
      if (el.type === 'heading' && /technolog|tech|stack/i.test(((el.children||[]).map(c=>c.value||'').join('')||''))) {
        const currentDepth = el.depth || 2;
        let j = i+1;
        while (j < ast.children.length) {
          const nn = ast.children[j];
          // stop when we hit a heading at same or higher level
          if (nn && nn.type === 'heading' && typeof nn.depth === 'number' && nn.depth <= currentDepth) break;
          if (nn.type === 'list' && nn.children) {
            for (const li of nn.children) {
              // flatten text in list item
              const txt = (li.children||[]).map(ch => {
                if (ch.type === 'paragraph' || ch.type === 'text' || ch.type === 'link') return (ch.children||[]).map(cc=>cc.value||'').join(' ');
                return ch.value || '';
              }).join(' ').trim();
              if (txt) techs.push(txt.replace(/^[*\-\s]+/,'').trim());
            }
          }
          if (nn.type === 'paragraph') {
            const p = (nn.children||[]).map(c=>c.value||'').join(' ');
            if (p && p.includes(',')) p.split(',').map(s=>s.trim().replace(/^Also[:\s]+/i,'')).filter(Boolean).forEach(x=>techs.push(x));
            else if (p && p.length>0 && !/^(<|!|#)/.test(p)) techs.push(p.trim().replace(/^Also[:\s]+/i,''));
          }
          j++;
        }
        break;
      }
    }
    return techs.filter(Boolean);
  } catch (e) { return []; }
}

function extractDocsFromAst(ast, repo) {
  try {
    const docs = { documentation: null, apiDocumentation: null };
    // helper: convert relative hrefs to raw.githubusercontent when repo provided
    const toRaw = (href) => {
      if (!href) return href;
      if (/^https?:\/\//i.test(href)) return href;
      const p = String(href).trim().replace(/^\.\//, '').replace(/^\//, '');
      return repo ? `https://raw.githubusercontent.com/keglev/${repo}/main/${p}` : p;
    };
    if (!ast || !Array.isArray(ast.children)) return docs;
    for (let i = 0; i < ast.children.length; i++) {
      const n = ast.children[i];
      if (n.type === 'heading') {
        // flatten heading text robustly
        const flattenNodeText = (node) => {
          try {
            if (!node) return '';
            if (node.type === 'text') return node.value || '';
            if (node.children && Array.isArray(node.children)) return node.children.map(ch => flattenNodeText(ch)).join('');
            return node.value || '';
          } catch (e) { return ''; }
        };
        const headingText = (flattenNodeText(n) || '').toLowerCase();
        // documentation section
        if (/\bdocumentation\b/.test(headingText) && !docs.documentation) {
          const currentDepth = n.depth || 2;
          let k = i+1;
          while (k < ast.children.length) {
            const nn = ast.children[k];
            if (nn && nn.type === 'heading' && typeof nn.depth === 'number' && nn.depth <= currentDepth) break;
            if (nn.type === 'paragraph' && nn.children) {
              const linkNode = nn.children.find(c => c.type === 'link');
              if (linkNode) {
                const link = linkNode.url;
                const desc = nn.children.filter(c => c.type === 'text').map(c => c.value).join(' ').trim();
                docs.documentation = { title: (linkNode.children && linkNode.children[0] && linkNode.children[0].value) || 'Documentation', link, description: desc };
                docs.documentation = { title: (linkNode.children && linkNode.children[0] && linkNode.children[0].value) || 'Documentation', link: toRaw(link), description: desc };
                break;
              }
            }
            if (nn.type === 'list' && nn.children) {
              for (const li of nn.children) {
                const linkChild = (li.children||[]).flatMap(ch => (ch.children||[])).find(c => c && c.type === 'link');
                if (linkChild) {
                  const link = linkChild.url;
                  const desc = (li.children||[]).flatMap(ch => (ch.children||[])).filter(c=>c.type==='text').map(c => c.value).join(' ').trim();
                  docs.documentation = { title: (linkChild.children && linkChild.children[0] && linkChild.children[0].value) || 'Documentation', link, description: desc };
                  docs.documentation = { title: (linkChild.children && linkChild.children[0] && linkChild.children[0].value) || 'Documentation', link: toRaw(link), description: desc };
                  break;
                }
              }
              if (docs.documentation) break;
            }
            k++;
          }
        }

        // API docs
        if (/api documentation|api docs|api documentation hub/i.test(headingText) && !docs.apiDocumentation) {
          const currentDepth = n.depth || 2;
          let k = i+1;
          while (k < ast.children.length) {
            const nn = ast.children[k];
            if (nn && nn.type === 'heading' && typeof nn.depth === 'number' && nn.depth <= currentDepth) break;
            if (nn.type === 'paragraph' && nn.children) {
              const linkNode = nn.children.find(c => c.type === 'link');
              if (linkNode) {
                const link = linkNode.url;
                const desc = nn.children.filter(c => c.type === 'text').map(c => c.value).join(' ').trim();
                docs.apiDocumentation = { title: (linkNode.children && linkNode.children[0] && linkNode.children[0].value) || 'API Documentation', link, description: desc };
                docs.apiDocumentation = { title: (linkNode.children && linkNode.children[0] && linkNode.children[0].value) || 'API Documentation', link: toRaw(link), description: desc };
                break;
              }
            }
            if (nn.type === 'list' && nn.children) {
              for (const li of nn.children) {
                const linkChild = (li.children||[]).flatMap(ch => (ch.children||[])).find(c => c && c.type === 'link');
                if (linkChild) {
                  const link = linkChild.url;
                  const desc = (li.children||[]).flatMap(ch => (ch.children||[])).filter(c=>c.type==='text').map(c => c.value).join(' ').trim();
                  docs.apiDocumentation = { title: (linkChild.children && linkChild.children[0] && linkChild.children[0].value) || 'API Documentation', link: toRaw(link), description: desc };
                  break;
                }
                // fallback: scan for any absolute URL inside the list item and use it
                const flat = JSON.stringify(li);
                const m = flat.match(/https?:\/\/[^"']+/i);
                if (m) {
                  const u = m[0];
                  if (/api|openapi|swagger|docs?/i.test(u) || /api/i.test(flat)) {
                    docs.apiDocumentation = { title: 'API Documentation', link: toRaw(u), description: '' };
                    break;
                  }
                  if (!docs.apiDocumentation) docs.apiDocumentation = { title: 'API Documentation', link: toRaw(u), description: '' };
                }
              }
              if (docs.apiDocumentation) break;
            }
            k++;
          }
        }
      }
    }
    // legacy fields
    if (docs.documentation) docs.legacy = { docsLink: docs.documentation.link, docsTitle: docs.documentation.title };
    else if (docs.apiDocumentation) docs.legacy = { docsLink: docs.apiDocumentation.link, docsTitle: docs.apiDocumentation.title };
    else docs.legacy = { docsLink: null, docsTitle: null };
    return docs;
  } catch (e) { return { documentation: null, apiDocumentation: null, legacy: { docsLink: null, docsTitle: null } }; }
}

// Find a section by heading synonyms and return its text (paragraphs joined)
function findSectionText(ast, headingRegexes) {
  try {
    if (!ast || !Array.isArray(ast.children)) return null;
    const flatten = (node) => {
      if (!node) return '';
      if (node.type === 'text') return node.value || '';
      if (node.children && Array.isArray(node.children)) return node.children.map(flatten).join('');
      return node.value || '';
    };
    for (let i = 0; i < ast.children.length; i++) {
      const n = ast.children[i];
      if (n.type === 'heading') {
        const headingText = (flatten(n) || '').toLowerCase();
        for (const re of headingRegexes) {
          if (re.test(headingText)) {
            const currentDepth = n.depth || 2;
            let j = i + 1;
            const parts = [];
            while (j < ast.children.length) {
              const nn = ast.children[j];
              if (nn && nn.type === 'heading' && typeof nn.depth === 'number' && nn.depth <= currentDepth) break;
              if (nn.type === 'paragraph') {
                const txt = (nn.children||[]).map(c=>c.value||'').join(' ').trim();
                if (txt) parts.push(txt);
              }
              if (nn.type === 'list' && Array.isArray(nn.children)) {
                for (const li of nn.children) {
                  const txt = (li.children||[]).map(ch => (ch.children||[]).map(cc=>cc.value||'').join(' ') || ch.value || '').join(' ').trim();
                  if (txt) parts.push(txt);
                }
              }
              // capture html nodes (may contain <img> or descriptive text)
              if (nn.type === 'html' && typeof nn.value === 'string') {
                const cleaned = nn.value.replace(/<[^>]+>/g, ' ').replace(/\s+/g,' ').trim();
                if (cleaned) parts.push(cleaned);
              }
              j++;
            }
            if (parts.length) return parts.join('\n\n');
            return null;
          }
        }
      }
    }
  } catch (e) {
    if (DEBUG_FETCH) console.log('findSectionText error', e && e.message);
  }
  return null;
}

// DeepL API key from environment
const DEEPL_KEY = process.env.DEEPL_API_KEY || process.env.DEEPL_KEY || process.env.DEEPL_SECRET;

// Detailed DeepL wrapper: returns object with text/status/raw (for debug)
async function translateToGermanDetailed(text) {
  if (!DEEPL_KEY || !text) return { text: null, status: 'no-key-or-text' };
  try {
    const params = new URLSearchParams();
    params.append('auth_key', DEEPL_KEY);
    params.append('text', text);
    params.append('target_lang', 'DE');
    const r = await axios.post('https://api-free.deepl.com/v2/translate', params.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 });
    const out = (r && r.data && Array.isArray(r.data.translations) && r.data.translations[0] && r.data.translations[0].text) ? r.data.translations[0].text : null;
    if (DEBUG_FETCH) {
      try { console.log('DEBUG: DeepL response status', r && r.status); } catch (e) {}
    }
    return { text: out, status: (r && r.status) || null, raw: r && r.data };
  } catch (e) {
    if (DEBUG_FETCH) console.warn('DeepL failed (detailed):', (e && e.message) || e);
    return { text: null, status: 'error', error: (e && e.message) || String(e) };
  }
}

// Extract specific repo docs pieces per user's requirements and translate descriptions to German.
// Returns an object with found items or null when nothing found.
async function extractRepoDocsDetailed(readmeText, repoName) {
  if (!readmeText || !readmeText.length) return null;
  const out = { architectureOverview: null, apiDocumentation: null, testing: null };
  try {
    // helper to convert relative repo paths to raw.githubusercontent URLs
    const toRawGithub = (href) => {
      if (!href) return href;
      // absolute URLs -> return as-is
      if (/^https?:\/\//i.test(href)) return href;
      // strip surrounding <> or whitespace
      let p = String(href).trim().replace(/^<|>$/g, '');
      // remove leading ./ or leading /
      p = p.replace(/^\.\//, '').replace(/^\//, '');
      // if repoName not provided, return original href
      if (!repoName) return p;
      // build raw.githubusercontent URL (prefer main branch)
      return `https://raw.githubusercontent.com/keglev/${repoName}/main/${p}`;
    };
    // 1) Architecture Overview: prefer AST-like extraction by searching for a heading and then a link with 'Index' or '/docs' in the href or label.
    try {
      const ast = parseMarkdown(readmeText);
      if (ast && Array.isArray(ast.children)) {
        for (let i = 0; i < ast.children.length; i++) {
          const n = ast.children[i];
          if (n.type === 'heading' && /architecture overview/i.test((n.children||[]).map(c=>c.value||'').join(''))) {
            // scan following nodes for link nodes
            let j = i+1;
            while (j < ast.children.length && ast.children[j].type !== 'heading') {
              const nn = ast.children[j];
              // paragraph with link
              if (nn.type === 'paragraph' && Array.isArray(nn.children)) {
                for (const ch of nn.children) {
                  if (ch.type === 'link' && ch.url) {
                    const u = ch.url;
                    const label = (ch.children||[]).map(c=>c.value||'').join('');
                    if (/index/i.test(label) || /docs?/.test(u) || /index/.test(u)) {
                      out.architectureOverview = { title: label || 'Architecture Overview', link: toRawGithub(u), description: (nn.children||[]).filter(c=>c.type==='text').map(c=>c.value).join(' ').trim() };
                      break;
                    }
                    // keep the first link as fallback
                    if (!out.architectureOverview) out.architectureOverview = { title: label || 'Architecture Overview', link: toRawGithub(u), description: (nn.children||[]).filter(c=>c.type==='text').map(c=>c.value).join(' ').trim() };
                  }
                }
              }
              // list items with links
              if (nn.type === 'list' && Array.isArray(nn.children)) {
                for (const li of nn.children) {
                  const flatLinks = JSON.stringify(li);
                  const m = flatLinks.match(/https?:\/\/[^"']+/i);
                  if (m) {
                    const u = m[0];
                    if (/docs?|index|architecture/i.test(u) || /docs?/i.test(flatLinks)) {
                      out.architectureOverview = { title: 'Architecture Overview', link: toRawGithub(u), description: '' };
                      break;
                    }
                    if (!out.architectureOverview) out.architectureOverview = { title: 'Architecture Overview', link: toRawGithub(u), description: '' };
                  }
                }
              }
              j++;
            }
            if (out.architectureOverview) break;
          }
        }
      }
      // fallback to text regex if AST didn't yield
      if (!out.architectureOverview) {
        const archRe = /^\s*#{1,6}\s*.*architecture overview.*$/im;
        const archIdx = readmeText.search(archRe);
        if (archIdx !== -1) {
          const snippet = readmeText.slice(archIdx);
          const linkLine = snippet.match(/-\s*\.\s*\[([^\]]*Index[^\]]*)\]\(([^)]+)\)\s*[–—-]?\s*(.*)/i);
          if (linkLine) out.architectureOverview = { title: linkLine[1].trim(), link: toRawGithub(linkLine[2].trim()), description: (linkLine[3] || '').trim() };
          else {
            const firstLink = snippet.match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\.?\/?[^)\s]+|[^)]+\.md)\)\s*-?\s*(.*)/i);
            if (firstLink) out.architectureOverview = { title: firstLink[1].trim(), link: toRawGithub(firstLink[2].trim()), description: (firstLink[3]||'').trim() };
          }
        }
      }
    } catch (e) {
      if (DEBUG_FETCH) console.log('extractRepoDocsDetailed arch AST error', e && e.message);
    }

    // 2) API Documentation Hub: find heading and pick first 'Complete API Documentation' link and its description
    try {
      // prefer AST extraction for api documentation hub
      const ast = parseMarkdown(readmeText);
      if (ast && Array.isArray(ast.children)) {
        for (let i = 0; i < ast.children.length; i++) {
          const n = ast.children[i];
          if (n.type === 'heading' && /api documentation hub|api docs|api documentation/i.test((n.children||[]).map(c=>c.value||'').join(''))) {
            let j = i+1;
            while (j < ast.children.length && ast.children[j].type !== 'heading') {
              const nn = ast.children[j];
              if (nn.type === 'paragraph' && Array.isArray(nn.children)) {
                for (const ch of nn.children) {
                  if (ch.type === 'link' && ch.url) {
                    const u = ch.url;
                    const label = (ch.children||[]).map(c=>c.value||'').join('');
                    if (/complete api|api docs|swagger|openapi|docs?/i.test(label + ' ' + u)) {
                      out.apiDocumentation = { title: label || 'API Documentation', link: u, description: (nn.children||[]).filter(c=>c.type==='text').map(c=>c.value).join(' ').trim() };
                      break;
                    }
                    if (!out.apiDocumentation) out.apiDocumentation = { title: label || 'API Documentation', link: u, description: (nn.children||[]).filter(c=>c.type==='text').map(c=>c.value).join(' ').trim() };
                  }
                }
              }
              if (nn.type === 'list' && Array.isArray(nn.children)) {
                for (const li of nn.children) {
                  const flat = JSON.stringify(li);
                  const m = flat.match(/https?:\/\/[^"']+/i);
                  if (m) {
                    const u = m[0];
                    if (/api|openapi|swagger|docs?/i.test(u) || /api/i.test(flat)) {
                      out.apiDocumentation = { title: 'API Documentation', link: u, description: '' };
                      break;
                    }
                    if (!out.apiDocumentation) out.apiDocumentation = { title: 'API Documentation', link: u, description: '' };
                  }
                }
              }
              j++;
            }
            if (out.apiDocumentation) break;
          }
        }
      }
      if (!out.apiDocumentation) {
        const apiRe = /^\s*#{1,6}\s*.*api documentation hub.*$/im;
        const apiIdx = readmeText.search(apiRe);
        if (apiIdx !== -1) {
          const snippet = readmeText.slice(apiIdx);
          const compLink = snippet.match(/\[([^\]]*Complete API[^\]]*)\]\(([^)]+)\)\s*[–—-]?\s*(.*)/i);
          if (compLink) out.apiDocumentation = { title: compLink[1].trim(), link: compLink[2].trim(), description: (compLink[3]||'').trim() };
          else {
            const firstLink = snippet.match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\.?\/?[^)\s]+|[^)]+\.md)\)\s*-?\s*(.*)/i);
            if (firstLink) out.apiDocumentation = { title: firstLink[1].trim(), link: firstLink[2].trim(), description: (firstLink[3]||'').trim() };
          }
        }
      }
    } catch (e) {
      if (DEBUG_FETCH) console.log('extractRepoDocsDetailed api AST error', e && e.message);
    }

    // 3) Testing & Code Quality: find heading and extract Coverage link and Testing Architecture documentation link
    try {
      const ast = parseMarkdown(readmeText);
      if (ast && Array.isArray(ast.children)) {
        for (let i = 0; i < ast.children.length; i++) {
          const n = ast.children[i];
          if (n.type === 'heading' && /testing & code quality|testing/i.test((n.children||[]).map(c=>c.value||'').join(''))) {
            let j = i+1;
            while (j < ast.children.length && ast.children[j].type !== 'heading') {
              const nn = ast.children[j];
              if (nn.type === 'paragraph' && Array.isArray(nn.children)) {
                for (const ch of nn.children) {
                  if (ch.type === 'link' && ch.url) {
                    const u = ch.url; const label = (ch.children||[]).map(c=>c.value||'').join('');
                    if (/coverage|coverage badge|coveralls|codecov|coverage report/i.test(label + ' ' + u)) {
                      out.testing = out.testing || {}; out.testing.coverage = { title: label || 'Coverage', link: u, description: (nn.children||[]).filter(c=>c.type==='text').map(c=>c.value).join(' ').trim() };
                    }
                    if (/testing architecture|testing docs|test architecture/i.test(label + ' ' + u)) {
                      out.testing = out.testing || {}; out.testing.testingDocs = { title: label || 'Testing Architecture', link: u, description: (nn.children||[]).filter(c=>c.type==='text').map(c=>c.value).join(' ').trim() };
                    }
                    if (out.testing && out.testing.coverage && out.testing.testingDocs) break;
                    if (!out.testing) out.testing = out.testing || {};
                  }
                }
              }
              if (nn.type === 'list' && Array.isArray(nn.children)) {
                for (const li of nn.children) {
                  const flat = JSON.stringify(li);
                  const m = flat.match(/https?:\/\/[^"']+/i);
                  if (m) {
                    const u = m[0];
                    if (/coverage|codecov|coveralls/i.test(u)) {
                      out.testing = out.testing || {};
                      out.testing.coverage = out.testing.coverage || { title: 'Coverage', link: u, description: '' };
                    }
                    if (/testing|test|architecture/i.test(u)) {
                      out.testing = out.testing || {};
                      out.testing.testingDocs = out.testing.testingDocs || { title: 'Testing Architecture', link: u, description: '' };
                    }
                  }
                }
              }
              j++;
            }
            if (out.testing && (out.testing.coverage || out.testing.testingDocs)) break;
          }
        }
      }
      // fallback: original regex approach
      if (!out.testing) {
        const testRe = /^\s*#{1,6}\s*.*testing & code quality.*$/im;
        const testIdx = readmeText.search(testRe);
        if (testIdx !== -1) {
          const snippet = readmeText.slice(testIdx);
          const coverageMatch = snippet.match(/\[([^\]]*coverage[^\]]*)\]\((https?:\/\/[^)\s]+)\)\s*[–—-]?\s*(.*)/i);
          if (coverageMatch) { out.testing = out.testing || {}; out.testing.coverage = { title: coverageMatch[1].trim(), link: coverageMatch[2].trim(), description: (coverageMatch[3]||'').trim() }; }
          const archTestMatch = snippet.match(/\[([^\]]*Testing Architecture Documentation[^\]]*)\]\(([^)]+)\)\s*[–—-]?\s*(.*)/i);
          if (archTestMatch) { out.testing = out.testing || {}; out.testing.testingDocs = { title: archTestMatch[1].trim(), link: archTestMatch[2].trim(), description: (archTestMatch[3]||'').trim() }; }
        }
      }
    } catch (e) {
      if (DEBUG_FETCH) console.log('extractRepoDocsDetailed testing AST error', e && e.message);
    }

    // Translate descriptions to German (if available)
    // normalize relative links to raw GitHub when repoName provided
    const normalizeIfRelative = (href) => {
      if (!href) return href;
      if (/^https?:\/\//i.test(href)) return href;
      return toRawGithub(href);
    };
    if (out.architectureOverview && out.architectureOverview.link) {
      out.architectureOverview.link = normalizeIfRelative(out.architectureOverview.link);
    }
    if (out.apiDocumentation && out.apiDocumentation.link) {
      out.apiDocumentation.link = normalizeIfRelative(out.apiDocumentation.link);
    }
    if (out.testing && out.testing.testingDocs && out.testing.testingDocs.link) {
      out.testing.testingDocs.link = normalizeIfRelative(out.testing.testingDocs.link);
    }

    if (out.architectureOverview && out.architectureOverview.description) {
      const t = await translateToGermanDetailed(out.architectureOverview.description);
      out.architectureOverview.description_de = t && t.text ? t.text : null;
    }
    if (out.apiDocumentation && out.apiDocumentation.description) {
      const t = await translateToGermanDetailed(out.apiDocumentation.description);
      out.apiDocumentation.description_de = t && t.text ? t.text : null;
    }
    if (out.testing) {
      if (out.testing.coverage && out.testing.coverage.description) {
        const t = await translateToGermanDetailed(out.testing.coverage.description);
        out.testing.coverage.description_de = t && t.text ? t.text : null;
      }
      if (out.testing.testingDocs && out.testing.testingDocs.description) {
        const t = await translateToGermanDetailed(out.testing.testingDocs.description);
        out.testing.testingDocs.description_de = t && t.text ? t.text : null;
      }
    }
  } catch (e) {
    if (DEBUG_FETCH) console.log('extractRepoDocsDetailed error', e && e.message);
  }
  // check if any data found; if none, return null
  const foundAny = (out.architectureOverview || out.apiDocumentation || out.testing) && ( (out.architectureOverview && out.architectureOverview.link) || (out.apiDocumentation && out.apiDocumentation.link) || (out.testing && (out.testing.coverage || out.testing.testingDocs)) );
  return foundAny ? out : null;
}

// Normalize titles/short text: strip markdown links, emoji-like surrogate pairs, common markdown punctuation
function normalizeTitle(t, maxLen = 120) {
  if (!t) return null;
  try {
    let s = String(t || '');
    // replace markdown links [text](url) -> text
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    // remove inline URLs
    s = s.replace(/https?:\/\/\S+/g, '');
    // remove emoji surrogate pairs
    s = s.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');
    // remove :emoji: shortcodes
    s = s.replace(/:[a-z0-9_+-]+:/gi, '');
    // strip markdown emphasis/backticks/hash/greater-than
  s = s.replace(/[*_`>#~]/g, '');
    // collapse whitespace
    s = s.replace(/\s+/g, ' ').trim();
    if (s.length > maxLen) s = s.slice(0, maxLen).trim() + '…';
    return s || null;
  } catch (e) {
    return (t && String(t).slice(0, maxLen)) || null;
  }
}

// Normalize longer summary: remove excessive markdown, collapse whitespace, truncate
function normalizeSummary(t, maxLen = 400) {
  if (!t) return '';
  try {
    let s = String(t || '');
    // remove code blocks
    s = s.replace(/```[\s\S]*?```/g, '');
    // remove inline code
    s = s.replace(/`([^`]+)`/g, '$1');
    // replace markdown links [text](url) -> text
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    // strip HTML tags
    s = s.replace(/<[^>]+>/g, '');
    // remove stray URLs
    s = s.replace(/https?:\/\/\S+/g, '');
    // remove emoji surrogate pairs
    s = s.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');
    // collapse whitespace
    s = s.replace(/\s+/g, ' ').trim();
    if (s.length > maxLen) s = s.slice(0, maxLen).trim() + '…';
    return s;
  } catch (e) {
    return (t && String(t).slice(0, maxLen)) || '';
  }
}

async function fetchPinned() {
  try {
    const nodes = await fetchGraphQL();
    if (!Array.isArray(nodes)) throw new Error('Invalid response from GraphQL');

    // ensure media root exists
    ensureDir(MEDIA_ROOT);

  // filter for repository nodes (pinnedItems can contain other types)
  const repoNodes = nodes.filter(n => n && n.__typename === 'Repository');
  for (const node of repoNodes) {
      // ensure README available (GraphQL may return blob text)
      if (!node.object || !node.object.text) {
        for (const br of ['main','master']) {
          try {
            const r = await axios.get(`https://raw.githubusercontent.com/keglev/${node.name}/${br}/README.md`, { responseType: 'text', timeout: 8000 });
            if (r && r.status === 200 && r.data) { node.object = node.object || {}; node.object.text = r.data; break; }
          } catch (e) { }
        }
      }

      const readme = node.object && node.object.text;
      if (!readme || typeof readme !== 'string') continue;

  // parse AST
  let ast = null;
  try { ast = parseMarkdown(readme); } catch (e) { ast = null; }
  // attach AST for later extraction
  try { node._ast = ast; } catch (e) { /* ignore */ }

      // candidate image
      let candidate = null;
      // prefer explicit project-image path if available on main/master
      const explicitPaths = [`https://raw.githubusercontent.com/keglev/${node.name}/main/src/assets/imgs/project-image.png`, `https://raw.githubusercontent.com/keglev/${node.name}/master/src/assets/imgs/project-image.png`];
      for (const p of explicitPaths) {
        try {
          const h = await axios.head(p, { maxRedirects: 5, timeout: 4000 });
          const ct = (h.headers['content-type']||'').toLowerCase();
          if (h.status === 200 && /^image\//.test(ct)) { candidate = p; node._imageSelection = { original: 'src/assets/imgs/project-image.png', chosenUrl: p, reason: 'explicit-project-image' }; break; }
        } catch (e) { /* ignore */ }
      }
      if (!candidate) candidate = findImageCandidateFromAst(ast);
      if (!candidate) {
        const re = /!\[[^\]]*\]\(([^)]+)\)/g; const m = re.exec(readme); if (m) candidate = m[1].trim();
      }

      // attempt to download candidate
      if (candidate) {
        // sanitize candidate (remove title or angle brackets)
        let img = candidate;
        const sp = img.indexOf(' '); if (sp !== -1 && !img.startsWith('<')) img = img.slice(0, sp);
        if (img.startsWith('<') && img.endsWith('>')) img = img.slice(1, -1);

        const absoluteCandidates = /^https?:\/\//i.test(img) ? [img] : [ `https://raw.githubusercontent.com/keglev/${node.name}/main/${img.replace(/^\.\/?/,'')}`, `https://raw.githubusercontent.com/keglev/${node.name}/master/${img.replace(/^\.\/?/,'')}` ];
        for (const u of absoluteCandidates) {
          const fn = await downloadIfNeeded(node.name, u, candidate);
          if (fn) {
            // record which URL was chosen and why for debugging
            try { node._imageSelection = node._imageSelection || {}; node._imageSelection.chosenUrl = u; node._imageSelection.filename = fn; node._imageSelection.reason = node._imageSelection.reason || 'downloaded'; } catch (e) {}
            node.primaryImage = `/projects_media/${node.name}/${fn}`;
            // Replace the specific candidate occurrence with the primaryImage
            try { node.object.text = node.object.text.split(candidate).join(node.primaryImage); } catch (e) {}
            // Additionally, rewrite any badge-like or SVG image references in the README to use the chosen primary image
            try {
              const pi = node.primaryImage;
              if (pi && typeof node.object.text === 'string') {
                // replace markdown image links that point to SVGs or badge-like hosts
                node.object.text = node.object.text.replace(/!\[[^\]]*\]\((https?:\/\/[^)]+\.(svg))\)/gi, `![$1](${pi}`);
                node.object.text = node.object.text.replace(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/gi, (m, p1) => {
                  // if link looks badge-like, replace
                  if (isBadgeLike(p1) || /\.svg$/i.test(p1)) return `![](${pi})`;
                  return m;
                });
                // replace HTML <img src="..."> occurrences
                node.object.text = node.object.text.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, (m, src) => {
                  if (isBadgeLike(src) || /\.svg$/i.test(src)) return `<img src="${pi}" />`;
                  return m;
                });
              }
            } catch (e) {}
            break;
          }
        }
      }

      // technologies
      node.technologies = extractTechnologiesFromAst(ast);

      // docs (AST lightweight extraction)
  const docs = extractDocsFromAst(ast, node.name) || { documentation: null, apiDocumentation: null, legacy: { docsLink: null, docsTitle: null } };
  node.docs = { documentation: docs.documentation, apiDocumentation: docs.apiDocumentation };
  node.docsLink = (docs.legacy && docs.legacy.docsLink) || null;
  node.docsTitle = (docs.legacy && docs.legacy.docsTitle) || null;

  // richer repo docs extraction & translations (user-specified rules)
  try {
    const detailed = await extractRepoDocsDetailed(node.object && node.object.text, node.name);
    if (detailed) {
      node.repoDocs = detailed;
      // Backfill legacy docsLink/docsTitle for older consumers: prefer API docs, then architecture overview
      try {
        if (!node.docsLink || /github\.com\/.+\/(issues|pulls?)\b/i.test(node.docsLink)) {
          if (detailed.apiDocumentation && detailed.apiDocumentation.link) {
            node.docsLink = detailed.apiDocumentation.link;
            node.docsTitle = node.docsTitle || detailed.apiDocumentation.title || node.docsTitle;
          } else if (detailed.architectureOverview && detailed.architectureOverview.link) {
            node.docsLink = detailed.architectureOverview.link;
            node.docsTitle = node.docsTitle || detailed.architectureOverview.title || node.docsTitle;
          }
        }
      } catch (e) { if (DEBUG_FETCH) console.log('backfill docsLink failed for', node.name, e && e.message); }
    }
  } catch (e) { if (DEBUG_FETCH) console.log('extractRepoDocsDetailed failed for', node.name, e && e.message); }

      // Fallback: if detailed extraction found nothing, scan README for any doc-like link patterns
      if (!node.repoDocs) {
        try {
          const txt = (node.object && node.object.text) || '';
          const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\.\/[^)\s]+|\/[^)\s]+|[^)]+\.md)\)/ig;
          let m;
          while ((m = linkRe.exec(txt)) !== null) {
            const label = (m[1]||'').trim();
            let href = (m[2]||'').trim();
            // ignore obvious non-doc links
            if (/localhost|127\.0\.0\.1|docker|:/i.test(href)) continue;
            if (/docs?|api|redoc|openapi|swagger|reDoc|documentation|api docs/i.test(label + ' ' + href)) {
              // normalize relative to raw.githubusercontent
              if (!/^https?:\/\//i.test(href)) href = href.replace(/^\.?\//,'').replace(/^\//,'');
              const absolute = /^https?:\/\//i.test(href) ? href : `https://raw.githubusercontent.com/keglev/${node.name}/main/${href}`;
              node.repoDocs = node.repoDocs || {};
              node.repoDocs.apiDocumentation = node.repoDocs.apiDocumentation || { title: label || 'API Documentation', link: absolute, description: '' };
              node.docsLink = node.docsLink || absolute;
              node.docsTitle = node.docsTitle || normalizeTitle(label) || 'Documentation';
              break;
            }
          }
        } catch (e) { if (DEBUG_FETCH) console.log('fallback README doc-scan failed for', node.name, e && e.message); }
      }
      // persist per-repo meta readmeHash and selection/translation metadata
      try {
        const mediaDir = path.join(MEDIA_ROOT, node.name);
        ensureDir(mediaDir);
        const metaPath = path.join(mediaDir, 'meta.json');
        let meta = { readmeHash: null, files: [] };
        try { if (fs.existsSync(metaPath)) meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) || meta; } catch (e) { meta = { readmeHash: null, files: [] }; }
        const h = md5(node.object.text || '');
  meta.readmeHash = h;
  meta.files = meta.files || [];
  if (node._imageSelection) meta.imageSelection = node._imageSelection;
  if (node.primaryImage) meta.primaryImage = node.primaryImage;
  if (node._summarySource) meta.summarySource = node._summarySource;
  if (node._translation) meta.translation = node._translation;
        try { fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8'); } catch (e) { if (DEBUG_FETCH) console.log('meta write failed for', node.name, e && e.message); }
      } catch (e) { if (DEBUG_FETCH) console.log('persist meta error', e && e.message); }
    }

    // summaries and flags - use AST-aware extraction to find About/Summary/Overview sections
    for (const node of nodes) {
      const readme = node.object && node.object.text;
      let summary = '';
      let summarySource = null;
      try {
  const astLocal = node._ast || (readme ? parseMarkdown(readme) : null);
          const headingRegexes = [/\babout\b/i, /\bsummary\b/i, /\boverview\b/i, /\bdescription\b/i, /\bintro\b/i, /\bwhat\b/i];
          let sec = null;
          if (astLocal) sec = findSectionText(astLocal, headingRegexes);
          // fallback to regex-based extractor when AST isn't available or didn't find a section
          if (!sec && readme) sec = extractSectionWithRegex(readme, headingRegexes);
          if (sec && sec.trim().length > 30) {
            const paras = sec.split(/\n\s*\n/).map(p => p.replace(/\s+/g,' ').trim()).filter(Boolean);
            summary = paras.length ? paras[0] : sec.replace(/\s+/g,' ').trim();
            summarySource = 'heading';
          }
      } catch (e) { if (DEBUG_FETCH) console.log('summary AST extract failed for', node.name, e && e.message); }
      if (!summary && readme && typeof readme === 'string') {
        const paragraphs = readme.split(/\n\s*\n/).map(p=>p.replace(/\r/g,'').trim()).filter(Boolean);
        summary = paragraphs.length>0 ? paragraphs[0].replace(/\s+/g,' ').trim() : (readme.replace(/\s+/g,' ').trim().slice(0,160));
        summarySource = summarySource || (paragraphs.length>0 ? 'first-paragraph' : 'raw-truncate');
        if (summary.length>160) summary = summary.slice(0,160);
      }
  // normalize and store summary
  const normalizedSummary = normalizeSummary(summary || '');
  node.summary = normalizedSummary || '';
  node._summarySource = summarySource;
  // keep a short raw excerpt for debugging
  try { node._summaryRaw = (summary || '').slice(0, 800); } catch (e) {}
      const mediaDir = path.join(MEDIA_ROOT, node.name);
      node.mediaDownloaded = fs.existsSync(mediaDir) && fs.readdirSync(mediaDir).filter(f=>f!=='meta.json').length>0;
    }

    // optional DeepL translations and final docs heuristic
    for (const node of nodes) {
      // if docsLink/title are missing, try light-weight extraction from raw text
      if (!node.docsLink || !node.docsTitle) {
        const txt = node.object && node.object.text;
        if (txt) {
          const m = txt.match(/\[([^\]]*doc[^\]]*)\]\((https?:\/\/[^)\s]+)\)/i);
          if (m) { node.docsTitle = m[1].trim(); node.docsLink = m[2].trim(); }
          else {
            const dline = txt.match(/(?:^|\n)\s*documentation[:\s]+(https?:\/\/[^\s]+)/i);
            if (dline) { node.docsTitle = 'Documentation'; node.docsLink = dline[1].trim(); }
          }
        }
      }
      // If the found docs link looks like a GitHub issues/pull link, try to prefer a better docs-like link
      try {
  const txt = (node.object && node.object.text) || '';
        const looksLikeIssue = (u) => !!(u && /github\.com\/.+\/(issues|pulls?)\b/i.test(u));
        const isDocsCandidate = (u) => !!(u && /(?:\/docs\b|\bdocs\/|redoc|openapi|swagger|\/api\/|\.md\b|api\b|documentation)/i.test(u));
        if (node.docsLink && looksLikeIssue(node.docsLink)) {
          // prefer detailed extraction results if available
          if (node.repoDocs) {
            if (node.repoDocs.apiDocumentation && node.repoDocs.apiDocumentation.link && !looksLikeIssue(node.repoDocs.apiDocumentation.link)) {
              node.docsTitle = node.repoDocs.apiDocumentation.title || node.docsTitle;
              node.docsLink = node.repoDocs.apiDocumentation.link;
            } else if (node.repoDocs.architectureOverview && node.repoDocs.architectureOverview.link && !looksLikeIssue(node.repoDocs.architectureOverview.link)) {
              node.docsTitle = node.repoDocs.architectureOverview.title || node.docsTitle;
              node.docsLink = node.repoDocs.architectureOverview.link;
            }
          }
          // fallback to docs-like links in lightweight AST docs or raw README
          if ((!node.docsLink || looksLikeIssue(node.docsLink)) && node.docs && node.docs.documentation && node.docs.documentation.link && !looksLikeIssue(node.docs.documentation.link)) {
            node.docsTitle = node.docs.documentation.title || node.docsTitle;
            node.docsLink = node.docs.documentation.link;
          }
          if ((!node.docsLink || looksLikeIssue(node.docsLink)) && txt) {
            // find first markdown link whose href or label looks docs-like and is not an issues link
            const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)]+|\/.+?|\.\/[^)]+)\)/ig;
            let lm;
            while ((lm = linkRe.exec(txt)) !== null) {
              const label = lm[1] || '';
              const href = lm[2] || '';
              if (looksLikeIssue(href)) continue;
              if (isDocsCandidate(href) || isDocsCandidate(label)) {
                node.docsTitle = node.docsTitle || label.trim();
                // normalize relative links to repository raw if necessary
                if (/^\//.test(href) || /^\.\/?/.test(href)) {
                  const cleaned = href.replace(/^\.\//,'').replace(/^\//,'');
                  node.docsLink = `https://raw.githubusercontent.com/keglev/${node.name}/main/${cleaned}`;
                } else node.docsLink = href;
                break;
              }
            }
          }
        }
      } catch (e) { if (DEBUG_FETCH) console.log('post-docsLink heuristics failed', e && e.message); }
      if (DEEPL_KEY) {
        node._translation = node._translation || {};
        node._translation.debug = node._translation.debug || {};
        try {
          // normalize short title and summary before translation
          const summaryForTranslation = normalizeSummary(node.summary || '');
          const docsTitleForTranslation = normalizeTitle(node.docsTitle || '') || '';
          if (DEBUG_FETCH) { node._translation.debug.summaryInput = (summaryForTranslation||'').slice(0,400); node._translation.debug.docsTitleInput = (docsTitleForTranslation||'').slice(0,200); }
          const before = Date.now();
          const [rSummary, rDocsTitle] = await Promise.all([translateToGermanDetailed(summaryForTranslation), translateToGermanDetailed(docsTitleForTranslation)]);
          const took = Date.now() - before;
          node._translation.debug.requestMs = took;
          if (DEBUG_FETCH) console.log(`DEBUG: DeepL took ${took}ms for ${node.name}`);
          // attach detailed responses
          node._translation.summary = rSummary || { text: null, status: null };
          node._translation.docsTitle = rDocsTitle || { text: null, status: null };
          if (rSummary && rSummary.text) node.summary_de = rSummary.text;
          if (rDocsTitle && rDocsTitle.text) node.docsTitle_de = rDocsTitle.text;
        } catch (e) {
          node._translation = node._translation || {}; node._translation.error = e && e.message; if (DEBUG_FETCH) console.log('DEBUG: DeepL error', e && e.message);
        }
        // persist meta immediately so translations and docsTitle_de are available on disk
        try { persistMetaForNode(node); } catch (e) { if (DEBUG_FETCH) console.log('persist meta post-translation failed', e && e.message); }
      }
    }

    // Final normalization pass: ensure repoDocs links are absolute raw.githubusercontent URLs
    try {
      for (const node of nodes) {
        try {
          const toRaw = (href) => {
            if (!href) return href;
            if (/^https?:\/\//i.test(href)) return href;
            const p = String(href).trim().replace(/^\.\//, '').replace(/^\//, '');
            return `https://raw.githubusercontent.com/keglev/${node.name}/main/${p}`;
          };
          if (node.repoDocs) {
            if (node.repoDocs.architectureOverview && node.repoDocs.architectureOverview.link) {
              node.repoDocs.architectureOverview.link = toRaw(node.repoDocs.architectureOverview.link);
            }
            if (node.repoDocs.apiDocumentation && node.repoDocs.apiDocumentation.link) {
              node.repoDocs.apiDocumentation.link = toRaw(node.repoDocs.apiDocumentation.link);
            }
            if (node.repoDocs.testing && node.repoDocs.testing.testingDocs && node.repoDocs.testing.testingDocs.link) {
              node.repoDocs.testing.testingDocs.link = toRaw(node.repoDocs.testing.testingDocs.link);
            }
            // backfill legacy docsLink/docsTitle with preference for API docs then architecture overview
            if (!node.docsLink || /github\.com\/.+\/(issues|pulls?)\b/i.test(node.docsLink)) {
              if (node.repoDocs.apiDocumentation && node.repoDocs.apiDocumentation.link) {
                node.docsLink = node.repoDocs.apiDocumentation.link;
                node.docsTitle = node.docsTitle || node.repoDocs.apiDocumentation.title || node.docsTitle;
              } else if (node.repoDocs.architectureOverview && node.repoDocs.architectureOverview.link) {
                node.docsLink = node.repoDocs.architectureOverview.link;
                node.docsTitle = node.docsTitle || node.repoDocs.architectureOverview.title || node.docsTitle;
              }
            }
          }
        } catch (e) { if (DEBUG_FETCH) console.log('final normalize failed for', node.name, e && e.message); }
      }
    } catch (e) { if (DEBUG_FETCH) console.log('final normalization pass error', e && e.message); }

    // Post-process: prefer github.io hosted docs pages when raw.githubusercontent links are found
    try {
      const tryGithubIo = async (node, href) => {
        try {
          if (!href) return null;
          const m = href.match(new RegExp('https?:\\/\\/raw\\.githubusercontent\\.com\\/(?:[^\\/]+)\\/(?:[^\\/]+)\\/(?:main|master)\\/docs\\/(.+)$', 'i'));
          if (!m || !m[1]) return null;
          const afterDocs = m[1].replace(/index\.html$/i, '').replace(/(^\/|\/$)/g, '');
          const candidates = [];
          // candidate 1: folder-style
          candidates.push(`https://keglev.github.io/${node.name}/${afterDocs}`);
          // candidate 2: explicit index.html
          candidates.push(`https://keglev.github.io/${node.name}/${afterDocs}/index.html`);
          // candidate 3: root of repo if afterDocs empty
          if (!afterDocs) candidates.unshift(`https://keglev.github.io/${node.name}/`);
          for (const c of candidates) {
            try {
              const h = await axios.head(c, { maxRedirects: 5, timeout: 5000 });
              const ct = (h && h.headers && h.headers['content-type']) || '';
              const xfo = (h && h.headers && (h.headers['x-frame-options'] || h.headers['X-Frame-Options'])) || '';
              if (h && h.status === 200 && /html/i.test(ct) && !/deny/i.test(xfo)) {
                if (DEBUG_FETCH) console.log('Prefer github.io for', node.name, href, '->', c, 'headers:', { status: h.status, ct, xfo });
                return c;
              }
            } catch (e) {
              if (DEBUG_FETCH) console.log('github.io candidate failed', c, e && e.message);
            }
          }
        } catch (e) { if (DEBUG_FETCH) console.log('tryGithubIo error', e && e.message); }
        return null;
      };

      for (const node of nodes) {
        try {
          // check main docsLink and repoDocs entries
          if (node.docsLink && /raw\.githubusercontent\.com/i.test(node.docsLink)) {
            const prefer = await tryGithubIo(node, node.docsLink);
            if (prefer) node.docsLink = prefer;
          }
          if (node.repoDocs) {
            if (node.repoDocs.apiDocumentation && node.repoDocs.apiDocumentation.link && /raw\.githubusercontent\.com/i.test(node.repoDocs.apiDocumentation.link)) {
              const prefer = await tryGithubIo(node, node.repoDocs.apiDocumentation.link);
              if (prefer) node.repoDocs.apiDocumentation.link = prefer;
            }
            if (node.repoDocs.architectureOverview && node.repoDocs.architectureOverview.link && /raw\.githubusercontent\.com/i.test(node.repoDocs.architectureOverview.link)) {
              const prefer = await tryGithubIo(node, node.repoDocs.architectureOverview.link);
              if (prefer) node.repoDocs.architectureOverview.link = prefer;
            }
            if (node.repoDocs.testing && node.repoDocs.testing.testingDocs && node.repoDocs.testing.testingDocs.link && /raw\.githubusercontent\.com/i.test(node.repoDocs.testing.testingDocs.link)) {
              const prefer = await tryGithubIo(node, node.repoDocs.testing.testingDocs.link);
              if (prefer) node.repoDocs.testing.testingDocs.link = prefer;
            }
          }
        } catch (e) { if (DEBUG_FETCH) console.log('post-process github.io pref failed for', node.name, e && e.message); }
      }
    } catch (e) { if (DEBUG_FETCH) console.log('github.io post-process error', e && e.message); }

    // write output
    fs.writeFileSync(OUT_PATH, JSON.stringify(nodes, null, 2), 'utf8');
    console.log('Wrote', OUT_PATH);
  } catch (err) {
  console.error('Failed to fetch pinned repositories:', (err && err.message) || err);
    process.exit(3);
  }
}

// Only run fetchPinned when the script is executed directly (not when required by tests)
if (require.main === module) {
  if (!TOKEN) {
    console.warn('No GitHub token found in environment. Skipping fetch.');
    process.exit(0);
  }
  fetchPinned().catch(e=>{ console.error('Unhandled error', (e && e.message) || e); process.exit(4); });
}

// Export helpers for unit tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseMarkdown,
    extractSectionWithRegex,
    normalizeTitle,
    normalizeSummary,
    findImageCandidateFromAst,
    isBadgeLike,
    extractTechnologiesFromAst,
    extractDocsFromAst
  };
  // Also export the detailed extractor for debugging/runnable checks
  try { module.exports.extractRepoDocsDetailed = extractRepoDocsDetailed; } catch (e) { /* ignore in some environments */ }
}
