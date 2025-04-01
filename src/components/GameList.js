import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import ErrorBoundaryWithTranslation from '../ErrorBoundary';
import { useTranslation } from 'react-i18next';
import GameForm from './GameForm';
import GameFilter from './GameFilter';
import GameRow from './GameRow';
import LoadingSkeleton from './LoadingSkeleton';
import { fetchGamesData, handleJoinGame, handleDeleteGame, handleUpdateGame } from '../utils/gameUtils';

const GameList = ({ user, db }) => {
  const { t } = useTranslation();
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingGame, setEditingGame] = useState(null);
  const [users, setUsers] = useState({});
  const [joiningGameId, setJoiningGameId] = useState(null);
  const [joinedGameId, setJoinedGameId] = useState(null);
  const [gamesAfterDate, setGamesAfterDate] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [sortBy, setSortBy] = useState('dateAscending');
  const [debouncedFilterDate, setDebouncedFilterDate] = useState('');

  const fetchData = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const cachedData = JSON.parse(localStorage.getItem('gameListCache'));
      if (cachedData && !forceRefresh) {
        setUsers(cachedData.usersData);
        setGames(cachedData.gameList);
        setFilteredGames(cachedData.gameList);
        setLoading(false);
      } else {
        const { usersData, gameList } = await fetchGamesData(db, t);
        setUsers(usersData);
        setGames(gameList);
        setFilteredGames(gameList);
        localStorage.setItem('gameListCache', JSON.stringify({ usersData, gameList }));
        setLoading(false);
      }
    } catch (err) {
      console.error('Fetch games error:', err);
      setError(t('failed_to_load_games', { message: err.message }));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [db, t]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilterDate(gamesAfterDate);
    }, 300);
    return () => clearTimeout(handler);
  }, [gamesAfterDate]);

  const computedFilteredGames = useMemo(() => {
    let filtered = [...games];
    if (debouncedFilterDate) {
      const filterDateObj = new Date(debouncedFilterDate);
      filtered = filtered.filter(game => new Date(game.date || '1970-01-01') >= filterDateObj);
    }
    if (skillLevel) {
      filtered = filtered.filter(game => game.skill.toLowerCase() === skillLevel.toLowerCase());
    }
    switch (sortBy) {
      case 'dateAscending':
        filtered.sort((a, b) => new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01'));
        break;
      case 'dateDescending':
        filtered.sort((a, b) => new Date(b.date || '1970-01-01') - new Date(a.date || '1970-01-01'));
        break;
      case 'skillAscending':
        filtered.sort((a, b) => a.skill.localeCompare(b.skill));
        break;
      case 'skillDescending':
        filtered.sort((a, b) => b.skill.localeCompare(a.skill));
        break;
      default:
        break;
    }
    return filtered;
  }, [games, debouncedFilterDate, skillLevel, sortBy]);

  useEffect(() => {
    setFilteredGames(computedFilteredGames);
  }, [computedFilteredGames]);

  const handleJoin = useCallback(async (game) => {
    await handleJoinGame(game, user, users, db, t, setJoiningGameId, setJoinedGameId, setGames);
    fetchData(true);
  }, [user, users, db, t]);

  const handleDelete = useCallback(async (game) => {
    await handleDeleteGame(game, user, users, db, t, setGames);
    fetchData(true);
  }, [user, users, db, t]);

  const handleUpdate = useCallback(async (updatedGame) => {
    await handleUpdateGame(updatedGame, users, db, t, setGames, setEditingGame);
    fetchData(true);
  }, [users, db, t]);

  const clearFilters = () => {
    setGamesAfterDate('');
    setSkillLevel('');
    setSortBy('dateAscending');
  };

  if (loading) return <LoadingSkeleton t={t} />;

  if (error) return (
    <div className="error-message">
      {error}
      <button onClick={() => fetchData(true)} style={{ marginLeft: '1rem' }}>
        {t('retry')}
      </button>
    </div>
  );

  return (
    <div>
      <h2 className="large-heading">{t('upcoming_games')}</h2>
      <div className="filters-section">
        <h3>{t('filters')}</h3>
        <GameFilter
          gamesAfterDate={gamesAfterDate}
          setGamesAfterDate={setGamesAfterDate}
          skillLevel={skillLevel}
          setSkillLevel={setSkillLevel}
          sortBy={sortBy}
          setSortBy={setSortBy}
          clearFilters={clearFilters}
          t={t}
        />
      </div>
      <ErrorBoundaryWithTranslation>
        {filteredGames.length === 0 ? (
          <p>{t('no_games', { message: user ? t('add_some') : t('check_later') })}</p>
        ) : (
          <>
            {editingGame ? (
              <GameForm
                user={user}
                onSubmit={handleUpdate}
                initialGame={editingGame}
                onCancel={() => setEditingGame(null)}
              />
            ) : (
              <ul>
                {filteredGames.map(game => (
                  <GameRow
                    key={game.id}
                    game={game}
                    user={user}
                    users={users}
                    joiningGameId={joiningGameId}
                    joinedGameId={joinedGameId}
                    handleJoin={handleJoin}
                    handleDelete={handleDelete}
                    handleEdit={() => setEditingGame({ ...game })}
                    t={t}
                  />
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
            fetchData(true);
          }}
        />
      )}
    </div>
  );
};

export default GameList;