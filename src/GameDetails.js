import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth, onAuthStateChanged } from './firebase';
import { useTranslation } from 'react-i18next';
import './GameDetails.css';

function GameDetails() {
  const { t } = useTranslation();
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const gameDoc = await getDoc(doc(db, 'games', gameId));
        if (gameDoc.exists()) {
          const gameData = { id: gameDoc.id, ...gameDoc.data() };
          setGame(gameData);
          setNotes(gameData.notes || '');
        } else {
          setGame(null);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching game:', err);
        setLoading(false);
      }
    };
    fetchGame();

    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [gameId]);

  const handleUpdateNotes = async (e) => {
    e.preventDefault();
    if (!user || game.creator !== user.email) {
      alert(t('only_creator_can_update_notes'));
      return;
    }
    try {
      await updateDoc(doc(db, 'games', gameId), { notes });
      setGame({ ...game, notes });
      alert(t('notes_updated_success'));
    } catch (err) {
      alert('Failed to update notes: ' + err.message);
    }
  };

  const createCalendarLink = () => {
    if (!game || !game.date || !game.time || typeof game.date !== 'string' || typeof game.time !== 'string') {
      console.log('Invalid date or time in GameDetails:', game);
      return '#';
    }
    try {
      const startDateTime = new Date(`${game.date}T${game.time}:00`);
      if (isNaN(startDateTime.getTime())) {
        console.log('Invalid Date object in GameDetails:', startDateTime);
        return '#';
      }
      const startTime = startDateTime.toISOString().replace(/-|:|\.\d\d\d/g, '');
      const endTime = new Date(startDateTime.getTime() + 3600000).toISOString().replace(/-|:|\.\d\d\d/g, '');
      return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(game.title)}&dates=${startTime}/${endTime}&details=${encodeURIComponent('Pickup Basketball Game')}&location=${encodeURIComponent('Miami Beach')}`;
    } catch (error) {
      console.error('Error creating calendar link in GameDetails:', error);
      return '#';
    }
  };

  if (loading) return <div>{t('loading_games')}</div>;
  if (!game) return <div>{t('game_not_found')}</div>;

  return (
    <div className="game-details">
      <h2>{t('game_details')}</h2>
      <p><strong>{t('date_label')}</strong> {game.date}</p>
      <p><strong>{t('time_label')}</strong> {game.time}</p>
      <p><strong>{t('skill_label')}</strong> {game.skill}</p>
      <p><strong>{t('creator_label')}</strong> {game.creator}</p>
      {game.players && game.players.length > 0 && (
        <p><strong>{t('players_label')}</strong> {game.players.join(', ')}</p>
      )}
      <p><strong>{t('notes_label')}</strong> {game.notes || t('no_notes')}</p>
      {user && game.creator === user.email && (
        <form onSubmit={handleUpdateNotes} className="notes-form">
          <textarea
            placeholder={t('notes_placeholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button type="submit">{t('update_notes')}</button>
        </form>
      )}
      <a href={createCalendarLink()} target="_blank" rel="noopener noreferrer" className="calendar-link">
        {t('add_to_calendar')}
      </a>
      <Link to="/" className="back-link">{t('back_to_games')}</Link>
    </div>
  );
}

export default GameDetails;