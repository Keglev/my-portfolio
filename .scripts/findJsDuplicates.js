const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function walk(dir) {
  const res = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) res.push(...walk(full));
    else if (stat.isFile() && full.endsWith('.js')) res.push(full);
  }
  return res;
}

const root = process.cwd();
const EXCLUDE = ['node_modules', 'build', 'public', '.git', 'dist'];
function walkExclude(dir) {
  const res = [];
  for (const name of fs.readdirSync(dir)) {
    if (EXCLUDE.includes(name)) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) res.push(...walkExclude(full));
    else if (stat.isFile() && full.endsWith('.js')) res.push(full);
  }
  return res;
}
const files = walkExclude(root);
const byName = {};
for (const f of files) {
  const name = path.basename(f);
  const data = fs.readFileSync(f);
  const hash = crypto.createHash('md5').update(data).digest('hex');
  byName[name] = byName[name] || [];
  byName[name].push({ path: f, hash });
}

const groups = [];
for (const [name, arr] of Object.entries(byName)) {
  const byHash = {};
  for (const e of arr) {
    byHash[e.hash] = byHash[e.hash] || [];
    byHash[e.hash].push(e.path);
  }
  for (const [hash, paths] of Object.entries(byHash)) {
    if (paths.length > 1) {
      // pick keep as the deepest path (most path segments), tie-break lexicographically
      const keep = paths.slice().sort((a,b)=>{
        const da = a.split(path.sep).length;
        const db = b.split(path.sep).length;
        if (da !== db) return db - da; // deeper first
        return a.localeCompare(b);
      })[0];
      const duplicates = paths.filter(p=>p!==keep);
      groups.push({ name, hash, keep, duplicates });
    }
  }
}
console.log(JSON.stringify(groups, null, 2));
