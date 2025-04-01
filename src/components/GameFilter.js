import React, { memo } from 'react';

const GameFilter = memo(({ gamesAfterDate, setGamesAfterDate, skillLevel, setSkillLevel, sortBy, setSortBy, clearFilters, t }) => (
  <div className="game-filter">
    <div className="filter-group">
      <label htmlFor="date-filter" className="filter-label">
        <span className="filter-icon">📅</span> {t('gamesAfterDate')} (mm/dd/yyyy)
      </label>
      <input
        type="date"
        id="date-filter"
        value={gamesAfterDate}
        onChange={(e) => setGamesAfterDate(e.target.value)}
        aria-label={t('gamesAfterDate')}
      />
    </div>
    <div className="filter-group">
      <label htmlFor="skill-filter" className="filter-label">
        <span className="filter-icon">🏀</span> {t('skillLevel')}
      </label>
      <select
        id="skill-filter"
        value={skillLevel}
        onChange={(e) => setSkillLevel(e.target.value)}
        aria-label={t('skillLevel')}
      >
        <option value="">{t('allSkills')}</option>
        <option value="Beginner">{t('beginner')}</option>
        <option value="Intermediate">{t('intermediate')}</option>
        <option value="Advanced">{t('advanced')}</option>
      </select>
    </div>
    <div className="filter-group">
      <label htmlFor="sort-by" className="filter-label">
        <span className="filter-icon">↕️</span> {t('sortBy')}
      </label>
      <select
        id="sort-by"
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        aria-label={t('sortBy')}
      >
        <option value="dateAscending">{t('dateAscending')}</option>
        <option value="dateDescending">{t('dateDescending')}</option>
        <option value="skillAscending">{t('skillAscending')}</option>
        <option value="skillDescending">{t('skillDescending')}</option>
      </select>
    </div>
    <button
      onClick={clearFilters}
      className="clear-filters-button"
      aria-label={t('clearFilters')}
    >
      {t('clearFilters')}
    </button>
  </div>
));

export default GameFilter;