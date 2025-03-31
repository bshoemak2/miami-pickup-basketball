import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
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
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching game:', err);
        setLoading(false);
      }
    };
    fetchGame();

    const unsubscribe = auth.onAuthStateChanged(currentUser => {
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

  if (loading) return <div>{t('loading_games')}</div>;
  if (!game) return <div>{t('game_not_found')}</div>;

  return (
    <div className="game-details">
      <h2>{t('game_details')}</h2>
      <p><strong>{t('date_label', { date: game.date })}</strong></p>
      <p><strong>{t('time_label', { time: game.time })}</strong></p>
      <p><strong>{t('skill_label', { skill: game.skill })}</strong></p>
      <p><strong>{t('creator_label', { creator: game.creator })}</strong></p>
      {game.players && game.players.length > 0 && (
        <p><strong>{t('players_label', { players: game.players.join(', ') })}</strong></p>
      )}
      <p><strong>{t('notes_label', { notes: game.notes || t('no_notes') })}</strong></p>
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
      <Link to="/" className="back-link">{t('back_to_games')}</Link>
    </div>
  );
}

export default GameDetails;