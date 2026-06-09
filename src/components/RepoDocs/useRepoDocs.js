import { useState, useEffect } from 'react';

// Filters out generic GitHub CTA headings that bleed into title fields when READMEs are parsed
const isBadTitle = (s) => !s || /open an issue|question|contribut/i.test(String(s));

const safeTitle = (p) => {
  const valid = (s) => (isBadTitle(s) ? null : s);
  return (
    valid(p.repoDocs?.apiDocumentation?.title_de) ||
    valid(p.repoDocs?.architectureOverview?.title_de) ||
    valid(p.docsTitle_de) ||
    valid(p.repoDocs?.apiDocumentation?.title) ||
    valid(p.repoDocs?.architectureOverview?.title) ||
    valid(p.docs?.documentation?.title) ||
    valid(p.docsTitle) ||
    null
  );
};

const hasRepoDocs = (p) => !!(
  p.repoDocs?.placeholder ||
  (p.repoDocs?.apiDocumentation?.link) ||
  (p.repoDocs?.architectureOverview?.link) ||
  (p.repoDocs?.testing?.coverage?.length > 0) ||
  (p.docs?.apiDocumentation?.link) ||
  (p.docs?.documentation?.link) ||
  p.docsLink ||
  // _ast is the parsed README abstract syntax tree; scan its headings as a last resort
  (p._ast?.children && Array.isArray(p._ast.children) && p._ast.children.some(
    c => c?.type === 'heading' && c.children?.length &&
      /doc|api|architectur/i.test(String(c.children[0]?.value || ''))
  )) ||
  (p.text && /documentation|api documentation|architecture|api integration/i.test(p.text))
);

const enrichProject = (p) => ({
  name: p.name,
  docs: p.docs || null,
  repoDocs: p.repoDocs || null,
  docsLink: p.docsLink || null,
  docsTitle: safeTitle(p),
  hasDocs: hasRepoDocs(p),
});

/**
 * Fetches projects.json and returns only entries that have linked documentation.
 * Enriches each project with a normalized docs shape via enrichProject.
 *
 * @returns {object[]} Array of enriched project objects where hasDocs is true
 */
const useRepoDocs = () => {
  const [projectsWithDocs, setProjectsWithDocs] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/projects.json');
        if (!res.ok) return setProjectsWithDocs([]);
        const data = await res.json();
        if (!cancelled) {
          setProjectsWithDocs(data.map(enrichProject).filter(e => e.hasDocs));
        }
      } catch (e) {
        if (!cancelled) setProjectsWithDocs([]);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return projectsWithDocs;
};

export default useRepoDocs;
