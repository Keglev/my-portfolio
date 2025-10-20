#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const MEDIA_ROOT = path.join(__dirname, '..', 'public', 'projects_media');
const PROJECTS_JSON = path.join(__dirname, '..', 'public', 'projects.json');

function safeWrite(filePath, buf) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, buf);
}

async function downloadTo(url, dest) {
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer', maxRedirects: 5, timeout: 20000 });
    if (res && res.data) {
      safeWrite(dest, Buffer.from(res.data));
      return true;
    }
  } catch (e) {
    // ignore per-item errors
  }
  return false;
}

async function run() {
  if (!fs.existsSync(PROJECTS_JSON)) {
    console.error('public/projects.json not found — run the pipeline or ensure file exists');
    process.exit(1);
  }
  const projects = JSON.parse(fs.readFileSync(PROJECTS_JSON, 'utf8'));
  console.log('Found', projects.length, 'projects');

  for (const p of projects) {
    const name = p.name;
    const repoDir = path.join(MEDIA_ROOT, name);
    const metaPath = path.join(repoDir, 'meta.json');
    let chosenUrl = null;
    let filename = null;
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        if (meta && meta.imageSelection && meta.imageSelection.chosenUrl && meta.imageSelection.filename) {
          chosenUrl = meta.imageSelection.chosenUrl;
          filename = meta.imageSelection.filename;
        }
      } catch (e) {}
    }

    // If primaryImage exists and file present, skip
    if (p.primaryImage) {
      const localPath = path.join(__dirname, '..', 'public', p.primaryImage.replace(/\//g, path.sep));
      if (fs.existsSync(localPath)) {
        console.log(name, '-> already present', path.basename(localPath));
        continue;
      }
    }

    // Decide filename
    if (!filename) {
      // derive filename from attempted url or default
      filename = `project-image.png`;
    }

    const dest = path.join(repoDir, filename);

    let ok = false;
    if (chosenUrl) {
      console.log(name, '-> downloading chosenUrl', chosenUrl);
      ok = await downloadTo(chosenUrl, dest);
      if (ok) { console.log('  downloaded to', dest); }
    }

    if (!ok) {
      // try raw.githubusercontent fallbacks (main/master)
      const branches = ['main', 'master'];
      for (const br of branches) {
        const raw = `https://raw.githubusercontent.com/keglev/${name}/${br}/src/assets/imgs/project-image.png`;
        console.log(name, '-> trying', raw);
        ok = await downloadTo(raw, dest);
        if (ok) { console.log('  downloaded to', dest); break; }
      }
    }

    if (!ok) {
      console.log(name, '-> no image could be downloaded; will keep placeholder');
    }
  }
}

run().catch(e=>{ console.error('Error', e && e.message); process.exit(2); });
