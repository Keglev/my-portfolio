import { useState, useEffect } from 'react';

/**
 * Fetches and caches the project list from the static /projects.json endpoint.
 * Also manages per-card image load tracking used for card entrance animations.
 *
 * @returns {{ projects: object[], loadedImages: object, setLoadedImages: Function }}
 */
const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loadedImages, setLoadedImages] = useState({});

  useEffect(() => {
    if (projects.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/projects.json');
        if (!res.ok) return;
        const json = await res.json();
        // cancelled guards against setting state after the component has unmounted
        if (!cancelled && Array.isArray(json) && json.length > 0) setProjects(json);
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, [projects]);

  return { projects, loadedImages, setLoadedImages };
};

export default useProjects;
