import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, getDocs, collection } from 'firebase/firestore';
import { db, auth, onAuthStateChanged } from './firebase';
import { useTranslation } from 'react-i18next';
import { ClipLoader } from 'react-spinners'; // Added import for ClipLoader
import './GameDetails.css';

function GameDetails({ theme }) {
  const { t } = useTranslation();
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [user, setUser] = useState(null);
  const [updatingNotes, setUpdatingNotes] = useState(false);
  const [userPlayerName, setUserPlayerName] = useState('Not set');
  const [joining, setJoining] = useState(false);
  const [joinedGame, setJoinedGame] = useState(false);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const gameDoc = await getDoc(doc(db, 'games', gameId));
        if (gameDoc.exists()) {
          const gameData = { id: gameDoc.id, ...gameDoc.data() };
          const players = gameData.players || [];
          const userSnapshot = await getDocs(collection(db, 'users'));
          const usersData = userSnapshot.docs.reduce((acc, doc) => {
            acc[doc.data().email] = {
              displayName: doc.data().displayName || doc.data().email.split('@')[0],
              playerName: doc.data().playerName || 'Not set',
            };
            return acc;
          }, {});
          gameData.players = players.map(player =>
            player && typeof player === 'string' ? (usersData[player]?.displayName || player.split('@')[0]) : 'Unknown Player'
          );
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

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserPlayerName(userData.playerName || 'Not set');
        }
      }
    });
    return () => unsubscribe();
  }, [gameId]);

  const handleJoin = async () => {
    if (!user) {
      alert(t('please_login_to_join'));
      return;
    }
    setJoining(true);
    try {
      alert(`${userPlayerName} joined the game!`);
      const gameRef = doc(db, 'games', gameId);
      const updatedPlayers = game.players || [];
      const userIdentifier = user.displayName || user.email.split('@')[0];
      if (!updatedPlayers.includes(userIdentifier)) {
        updatedPlayers.push(userIdentifier);
        await updateDoc(gameRef, { players: updatedPlayers });
        setGame({ ...game, players: updatedPlayers });
        setJoinedGame(true);
      }
    } catch (err) {
      alert('Failed to join game: ' + err.message);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    try {
      const gameRef = doc(db, 'games', gameId);
      const userIdentifier = user.displayName || user.email.split('@')[0];
      const updatedPlayers = (game.players || []).filter(player => player !== userIdentifier);
      await updateDoc(gameRef, { players: updatedPlayers });
      setGame({ ...game, players: updatedPlayers });
      setJoinedGame(false);
    } catch (err) {
      alert('Failed to leave game: ' + err.message);
    }
  };

  const handleUpdateNotes = async (e) => {
    e.preventDefault();
    if (!user || game.creator !== user.email) {
      alert(t('only_creator_can_update_notes'));
      return;
    }
    setUpdatingNotes(true);
    try {
      await updateDoc(doc(db, 'games', gameId), { notes });
      setGame({ ...game, notes });
      alert(t('notes_updated_success'));
    } catch (err) {
      alert('Failed to update notes: ' + err.message);
    } finally {
      setUpdatingNotes(false);
    }
  };

  const createCalendarLink = () => {
    if (!game || !game.date || !game.time || typeof game.date !== 'string' || typeof game.time !== 'string') return '#';
    try {
      const startDateTime = new Date(`${game.date}T${game.time}:00`);
      if (isNaN(startDateTime.getTime())) return '#';
      const startTime = startDateTime.toISOString().replace(/-|:|\.\d\d\d/g, '');
      const endTime = new Date(startDateTime.getTime() + 3600000).toISOString().replace(/-|:|\.\d\d\d/g, '');
      return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(game.title)}&dates=${startTime}/${endTime}&details=${encodeURIComponent('Pickup Basketball Game')}&location=${encodeURIComponent('Miami Beach')}`;
    } catch (error) {
      console.error('Error creating calendar link:', error);
      return '#';
    }
  };

  const createICalLink = () => {
    if (!game || !game.date || !game.time || typeof game.date !== 'string' || typeof game.time !== 'string') return '#';
    try {
      const startDateTime = new Date(`${game.date}T${game.time}:00`);
      if (isNaN(startDateTime.getTime())) return '#';
      const start = startDateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const end = new Date(startDateTime.getTime() + 3600000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `SUMMARY:${game.title || 'Untitled Game'}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        'DESCRIPTION:Pickup Basketball Game',
        'LOCATION:Miami Beach',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\n');
      return URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    } catch (error) {
      console.error('Error creating iCal link:', error);
      return '#';
    }
  };

  const handleShareX = () => {
    const shareText = `Check out ${game.title} at ${game.time} (${game.skill}) on Miami Pickup Basketball!`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  if (loading) return <div>{t('loading_games')}</div>;
  if (!game) return <div>{t('game_not_found')}</div>;

  return (
    <div className="game-details" data-theme={theme}>
      <h2>{t('game_details')}</h2>
      <p><strong>{t('date_label')}</strong> {game.date}</p>
      <p><strong>{t('time_label')}</strong> {game.time}</p>
      <p><strong>{t('skill_label')}</strong> {game.skill}</p>
      <p><strong>{t('creator_label')}</strong> {game.creator}</p>
      {game.players && game.players.length > 0 && (
        <p className="players-list">
          <strong>{t('players_label')}</strong>{' '}
          {game.players.map((player, index) => (
            <span key={index} className="player-item">
              {player}{index < game.players.length - 1 ? ', ' : ''}
            </span>
          ))}
        </p>
      )}
      <p><strong>{t('notes_label')}</strong> {game.notes || t('no_notes')}</p>
      {user && game.creator === user.email && (
        <form onSubmit={handleUpdateNotes} className="notes-form">
          <textarea
            placeholder={t('notes_placeholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            aria-label="Game notes"
          />
          <button
            type="submit"
            disabled={updatingNotes}
            aria-label={updatingNotes ? 'Updating notes' : 'Update notes'}
          >
            {updatingNotes ? t('updating') : t('update_notes')}
          </button>
        </form>
      )}
      {user && (
        game.players && game.players.includes(user.displayName || user.email.split('@')[0]) ? (
          <div className={`joined-info ${joinedGame ? 'fade-in' : ''}`}>
            <span className="joined-label" aria-label="Joined status">{t('joined')}</span>
            <span className="court-name" aria-label="Player name">{userPlayerName} joined the game</span>
            <button
              onClick={handleLeave}
              className="leave-button"
              aria-label={`Leave ${game.title}`}
            >
              {t('leave_game')}
            </button>
          </div>
        ) : (
          <button
            onClick={handleJoin}
            className="join-button"
            disabled={joining}
            aria-label={`Join ${game.title}`}
          >
            {joining ? <ClipLoader color="#fff" size={20} /> : t('join')}
          </button>
        )
      )}
      <a
        href={createCalendarLink()}
        target="_blank"
        rel="noopener noreferrer"
        className="calendar-link"
        aria-label={`Add ${game.title} to calendar`}
      >
        {t('add_to_calendar')}
      </a>
      <a
        href={createICalLink()}
        download={`${game.title || 'Untitled Game'}.ics`}
        className="ical-link"
        aria-label={`Download iCal for ${game.title}`}
      >
        {t('download_ical')}
      </a>
      <button
        onClick={handleShareX}
        className="share-button"
        aria-label={`Share ${game.title} on X`}
      >
        {t('X')}
      </button>
      <Link to="/" className="back-link" aria-label="Back to games list">{t('back_to_games')}</Link>
    </div>
  );
}

export default GameDetails;