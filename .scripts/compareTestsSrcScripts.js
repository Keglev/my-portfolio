const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function listJs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(n => n.endsWith('.js')).map(n => ({ name: n, path: path.join(dir, n) }));
}

function md5(p) { return crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex'); }

const root = process.cwd();
const scriptsTestsDir = path.join(root, 'scripts', '__tests__');
const srcTestsDir = path.join(root, 'src', '__tests__');

const scriptsFiles = listJs(scriptsTestsDir);
const srcFiles = listJs(srcTestsDir);

const byName = {};
for (const f of scriptsFiles) {
  byName[f.name] = byName[f.name] || {};
  byName[f.name].scripts = { path: f.path, hash: md5(f.path) };
}
for (const f of srcFiles) {
  byName[f.name] = byName[f.name] || {};
  byName[f.name].src = { path: f.path, hash: md5(f.path) };
}

const report = { onlyInScripts: [], onlyInSrc: [], identical: [], different: [] };
for (const [name, obj] of Object.entries(byName)) {
  if (obj.scripts && !obj.src) report.onlyInScripts.push(obj.scripts);
  else if (!obj.scripts && obj.src) report.onlyInSrc.push(obj.src);
  else if (obj.scripts && obj.src) {
    if (obj.scripts.hash === obj.src.hash) report.identical.push({ name, scripts: obj.scripts.path, src: obj.src.path });
    else report.different.push({ name, scripts: obj.scripts.path, src: obj.src.path, scriptsHash: obj.scripts.hash, srcHash: obj.src.hash });
  }
}

console.log(JSON.stringify(report, null, 2));
