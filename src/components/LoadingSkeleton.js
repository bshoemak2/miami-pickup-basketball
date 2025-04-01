import React from 'react';

const LoadingSkeleton = ({ t }) => (
  <div className="loading-skeleton">
    <div className="skeleton-header"></div>
    <div className="game-filter">
      <div className="filter-group">
        <label htmlFor="date-filter" className="filter-label">
          <span className="filter-icon">📅</span> {t('games_after_date')}
        </label>
        <div className="skeleton-input"></div>
      </div>
      <div className="filter-group">
        <label htmlFor="skill-filter" className="filter-label">
          <span className="filter-icon">🏀</span> {t('skill_level')}
        </label>
        <div className="skeleton-input"></div>
      </div>
      <div className="filter-group">
        <label htmlFor="sort-by" className="filter-label">
          <span className="filter-icon">↕️</span> {t('sort_by')}
        </label>
        <div className="skeleton-input"></div>
      </div>
      <div className="skeleton-button"></div>
    </div>
    {[...Array(3)].map((_, index) => (
      <div key={index} className="skeleton-game-row">
        <div className="skeleton-game-header"></div>
        <div className="skeleton-buttons"></div>
        <div className="skeleton-players"></div>
      </div>
    ))}
  </div>
);

export default LoadingSkeleton;