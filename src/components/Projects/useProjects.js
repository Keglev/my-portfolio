import { useState, useEffect } from 'react';

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
        if (!cancelled && Array.isArray(json) && json.length > 0) setProjects(json);
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, [projects]);

  return { projects, loadedImages, setLoadedImages };
};

export default useProjects;
