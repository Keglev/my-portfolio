/**
 * @file Skills.js
 * @module components/Skills/Skills
 * @summary Skills section: a single-column stack of full-width skill groups.
 * @enterprise Single-column (not a grid) is deliberate so a recruiter can
 * stack-match in seconds without horizontal scanning. Content comes from
 * data/skills.config; group headings and descriptions are localized via
 * i18n keys, technology labels are shown as-is (not translated).
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import skillGroups from '../../data/skills.config';
import './Skills.css';

/**
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
