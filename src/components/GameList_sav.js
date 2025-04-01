import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { ClipLoader } from 'react-spinners';
import ErrorBoundaryWithTranslation from '../ErrorBoundary';
import { useTranslation } from 'react-i18next';
import GameForm from './GameForm';

const GameList = ({ user, db }) => {
  const { t } = useTranslation();
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]); // Filtered games based on date and skill
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingGame, setEditingGame] = useState(null);
  const [users, setUsers] = useState({});
  const [joiningGameId, setJoiningGameId] = useState(null);
  const [joinedGameId, setJoinedGameId] = useState(null);
  const [filterDate, setFilterDate] = useState(''); // Date filter
  const [filterSkill, setFilterSkill] = useState(''); // Skill level filter

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const userSnapshot = await getDocs(collection(db, 'users'));
        console.log('Users fetched:', userSnapshot.docs.length, userSnapshot.docs.map(doc => doc.data().email));
        const usersData = userSnapshot.docs.reduce((acc, doc) => {
          const email = doc.data().email;
          if (email && typeof email === 'string') {
            acc[email] = {
              displayName: doc.data().displayName || email.split('@')[0],
              playerName: doc.data().playerName || 'Not set',
            };
          }
          return acc;
        }, {});
        setUsers(usersData);

        const gameSnapshot = await getDocs(collection(db, 'games'));
        console.log('Raw games:', gameSnapshot.docs.map(doc => doc.data()));
        const gameList = gameSnapshot.docs.map(doc => {
          const creator = doc.data().creator;
          const players = doc.data().players || [];
          return {
            id: doc.id,
            ...doc.data(),
            creatorName: creator && typeof creator === 'string' ? (usersData[creator]?.displayName || creator.split('@')[0]) : 'Unknown Creator',
            players: players.map(player => player && typeof player === 'string' ? (usersData[player]?.displayName || player.split('@')[0]) : 'Unknown Player'),
          };
        });
        gameList.sort((a, b) => new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01'));
        console.log('Fetched games:', gameList.length, gameList);
        setGames(gameList);
        setFilteredGames(gameList); // Initialize filtered games
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load games: ' + err.message);
        setLoading(false);
      }
    };
    fetchGames();
  }, [db]);

  // Filter games based on date and skill level
  useEffect(() => {
    let filtered = [...games];

    // Filter by date
    if (filterDate) {
      const filterDateObj = new Date(filterDate);
      filtered = filtered.filter(game => {
        const gameDate = new Date(game.date || '1970-01-01');
        return gameDate >= filterDateObj;
      });
    }

    // Filter by skill level
    if (filterSkill) {
      filtered = filtered.filter(game => game.skill.toLowerCase() === filterSkill.toLowerCase());
    }

    setFilteredGames(filtered);
  }, [games, filterDate, filterSkill]);

  const handleJoin = useCallback(async (game) => {
    if (!user) {
      alert(t('please_login_to_join'));
      return;
    }
    setJoiningGameId(game.id);
    try {
      const userPlayerName = users[user.email]?.playerName || 'Not set';
      alert(`${userPlayerName} joined the game!`);
      const gameRef = doc(db, 'games', game.id);
      const updatedPlayers = game.players || [];
      const userIdentifier = user.displayName || user.email.split('@')[0];
      if (!updatedPlayers.includes(userIdentifier)) {
        updatedPlayers.push(userIdentifier);
        await updateDoc(gameRef, { players: updatedPlayers });
        const gameSnapshot = await getDocs(collection(db, 'games'));
        const gameList = gameSnapshot.docs.map(doc => {
          const creator = doc.data().creator;
          const players = doc.data().players || [];
          return {
            id: doc.id,
            ...doc.data(),
            creatorName: creator && typeof creator === 'string' ? (users[creator]?.displayName || creator.split('@')[0]) : 'Unknown Creator',
            players: players.map(player => player && typeof player === 'string' ? (users[player]?.displayName || player.split('@')[0]) : 'Unknown Player'),
          };
        });
        gameList.sort((a, b) => new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01'));
        setGames(gameList);
        setJoinedGameId(game.id);
        console.log(`Joined ${game.title} as ${userIdentifier}`);
      }
    } catch (err) {
      setError('Failed to join game: ' + err.message);
    } finally {
      setJoiningGameId(null);
    }
  }, [user, users, db, t]);

  const handleDeleteGame = async (game) => {
    if (!user || game.creator !== user.email) {
      alert(t('only_creator_can_delete'));
      return;
    }
    if (window.confirm(t('confirm_delete', { title: game.title }))) {
      try {
        await deleteDoc(doc(db, 'games', game.id));
        const gameSnapshot = await getDocs(collection(db, 'games'));
        const gameList = gameSnapshot.docs.map(doc => {
          const creator = doc.data().creator;
          const players = doc.data().players || [];
          return {
            id: doc.id,
            ...doc.data(),
            creatorName: creator && typeof creator === 'string' ? (users[creator]?.displayName || creator.split('@')[0]) : 'Unknown Creator',
            players: players.map(player => player && typeof player === 'string' ? (users[player]?.displayName || player.split('@')[0]) : 'Unknown Player'),
          };
        });
        gameList.sort((a, b) => new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01'));
        setGames(gameList);
        console.log(`Deleted ${game.title}`);
      } catch (err) {
        setError('Failed to delete game: ' + err.message);
      }
    }
  };

  const handleEditGame = (game) => {
    setEditingGame({ ...game });
  };

  const handleUpdateGame = async (updatedGame) => {
    try {
      const gameRef = doc(db, 'games', updatedGame.id);
      await updateDoc(gameRef, {
        title: updatedGame.title,
        date: updatedGame.date,
        time: updatedGame.time,
        skill: updatedGame.skill,
        notes: updatedGame.notes,
      });
      const gameSnapshot = await getDocs(collection(db, 'games'));
      const gameList = gameSnapshot.docs.map(doc => {
        const creator = doc.data().creator;
        const players = doc.data().players || [];
        return {
          id: doc.id,
          ...doc.data(),
          creatorName: creator && typeof creator === 'string' ? (users[creator]?.displayName || creator.split('@')[0]) : 'Unknown Creator',
          players: players.map(player => player && typeof player === 'string' ? (users[player]?.displayName || player.split('@')[0]) : 'Unknown Player'),
        };
      });
      gameList.sort((a, b) => new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01'));
      setGames(gameList);
      setEditingGame(null);
      alert(t('game_updated'));
    } catch (err) {
      setError('Failed to update game: ' + err.message);
    }
  };

  const createCalendarLink = (game) => {
    if (!game || !game.date || !game.time || typeof game.date !== 'string' || typeof game.time !== 'string') {
      console.log('Invalid date or time in createCalendarLink:', game);
      return '#';
    }
    try {
      const startDateTime = new Date(`${game.date}T${game.time}:00`);
      if (isNaN(startDateTime.getTime())) {
        console.log('Invalid Date object in createCalendarLink:', startDateTime, 'Game:', game);
        return '#';
      }
      const startTime = startDateTime.toISOString().replace(/-|:|\.\d\d\d/g, '');
      const endTime = new Date(startDateTime.getTime() + 3600000).toISOString().replace(/-|:|\.\d\d\d/g, '');
      return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(game.title)}&dates=${startTime}/${endTime}&details=${encodeURIComponent('Pickup Basketball Game')}&location=${encodeURIComponent('Miami Beach')}`;
    } catch (error) {
      console.error('Error creating calendar link in App:', error);
      return '#';
    }
  };

  const createICalLink = (game) => {
    if (!game || !game.date || !game.time || typeof game.date !== 'string' || typeof game.time !== 'string') {
      console.log('Invalid date or time in createICalLink:', game);
      return '#';
    }
    try {
      const startDateTime = new Date(`${game.date}T${game.time}:00`);
      if (isNaN(startDateTime.getTime())) {
        console.log('Invalid Date object in createICalLink:', startDateTime, 'Game:', game);
        return '#';
      }
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
      const blob = new Blob([ics], { type: 'text/calendar' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error creating iCal link in App:', error);
      return '#';
    }
  };

  const handleShareX = (game) => {
    const shareText = `Check out ${game.title} at ${game.time} (${game.skill}) on Miami Pickup Basketball!`;
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(xUrl, '_blank');
  };

  const handleShareTikTok = (game) => {
    const shareText = `Check out ${game.title} at ${game.time} (${game.skill}) on Miami Pickup Basketball!`;
    navigator.clipboard.writeText(shareText);
    alert(t('text_copied_tiktok'));
    window.open('https://www.tiktok.com', '_blank');
  };

  const handleShareInstagram = (game) => {
    const shareText = `Check out ${game.title} at ${game.time} (${game.skill}) on Miami Pickup Basketball!`;
    navigator.clipboard.writeText(shareText);
    alert(t('text_copied_instagram'));
    window.open('https://www.instagram.com', '_blank');
  };

  if (loading) return (
    <div className="loading-spinner">
      <ClipLoader color="#007bff" loading={loading} size={50} />
      <p>{t('loading_games')}</p>
    </div>
  );
  if (error && user) return <div>{error}</div>;

  return (
    <div>
      <h2 className="large-heading">{t('upcoming_games')}</h2>
      <div className="game-filter">
        <label htmlFor="date-filter">{t('games_after_date')}</label>
        <input
          type="date"
          id="date-filter"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          aria-label={t('games_after_date')}
        />
        <label htmlFor="skill-filter">{t('skill_level')}</label>
        <select
          id="skill-filter"
          value={filterSkill}
          onChange={(e) => setFilterSkill(e.target.value)}
          aria-label={t('skill_level')}
        >
          <option value="">{t('all_skills')}</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>
      <ErrorBoundaryWithTranslation>
        {filteredGames.length === 0 ? (
          <p>{t('no_games', { message: user ? t('add_some') : t('check_later') })}</p>
        ) : (
          <>
            {editingGame ? (
              <GameForm
                user={user}
                onSubmit={handleUpdateGame}
                initialGame={editingGame}
                onCancel={() => setEditingGame(null)}
              />
            ) : (
              <ul>
                {filteredGames.map(game => (
                  <li key={game.id} className="game-row">
                    <Link to={`/game/${game.id}`} className="game-link">
                      {game.title} - {game.date} at {game.time} ({game.skill})
                    </Link>
                    {user && game.players && game.players.includes(user.displayName || user.email.split('@')[0]) ? (
                      <div className={`joined-info ${joinedGameId === game.id ? 'fade-in' : ''}`}>
                        <span className="joined-label" aria-label="Joined status">{t('joined')}</span>
                        <span className="court-name" aria-label="Player name">{users[user.email]?.playerName || 'Not set'} joined the game</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleJoin(game)}
                        className="join-button"
                        disabled={joiningGameId === game.id}
                        aria-label={`Join ${game.title}`}
                      >
                        {joiningGameId === game.id ? (
                          <ClipLoader color="#fff" size={20} />
                        ) : (
                          t('join')
                        )}
                      </button>
                    )}
                    <a
                      href={createCalendarLink(game)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="calendar-link"
                      aria-label={`Add ${game.title} to calendar`}
                    >
                      {t('add_to_calendar')}
                    </a>
                    <a
                      href={createICalLink(game)}
                      download={`${game.title || 'Untitled Game'}.ics`}
                      className="ical-link"
                      aria-label={`Download iCal for ${game.title}`}
                    >
                      {t('download_ical')}
                    </a>
                    <a
                      href={`sms:?body=Reminder: ${game.title} on ${game.date} at ${game.time}`}
                      className="text-link"
                      aria-label={`Send text reminder for ${game.title}`}
                    >
                      {t('text_to_join')}
                    </a>
                    <div className="share-buttons">
                      <button
                        onClick={() => handleShareX(game)}
                        className="share-button"
                        aria-label={`Share ${game.title} on X`}
                      >
                        {t('X')}
                      </button>
                      <button
                        onClick={() => handleShareTikTok(game)}
                        className="share-button"
                        aria-label={`Share ${game.title} on TikTok`}
                      >
                        {t('TikTok')}
                      </button>
                      <button
                        onClick={() => handleShareInstagram(game)}
                        className="share-button"
                        aria-label={`Share ${game.title} on Instagram`}
                      >
                        {t('Instagram')}
                      </button>
                    </div>
                    {user && game.creator === user.email && (
                      <>
                        <button
                          onClick={() => handleDeleteGame(game)}
                          className="delete-button"
                          aria-label={`Delete ${game.title}`}
                        >
                          {t('delete')}
                        </button>
                        <button
                          onClick={() => handleEditGame(game)}
                          className="edit-button"
                          aria-label={`Edit ${game.title}`}
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
                ))}
              </ul>
            )}
          </>
        )}
      </ErrorBoundaryWithTranslation>
      {user && !editingGame && (
        <GameForm
          user={user}
          onSubmit={async (newGameData) => {
            await addDoc(collection(db, 'games'), newGameData);
            const gameSnapshot = await getDocs(collection(db, 'games'));
            const gameList = gameSnapshot.docs.map(doc => {
              const creator = doc.data().creator;
              const players = doc.data().players || [];
              return {
                id: doc.id,
                ...doc.data(),
                creatorName: creator && typeof creator === 'string' ? (users[creator]?.displayName || creator.split('@')[0]) : 'Unknown Creator',
                players: players.map(player => player && typeof player === 'string' ? (users[player]?.displayName || player.split('@')[0]) : 'Unknown Player'),
              };
            });
            gameList.sort((a, b) => new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01'));
            setGames(gameList);
          }}
        />
      )}
    </div>
  );
};

export default GameList;