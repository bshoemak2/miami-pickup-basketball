import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import playersImage from './images/players_1.jpg';
import { ClipLoader } from 'react-spinners';
import ErrorBoundary from './ErrorBoundary';
import GameDetails from './GameDetails';
import { useTranslation } from 'react-i18next';
import './App.css';

function App() {
  const { t, i18n } = useTranslation();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newGame, setNewGame] = useState({ title: '', date: '', time: '', skill: '', notes: '', players: [] });
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'games'));
        const gameList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        gameList.sort((a, b) => new Date(a.date) - new Date(b.date));
        setGames(gameList);
        setLoading(false);
      } catch (err) {
        setError('Failed to load games: ' + err.message);
        setLoading(false);
      }
    };
    fetchGames();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleJoin = async (game) => {
    if (!user) {
      alert(t('please_login_to_join'));
      return;
    }
    try {
      const gameRef = doc(db, 'games', game.id);
      const updatedPlayers = game.players || [];
      if (!updatedPlayers.includes(user.email)) {
        updatedPlayers.push(user.email);
        await updateDoc(gameRef, { players: updatedPlayers });
        const querySnapshot = await getDocs(collection(db, 'games'));
        const gameList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        gameList.sort((a, b) => new Date(a.date) - new Date(b.date));
        setGames(gameList);
        console.log(`Joined ${game.title} as ${user.email}`);
      }
    } catch (err) {
      setError('Failed to join game: ' + err.message);
    }
  };

  const handleDeleteGame = async (game) => {
    if (!user || game.creator !== user.email) {
      alert(t('only_creator_can_delete'));
      return;
    }
    if (window.confirm(t('confirm_delete', { title: game.title }))) {
      try {
        await deleteDoc(doc(db, 'games', game.id));
        const querySnapshot = await getDocs(collection(db, 'games'));
        const gameList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        gameList.sort((a, b) => new Date(a.date) - new Date(b.date));
        setGames(gameList);
        console.log(`Deleted ${game.title}`);
      } catch (err) {
        setError('Failed to delete game: ' + err.message);
      }
    }
  };

  const handleCreateGame = async (e) => {
    e.preventDefault();
    if (!user) {
      alert(t('please_login_to_add'));
      return;
    }
    if (!newGame.title || !newGame.date || !newGame.time || !newGame.skill) {
      alert(t('fill_required_fields'));
      return;
    }
    try {
      await addDoc(collection(db, 'games'), { ...newGame, players: [], creator: user.email });
      setNewGame({ title: '', date: '', time: '', skill: '', notes: '', players: [] });
      const querySnapshot = await getDocs(collection(db, 'games'));
      const gameList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      gameList.sort((a, b) => new Date(a.date) - new Date(b.date));
      setGames(gameList);
    } catch (err) {
      setError('Failed to add game: ' + err.message);
    }
  };

  const handleShareX = (game) => {
    const shareText = t('share_text', { title: game.title, time: game.time, skill: game.skill });
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(xUrl, '_blank');
  };

  const handleShareTikTok = (game) => {
    const shareText = t('share_text', { title: game.title, time: game.time, skill: game.skill });
    navigator.clipboard.writeText(shareText);
    alert(t('text_copied_tiktok'));
    window.open('https://www.tiktok.com', '_blank');
  };

  const handleShareInstagram = (game) => {
    const shareText = t('share_text', { title: game.title, time: game.time, skill: game.skill });
    navigator.clipboard.writeText(shareText);
    alert(t('text_copied_instagram'));
    window.open('https://www.instagram.com', '_blank');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
    } catch (err) {
      if (err.code === 'auth/invalid-credential') {
        setError(t('invalid_credentials'));
      } else {
        setError('Login failed: ' + err.message);
      }
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError(t('email_already_registered'));
      } else if (err.code === 'auth/weak-password') {
        setError(t('weak_password'));
      } else {
        setError('Signup failed: ' + err.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      setError('Logout failed: ' + err.message);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'es' : 'en';
    i18n.changeLanguage(newLang);
  };

  if (loading) return (
    <div className="loading-spinner">
      <ClipLoader color="#007bff" loading={loading} size={50} />
      <p>{t('loading_games')}</p>
    </div>
  );
  if (error) return <div>{error}</div>;

  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route
            path="/"
            element={
              <div className="App">
                <div className="title-wrapper">
                  <h1>{t('app_title')}</h1>
                  <span className="flamingo">🦩</span>
                </div>
                <button onClick={toggleLanguage} className="language-toggle">
                  {t('language_toggle', { language: i18n.language === 'en' ? 'Spanish' : 'English' })}
                </button>
                {!user ? (
                  <div>
                    <form onSubmit={handleLogin}>
                      <input
                        type="email"
                        placeholder={t('email_placeholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <input
                        type="password"
                        placeholder={t('password_placeholder')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button type="submit">{t('login')}</button>
                      <button onClick={handleSignup}>{t('register')}</button>
                    </form>
                    <p>{t('guests_browse')}</p>
                  </div>
                ) : (
                  <div>
                    <p>{t('welcome', { email: user.email })} <button onClick={handleLogout}>{t('logout')}</button></p>
                  </div>
                )}
                <h2>{t('upcoming_games')}</h2>
                {games.length === 0 ? (
                  <p>{t('no_games', { message: user ? t('add_some') : t('check_later') })}</p>
                ) : (
                  <ul>
                    {games.map(game => (
                      <li key={game.id} className="game-row">
                        <Link to={`/game/${game.id}`} className="game-link">
                          {t('game_info', { title: game.title, date: game.date, time: game.time, skill: game.skill })}
                        </Link>
                        {user && game.players && game.players.includes(user.email) ? (
                          <span className="joined-label">{t('joined')}</span>
                        ) : (
                          <button onClick={() => handleJoin(game)}>{t('join')}</button>
                        )}
                        <button onClick={() => handleShareX(game)}>{t('X')}</button>
                        <button onClick={() => handleShareTikTok(game)}>{t('TikTok')}</button>
                        <button onClick={() => handleShareInstagram(game)}>{t('Instagram')}</button>
                        {user && game.creator === user.email && (
                          <button onClick={() => handleDeleteGame(game)} className="delete-button">
                            {t('delete')}
                          </button>
                        )}
                        {game.players && game.players.length > 0 && (
                          <span>{t('players', { players: game.players.join(', ') })}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {!user && <div className="ad-placeholder">{t('ad_space')}</div>}
                {user && (
                  <form onSubmit={handleCreateGame}>
                    <input
                      type="text"
                      placeholder={t('title_placeholder')}
                      value={newGame.title}
                      onChange={(e) => setNewGame({ ...newGame, title: e.target.value })}
                    />
                    <input
                      type="date"
                      placeholder={t('date_placeholder')}
                      value={newGame.date}
                      onChange={(e) => setNewGame({ ...newGame, date: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder={t('time_placeholder')}
                      value={newGame.time}
                      onChange={(e) => setNewGame({ ...newGame, time: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder={t('skill_placeholder')}
                      value={newGame.skill}
                      onChange={(e) => setNewGame({ ...newGame, skill: e.target.value })}
                    />
                    <textarea
                      placeholder={t('notes_placeholder')}
                      value={newGame.notes}
                      onChange={(e) => setNewGame({ ...newGame, notes: e.target.value })}
                    />
                    <button type="submit">{t('add_game')}</button>
                  </form>
                )}
                <img src={playersImage} alt="Flamingo playing basketball" className="footer-image" loading="lazy" />
                <p className="sponsored-by-large">
                  {t('sponsor_text')}
                  <a href="https://shopping-assistant-5m0q.onrender.com/" target="_blank" rel="noopener noreferrer">
                    {t('sponsor_link')}
                  </a>
                </p>
                <footer className="app-footer">
                  <p>{t('footer_copyright')}</p>
                  <p>{t('footer_contact')} <a href="mailto:bshoemak@mac.com">bshoemak@mac.com</a></p>
                </footer>
                {showBackToTop && (
                  <button className="back-to-top" onClick={scrollToTop}>
                    {t('back_to_top')}
                  </button>
                )}
              </div>
            }
          />
          <Route path="/game/:gameId" element={<GameDetails />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;