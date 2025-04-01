import React from 'react';
import { useTranslation } from 'react-i18next';

const GameForm = ({ user, onSubmit, initialGame, onCancel }) => {
  const { t } = useTranslation();
  const [game, setGame] = React.useState(initialGame || { title: '', date: '', time: '', skill: '', notes: '', players: [] });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setGame({ ...game, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      alert(t('please_login_to_add'));
      return;
    }
    if (!game.title || !game.date || !game.time || !game.skill) {
      alert(t('fill_required_fields'));
      return;
    }
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(game.time)) {
      alert(t('invalid_time_format'));
      return;
    }
    onSubmit({ ...game, players: game.players || [], creator: user.email });
  };

  return (
    <form onSubmit={handleSubmit} className={initialGame ? 'edit-game-form' : ''}>
      <input
        type="text"
        name="title"
        placeholder={t('title_placeholder')}
        value={game.title}
        onChange={handleChange}
      />
      <input
        type="date"
        name="date"
        placeholder={t('date_placeholder')}
        value={game.date}
        onChange={handleChange}
      />
      <input
        type="text"
        name="time"
        placeholder={t('time_placeholder')}
        value={game.time}
        onChange={handleChange}
      />
      <input
        type="text"
        name="skill"
        placeholder={t('skill_placeholder')}
        value={game.skill}
        onChange={handleChange}
      />
      <textarea
        name="notes"
        placeholder={t('notes_placeholder')}
        value={game.notes}
        onChange={handleChange}
      />
      <div className="form-buttons">
        {initialGame ? (
          <>
            <button type="submit">{t('update_game')}</button>
            <button type="button" onClick={onCancel}>{t('cancel')}</button>
          </>
        ) : (
          <button type="submit">{t('add_game')}</button>
        )}
      </div>
    </form>
  );
};

export default GameForm;