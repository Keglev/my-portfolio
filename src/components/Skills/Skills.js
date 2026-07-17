import React from 'react';
import { useTranslation } from 'react-i18next';
import skillGroups from '../../data/skills.config';
import './Skills.css';

/**
 * Skills section: a compact 2-column grid of skill groups so a recruiter can
 * stack-match in seconds. Content comes from src/data/skills.config; group
 * headings are localized, technology labels are shown as-is.
 *
 * @returns {JSX.Element}
 */
const Skills = () => {
  const { t } = useTranslation();

  return (
    <section className="skills-container" id="SkillsSection" aria-label="Skills">
      <h2>{t('skills')}</h2>
      <div className="skills-grid">
        {skillGroups.map((group) => (
          <div className="skills-card" key={group.id}>
            <h3>{t(group.titleKey)}</h3>
            <p className="skills-desc">{t(group.descKey)}</p>
            <div className="skills-chips">
              {group.items.map((item) => (
                <span className="skills-chip" key={item}>{item}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Skills;
