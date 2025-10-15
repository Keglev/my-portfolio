const fs = require('fs');
const path = require('path');
const fetcher = require('./fetchProjects');

async function run() {
  try {
    const projectsPath = path.join(__dirname, '..', 'public', 'projects.json');
    if (!fs.existsSync(projectsPath)) return console.error('projects.json not found - run fetch first');
    const nodes = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
    const target = nodes.find(n => n.name === 'inventory-service');
    if (!target) return console.error('inventory-service not present in projects.json');
    console.log('Found inventory-service, running extractRepoDocsDetailed on its README...');
    const extractor = fetcher.extractRepoDocsDetailed;
    if (!extractor) return console.error('extractRepoDocsDetailed not exported');
    const res = await extractor(target.object && target.object.text);
    console.log('extractRepoDocsDetailed result:\n', JSON.stringify(res, null, 2));
  } catch (e) {
    console.error('debug runner failed', e && e.message, e && e.stack);
    process.exit(2);
  }
}

if (require.main === module) run();
