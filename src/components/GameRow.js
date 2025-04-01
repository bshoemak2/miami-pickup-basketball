import React, { memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import { createCalendarLink, createICalLink, handleShareX, handleShareTikTok, handleShareInstagram, getGameStatus } from '../utils/gameUtils';

const GameRow = memo(({ game, user, users, joiningGameId, joinedGameId, handleJoin, handleDelete, handleEdit, t }) => {
  const isJoining = joiningGameId === game.id;
  const hasJoined = joinedGameId === game.id;
  const gameStatus = getGameStatus(game);

  const throttle = (func, delay) => {
    let timeout;
    return (...args) => {
      if (!timeout) {
        timeout = setTimeout(() => {
          func(...args);
          timeout = null;
        }, delay);
      }
    };
  };

  const throttledJoin = useCallback(throttle(handleJoin, 1000), [handleJoin]);
  const throttledShareX = useCallback(throttle(() => handleShareX(game), 1000), [game]);
  const throttledShareTikTok = useCallback(throttle(() => handleShareTikTok(game, t), 1000), [game, t]);
  const throttledShareInstagram = useCallback(throttle(() => handleShareInstagram(game, t), 1000), [game, t]);

  return (
    <li className="game-row">
      <div className="game-header">
        <Link to={`/game/${game.id}`} className="game-link">
          {game.title} - {game.date} {t('at')} {game.time} ({game.skill})
        </Link>
        <span className={`game-status ${gameStatus}`}>
          {gameStatus === 'upcoming' && t('upcoming')}
          {gameStatus === 'in-progress' && t('in_progress')}
          {gameStatus === 'completed' && t('completed')}
        </span>
      </div>
      {user && game.players && game.players.includes(users[user.email]?.playerName || 'Not set') ? (
        <div className={`joined-info ${hasJoined ? 'fade-in' : ''}`}>
          <span className="joined-label" aria-label={t('joined_status')}>{t('joined')}</span>
          <span className="court-name" aria-label={t('player_name')}>
            {users[user.email]?.playerName || 'Not set'} {t('joined_the_game')}
          </span>
        </div>
      ) : (
        <button
          onClick={() => throttledJoin(game)}
          className="join-button"
          disabled={isJoining || gameStatus !== 'upcoming'}
          aria-label={t('join_game', { title: game.title })}
        >
          {isJoining ? <ClipLoader color="#fff" size={20} aria-label={t('joining')} /> : t('join')}
        </button>
      )}
      <a
        href={createCalendarLink(game)}
        target="_blank"
        rel="noopener noreferrer"
        className="calendar-link"
        aria-label={t('add_to_calendar_for', { title: game.title })}
      >
        {t('add_to_calendar')}
      </a>
      <a
        href={createICalLink(game)}
        download={`${game.title || 'Untitled Game'}.ics`}
        className="ical-link"
        aria-label={t('download_ical_for', { title: game.title })}
      >
        {t('download_ical')}
      </a>
      <a
        href={`sms:?body=${t('reminder_sms', { title: game.title, date: game.date, time: game.time })}`}
        className="text-link"
        aria-label={t('send_reminder_for', { title: game.title })}
      >
        {t('text_to_join')}
      </a>
      <div className="share-buttons">
        <button
          onClick={throttledShareX}
          className="share-button"
          aria-label={t('share_on_x_for', { title: game.title })}
        >
          {t('X')}
        </button>
        <button
          onClick={throttledShareTikTok}
          className="share-button"
          aria-label={t('share_on_tiktok_for', { title: game.title })}
        >
          {t('TikTok')}
        </button>
        <button
          onClick={throttledShareInstagram}
          className="share-button"
          aria-label={t('share_on_instagram_for', { title: game.title })}
        >
          {t('Instagram')}
        </button>
      </div>
      {user && game.creator === user.email && (
        <>
          <button
            onClick={() => handleDelete(game)}
            className="delete-button"
            aria-label={t('delete_game', { title: game.title })}
          >
            {t('delete')}
          </button>
          <button
            onClick={handleEdit}
            className="edit-button"
            aria-label={t('edit_game', { title: game.title })}
          >
            {t('edit_game')}
          </button>
        </>
      )}
      {game.players && game.players.length > 0 && (
        <span className="players-list">
          {t('players')}: {' '}
          {game.players.map((player, index) => (
            <span key={index} className="player-item">
              {player}{index < game.players.length - 1 ? ', ' : ''}
            </span>
          ))}
        </span>
      )}
    </li>
  );
});

export default GameRow;