const parseReadme = require('../parseReadme');
const DEBUG_FETCH = process.env.DEBUG_FETCH === '1' || process.env.DEBUG_FETCH === 'true';
// dependencies: parseReadme only

function stripAstJsonFragments(s) {
  try {
    if (!s || typeof s !== 'string') return s;
    let t = s.replace(/\{\s*"type"\s*:\s*"[a-z]+"[\s\S]*?\}/gi, '');
    t = t.replace(/\s+/g, ' ').trim();
    return t === '' ? null : t;
  } catch (e) { return s; }
}

// Extract specific repo docs pieces per user's requirements and translate descriptions to German.
// Returns an object with found items or null when nothing found.
async function extractRepoDocsDetailed(readmeText, repoName, translateWithCache) {
  if (!readmeText || !readmeText.length) return null;
  const out = { architectureOverview: null, apiDocumentation: null, testing: null, productionUrl: null };
  try {
    const toRawGithub = (href) => {
      if (!href) return href;
      // If this is an absolute URL, we may still be able to translate
      // known github raw/blob URLs into the gh-pages URL when no token
      // is present. This helps when earlier pipeline steps produced
      // raw.githubusercontent links or README contains absolute raw URLs.
      if (/^https?:\/\//i.test(href)) {
        // If it's a raw.githubusercontent URL for the same owner, convert it
        // to either GitHub blob URL (.md) or gh-pages URL (.html) when no token.
          if (!(process.env.GITHUB_TOKEN || process.env.GH_PROJECTS_TOKEN)) {
          const rawMatch = String(href).match(/^https?:\/\/raw\.githubusercontent\.com\/keglev\/([^/]+)\/(?:main|master)\/(.+)$/i);
          if (rawMatch) {
            const repo = rawMatch[1];
            const rest = rawMatch[2].replace(/^\/*/, '');
            // .md files → GitHub blob URL, .html → GitHub Pages
            if (/\.md$/i.test(rest)) {
              return `https://github.com/keglev/${repo}/blob/main/${rest}`;
            }
            return `https://keglev.github.io/${repo}/${rest}`;
          }
          // Also handle github.com blob URLs like https://github.com/keglev/repo/blob/main/docs/x.html
          const blobMatch = String(href).match(/^https?:\/\/github\.com\/keglev\/([^/]+)\/blob\/(?:main|master)\/(.+)$/i);
          if (blobMatch) {
            const repo = blobMatch[1];
            const rest = blobMatch[2].replace(/^\/*/, '');
            // Only convert if the resulting path looks like documentation we allow
            const safePattern = /^(?:docs\/architecture\/.+\.(?:html|md)|docs\/.+\.(?:html|md)|src\/(?:main\/)?docs\/.+\.(?:html|md))$/i;
            if (safePattern.test(rest)) {
              // .md stays as blob, .html → gh-pages
              if (/\.md$/i.test(rest)) {
                return href; // already a blob URL, keep it
              }
              return `https://keglev.github.io/${repo}/${rest}`;
            }
          }
        }
        return href;
      }

      // Normalize relative path: remove surrounding <>, leading ./ or / and strip ../ segments
      let p = String(href).trim().replace(/^<|>$/g, '').replace(/^\.\//, '').replace(/^\//, '');
      p = p.replace(/\.\.\//g, '');

      if (!repoName) return p;

      // If we have a GitHub token, prefer raw.githubusercontent (original behavior)
        if (process.env.GITHUB_TOKEN || process.env.GH_PROJECTS_TOKEN) {
        return `https://raw.githubusercontent.com/keglev/${repoName}/main/${p}`;
      }

      // No token: convert safe-looking documentation paths.
      // Strategy: .md files → GitHub blob URL (rendered by GitHub)
      //           .html files → GitHub Pages URL (static hosting)
      // Allow docs/architecture/* and docs/* files, and src/docs/... and src/main/docs/...
      const safeDocsPattern = /^(?:docs\/architecture\/.+\.(?:html|md)|docs\/.+\.(?:html|md)|src\/(?:main\/)?docs\/.+\.(?:html|md))$/i;
      if (safeDocsPattern.test(p)) {
        const cleaned = p.replace(/^\/*/, '');
        // If it's a .md file, use GitHub blob URL so GitHub renders it
        if (/\.md$/i.test(cleaned)) {
          return `https://github.com/keglev/${repoName}/blob/main/${cleaned}`;
        }
        // Otherwise (.html), use GitHub Pages URL
        return `https://keglev.github.io/${repoName}/${cleaned}`;
      }

      // Fallback: return the normalized relative path (do not construct arbitrary external URLs)
      return p;
    };
    // Find the first explicit markdown link that follows an "Architecture Overview"
    // heading where the link label contains the word "Index" (case-insensitive).
    // This is intentionally flexible: we strip common prefixes like bullets, dots,
    // and emojis, then check if the remaining text starts with "Index".
    try {
      const ast = parseReadme.parseMarkdown(readmeText);
      if (ast && Array.isArray(ast.children)) {
        for (let i = 0; i < ast.children.length; i++) {
          const n = ast.children[i];
          const headingText = (n && n.type === 'heading') ? (n.children||[]).map(c => c.value || '').join('') : '';
          if (n.type === 'heading' && /architecture overview/i.test(headingText)) {
            // scan subsequent nodes until next heading
            let j = i + 1;
            while (j < ast.children.length && ast.children[j].type !== 'heading') {
              const nn = ast.children[j];
              // paragraph links
              if (nn.type === 'paragraph' && Array.isArray(nn.children)) {
                for (const ch of nn.children) {
                  if (ch.type === 'link' && ch.url) {
                    const label = (ch.children || []).map(c => c.value || '').join('').trim();
                    // Strip common prefixes (bullets, dots, emojis) and check if it starts with "Index"
                    const cleaned = label.replace(/^[•\-.\s📁📚🏗️🎯🚀]*\s*/i, '').trim();
                    if (/^Index\b/i.test(cleaned)) {
                      out.architectureOverview = { title: label || 'Architecture Overview', link: toRawGithub(ch.url), description: stripAstJsonFragments((nn.children||[]).filter(c=>c.type==='text').map(c=>c.value).join(' ').trim()) };
                      break;
                    }
                  }
                }
              }
              // list item links
              if (!out.architectureOverview && nn.type === 'list' && Array.isArray(nn.children)) {
                for (const li of nn.children) {
                  const links = parseReadme.findLinksInListItem ? parseReadme.findLinksInListItem(li) : null;
                  if (Array.isArray(links) && links.length) {
                    for (const linkObj of links) {
                      const label = (linkObj.label || '').trim();
                      const cleaned = label.replace(/^[•\-.\s📁📚🏗️🎯🚀]*\s*/i, '').trim();
                      if (/^Index\b/i.test(cleaned)) {
                        out.architectureOverview = { title: label || 'Architecture Overview', link: toRawGithub(linkObj.url), description: '' };
                        break;
                      }
                    }
                  } else {
                    // fallback: flatten and regex for explicit markdown link with Index label
                    const flat = parseReadme.flattenNodeText(li || '').replace(/\r?\n/g,' ');
                    // Match markdown links and extract label; strip prefixes from label
                    const allLinks = flat.matchAll(/\[([^\]]+)\]\(([^)]+)\)/ig);
                    for (const linkMatch of allLinks) {
                      const rawLabel = (linkMatch[1] || '').trim();
                      const cleaned = rawLabel.replace(/^[•\-.\s📁📚🏗️🎯🚀]*\s*/i, '').trim();
                      if (/^Index\b/i.test(cleaned)) {
                        out.architectureOverview = { title: rawLabel, link: toRawGithub((linkMatch[2]||'').trim()), description: '' };
                        break;
                      }
                    }
                  }
                }
              }
              if (out.architectureOverview) break;
              j++;
            }
            if (out.architectureOverview) break;
          }
        }
      }

      // If still not found, try a plain-text regex: first link after an "Architecture Overview" heading
      // whose label (after stripping prefixes) starts with "Index"
      if (!out.architectureOverview) {
        const archRe = /^\s*#{1,6}\s*.*architecture overview.*$/im;
        const archIdx = readmeText.search(archRe);
        if (archIdx !== -1) {
          const snippet = readmeText.slice(archIdx);
          const allLinks = snippet.matchAll(/\[([^\]]+)\]\(([^)]+)\)/ig);
          for (const linkMatch of allLinks) {
            const rawLabel = (linkMatch[1] || '').trim();
            const cleaned = rawLabel.replace(/^[•\-.\s📁📚🏗️🎯🚀]*\s*/i, '').trim();
            if (/^Index\b/i.test(cleaned)) {
              out.architectureOverview = { title: rawLabel, link: toRawGithub((linkMatch[2]||'').trim()), description: '' };
              break;
            }
          }
        }
      }
    } catch (e) {
      if (DEBUG_FETCH) console.log('extractRepoDocsDetailed arch AST error', e && e.message);
    }

    // Simplified API extraction: find the first explicit markdown link whose
    // label begins with "Complete API" (case-insensitive) after stripping common
    // prefixes like bullets, dashes, and emojis. This prioritizes explicit link
    // labels and ignores section headings that merely contain "API" text.
    try {
      const ast = parseReadme.parseMarkdown(readmeText);
      if (ast && Array.isArray(ast.children)) {
        let found = false;
        for (let i = 0; i < ast.children.length && !found; i++) {
          const n = ast.children[i];
          // search paragraph link nodes (skip headings entirely)
          if (n.type === 'paragraph' && Array.isArray(n.children)) {
            for (const ch of n.children) {
              if (ch.type === 'link' && ch.url) {
                const label = (ch.children||[]).map(c=>c.value||'').join('').trim();
                const cleaned = label.replace(/^[•\-*.\s📌📡🚀]*\s*/i, '').trim();
                if (/^Complete\s+API\b/i.test(cleaned)) {
                  out.apiDocumentation = { title: label || 'Complete API', link: ch.url, description: stripAstJsonFragments((n.children||[]).filter(c=>c.type==='text').map(c=>c.value).join(' ').trim()) };
                  found = true; break;
                }
              }
            }
          }
          // lists may contain markdown links too
          if (!found && n.type === 'list' && Array.isArray(n.children)) {
            for (const li of n.children) {
              const flatLinks = (parseReadme.extractTextFromListItem && typeof parseReadme.extractTextFromListItem === 'function') ? parseReadme.extractTextFromListItem(li) : parseReadme.flattenNodeText(li || '').replace(/\r?\n/g,' ');
              const allLinks = String(flatLinks).matchAll(/\[([^\]]+)\]\(([^)]+)\)/ig);
              for (const linkMatch of allLinks) {
                const label = (linkMatch[1]||'').trim();
                const url = (linkMatch[2]||'').trim();
                const cleaned = label.replace(/^[•\-*.\s📌📡🚀]*\s*/i, '').trim();
                if (/^Complete\s+API\b/i.test(cleaned)) { 
                  out.apiDocumentation = { title: label, link: url, description: '' }; 
                  found = true; break; 
                }
              }
              if (found) break;
            }
          }
        }
      }

      // Fallback to a plain-text scan for the first markdown link whose label (after
      // stripping prefixes) begins with "Complete API". Skip heading lines entirely.
      if (!out.apiDocumentation) {
        // Split by lines and skip lines that are markdown headings
        const lines = readmeText.split(/\r?\n/);
        for (const line of lines) {
          if (/^\s*#{1,6}\s/.test(line)) continue; // skip heading lines
          const allLinks = line.matchAll(/\[([^\]]+)\]\(([^)]+)\)/ig);
          for (const linkMatch of allLinks) {
            const rawLabel = (linkMatch[1]||'').trim();
            const cleaned = rawLabel.replace(/^[•\-*.\s📌📡🚀]*\s*/i, '').trim();
            if (/^Complete\s+API\b/i.test(cleaned)) {
              out.apiDocumentation = { title: rawLabel, link: (linkMatch[2]||'').trim(), description: '' };
              break;
            }
          }
          if (out.apiDocumentation) break;
        }
      }
    } catch (e) {
      if (DEBUG_FETCH) console.log('extractRepoDocsDetailed api AST error', e && e.message);
    }

    // Final fallback: scan the full README text for explicit markdown links
    // that look like API documentation. Only match links that have "api" in the label
    // OR point to src/(main/)docs or files ending with api.md/html. Do NOT create
    // links from README headings that just mention "API" without an actual link.
    try {
      if (!out.apiDocumentation) {
        const linkRe = /\[([^\]]*)\]\((https?:\/\/[^)\s]+|\.?\/?[^)\s]+)\)/ig;
        for (const m of readmeText.matchAll(linkRe)) {
          const label = (m[1] || '').trim();
          const url = (m[2] || '').trim();
          if (!url) continue;
          // Only extract if the label contains "api" OR the URL is an api-specific file
          const hasApiInLabel = /api/i.test(label);
          const hasApiInUrl = /api\.(?:md|html)$/i.test(url) || /src\/(?:main\/)?docs\/.+api/i.test(url);
          if (hasApiInLabel || hasApiInUrl) {
            out.apiDocumentation = { title: label || 'API Documentation', link: toRawGithub(url), description: '' };
            break;
          }
        }
        if (!out.apiDocumentation) {
          // Also scan for absolute raw.githubusercontent URLs that explicitly contain api in path
          const rawAny = readmeText.match(/https?:\/\/raw\.githubusercontent\.com\/keglev\/[^/]+\/(?:main|master)\/(.+api.+\.(?:md|html))/i);
          if (rawAny) {
            const rawUrl = rawAny[0];
            out.apiDocumentation = { title: 'API Documentation', link: toRawGithub(rawUrl), description: '' };
          }
        }
      }
    } catch (e) { if (DEBUG_FETCH) console.log('extractRepoDocsDetailed api fallback error', e && e.message); }

  // Simplified testing extraction: find ALL explicit markdown links whose
    // labels contain the words "Test Coverage" (case-insensitive). This will
    // populate out.testing.coverage as an array to support multiple coverage
    // reports (e.g., backend and frontend). The extraction stops after scanning
    // the entire README to collect all matching links.
    try {
      const ast = parseReadme.parseMarkdown(readmeText);
      const coverageLinks = [];
      if (ast && Array.isArray(ast.children)) {
        for (let i = 0; i < ast.children.length; i++) {
          const n = ast.children[i];
          if (n.type === 'paragraph' && Array.isArray(n.children)) {
            for (const ch of n.children) {
              if (ch.type === 'link' && ch.url) {
                const label = (ch.children||[]).map(c=>c.value||'').join('').trim();
                if (/Test\s+Coverage/i.test(label)) {
                  coverageLinks.push({ title: label || 'Test Coverage', link: ch.url, description: stripAstJsonFragments((n.children||[]).filter(c=>c.type==='text').map(c=>c.value).join(' ').trim()) });
                }
              }
            }
          }
          if (n.type === 'list' && Array.isArray(n.children)) {
            for (const li of n.children) {
              const m = String(parseReadme.flattenNodeText(li || '')).match(/\[([^\]]*Test\s+Coverage[^\]]*)\]\(([^)]+)\)/ig);
              if (m) {
                for (const match of m) {
                  const parts = match.match(/\[([^\]]*Test\s+Coverage[^\]]*)\]\(([^)]+)\)/i);
                  if (parts) {
                    coverageLinks.push({ title: (parts[1]||'Test Coverage').trim(), link: (parts[2]||'').trim(), description: '' });
                  }
                }
              }
            }
          }
        }
      }

      // Plain-text fallback: search for ALL explicit markdown link labels containing "Test Coverage"
      if (coverageLinks.length === 0) {
        const covMatches = readmeText.matchAll(/\[([^\]]*Test\s+Coverage[^\]]*)\]\(([^)]+)\)/ig);
        for (const covMatch of covMatches) {
          coverageLinks.push({ title: (covMatch[1]||'Test Coverage').trim(), link: (covMatch[2]||'').trim(), description: '' });
        }
      }

      // Store all coverage links found (or leave undefined if none)
      if (coverageLinks.length > 0) {
        out.testing = out.testing || {};
        out.testing.coverage = coverageLinks;
      }
    } catch (e) {
      if (DEBUG_FETCH) console.log('extractRepoDocsDetailed testing AST error', e && e.message);
    }

    // Production URL extraction: find first explicit markdown link whose label
    // begins with "Production URL" (case-insensitive) after stripping common
    // prefixes (bullets, emojis, dots). The production URL will be shown in the
    // UI as a short "URL" link.
    try {
      const ast = parseReadme.parseMarkdown(readmeText);
      if (ast && Array.isArray(ast.children)) {
        let found = false;
        for (let i = 0; i < ast.children.length && !found; i++) {
          const n = ast.children[i];
          if (n.type === 'paragraph' && Array.isArray(n.children)) {
            // Build paragraph text to allow cases where "Production URL" appears as
            // bold text or plain text immediately before the link (label may not
            // contain the phrase). If the paragraph contains the phrase,
            // take the first link in the paragraph as the production URL.
            const paraText = (n.children || []).map(c => (c.value || '')).join(' ').trim();
            let paraHasProduction = /Production\s+URL\b/i.test(paraText);
            for (const ch of n.children) {
              if (ch.type === 'link' && ch.url) {
                const label = (ch.children || []).map(c => c.value || '').join('').trim();
                const cleaned = label.replace(/^[•\-*.\s📁📚🏗️🎯🚀📌]*\s*/i, '').trim();
                if (/^Production\s+URL\b/i.test(cleaned) || paraHasProduction) {
                  out.productionUrl = { title: label || 'Production URL', link: ch.url, description: stripAstJsonFragments(paraText) };
                  found = true; break;
                }
              }
            }
            if (found) break;
          }
          if (!found && n.type === 'list' && Array.isArray(n.children)) {
            for (const li of n.children) {
              const flat = parseReadme.flattenNodeText(li || '').replace(/\r?\n/g, ' ');
              // If the flattened list item contains the phrase "Production URL",
              // pick the first markdown link in the item as the production URL.
              const itemHasProduction = /Production\s+URL\b/i.test(flat);
              const allLinks = flat.matchAll(/\[([^\]]+)\]\(([^)]+)\)/ig);
              for (const lm of allLinks) {
                const rawLabel = (lm[1]||'').trim();
                const cleaned = rawLabel.replace(/^[•\-*.\s📁📚🏗️🎯🚀📌]*\s*/i, '').trim();
                if (/^Production\s+URL\b/i.test(cleaned) || itemHasProduction) {
                  out.productionUrl = { title: rawLabel, link: (lm[2]||'').trim(), description: '' };
                  found = true; break;
                }
              }
              if (found) break;
            }
          }
        }
      }

      // Plain-text fallback: scan lines for a markdown link whose label begins with Production URL
      if (!out.productionUrl) {
        const lines = readmeText.split(/\r?\n/);
        for (const line of lines) {
          if (/^\s*#{1,6}\s/.test(line)) continue; // skip headings
          const allLinks = line.matchAll(/\[([^\]]+)\]\(([^)]+)\)/ig);
          for (const lm of allLinks) {
            const rawLabel = (lm[1]||'').trim();
            const cleaned = rawLabel.replace(/^[•\-*.\s📁📚🏗️🎯🚀📌]*\s*/i, '').trim();
            if (/^Production\s+URL\b/i.test(cleaned)) {
              out.productionUrl = { title: rawLabel, link: (lm[2]||'').trim(), description: '' };
              break;
            }
          }
          if (out.productionUrl) break;
        }
      }
    } catch (e) {
      if (DEBUG_FETCH) console.log('extractRepoDocsDetailed production URL AST error', e && e.message);
    }

    const normalizeIfRelative = (href) => {
      if (!href) return href;
      if (/^https?:\/\//i.test(href)) return href;
      return toRawGithub(href);
    };
    if (out.architectureOverview && out.architectureOverview.link) out.architectureOverview.link = normalizeIfRelative(out.architectureOverview.link);
    if (out.apiDocumentation && out.apiDocumentation.link) out.apiDocumentation.link = normalizeIfRelative(out.apiDocumentation.link);
    if (out.testing && out.testing.testingDocs && out.testing.testingDocs.link) out.testing.testingDocs.link = normalizeIfRelative(out.testing.testingDocs.link);
  if (out.productionUrl && out.productionUrl.link) out.productionUrl.link = normalizeIfRelative(out.productionUrl.link);

    if (out.architectureOverview && out.architectureOverview.description) {
      const t = translateWithCache ? await translateWithCache(repoName, out.architectureOverview.description) : { text: null };
      out.architectureOverview.description_de = t && t.text ? t.text : null;
    }
    if (out.apiDocumentation && out.apiDocumentation.description) {
      const t = translateWithCache ? await translateWithCache(repoName, out.apiDocumentation.description) : { text: null };
      out.apiDocumentation.description_de = t && t.text ? t.text : null;
    }
    if (out.testing) {
      if (out.testing.coverage && Array.isArray(out.testing.coverage)) {
        for (const cov of out.testing.coverage) {
          if (cov.description) {
            const t = translateWithCache ? await translateWithCache(repoName, cov.description) : { text: null };
            cov.description_de = t && t.text ? t.text : null;
          }
        }
      }
      if (out.testing.testingDocs && out.testing.testingDocs.description) {
        const t = translateWithCache ? await translateWithCache(repoName, out.testing.testingDocs.description) : { text: null };
        out.testing.testingDocs.description_de = t && t.text ? t.text : null;
      }
    }

    try {
      if (out.architectureOverview && shouldTranslateUI && typeof shouldTranslateUI === 'function' && shouldTranslateUI(out.architectureOverview.title)) {
        const tt = translateWithCache ? await translateWithCache(repoName, out.architectureOverview.title) : { text: null };
        out.architectureOverview.title_de = tt && tt.text ? tt.text : null;
      }
      if (out.apiDocumentation && shouldTranslateUI && typeof shouldTranslateUI === 'function' && shouldTranslateUI(out.apiDocumentation.title)) {
        const tt = translateWithCache ? await translateWithCache(repoName, out.apiDocumentation.title) : { text: null };
        out.apiDocumentation.title_de = tt && tt.text ? tt.text : null;
      }
      if (out.testing && out.testing.testingDocs && shouldTranslateUI && typeof shouldTranslateUI === 'function' && shouldTranslateUI(out.testing.testingDocs.title)) {
        const tt = translateWithCache ? await translateWithCache(repoName, out.testing.testingDocs.title) : { text: null };
        out.testing.testingDocs.title_de = tt && tt.text ? tt.text : null;
      }
    } catch (e) { if (DEBUG_FETCH) console.log('title translation failed', e && e.message); }
  } catch (e) { if (DEBUG_FETCH) console.log('extractRepoDocsDetailed error', e && e.message); }
  
  // Check if we found any actual documentation links
  const foundAny = (out.architectureOverview || out.apiDocumentation || out.testing || out.productionUrl) && ( (out.architectureOverview && out.architectureOverview.link) || (out.apiDocumentation && out.apiDocumentation.link) || (out.testing && out.testing.coverage && out.testing.coverage.length > 0) || (out.productionUrl && out.productionUrl.link) );
  
  // If no documentation was found, return a placeholder indicating docs are under construction
  if (!foundAny) {
    return {
      architectureOverview: null,
      apiDocumentation: null,
      testing: null,
      placeholder: {
        title: 'Under Construction',
        title_de: 'Noch in Entwicklung',
        description: 'Documentation will be developed soon',
        description_de: 'Dokumentation wird bald entwickelt'
      }
    };
  }
  
  return out;
}

// minimal local helper guard (import parseReadme's shouldTranslateUI when available)
function shouldTranslateUI(s) {
  try { return s && typeof s === 'string' && s.trim().length > 0 && s.trim().length <= 300; } catch (e) { return false; }
}

module.exports = { extractRepoDocsDetailed, shouldTranslateUI };
