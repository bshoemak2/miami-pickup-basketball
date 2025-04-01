import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth, storage, ref, uploadBytes, getDownloadURL, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from './firebase';
import playersImage from './images/players_1.jpg';
import { ClipLoader } from 'react-spinners';
import ErrorBoundaryWithTranslation from './ErrorBoundary'; // Updated import
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
  const [filter, setFilter] = useState({ skill: '', date: '' });
  const [theme, setTheme] = useState('light');

  const affiliateProducts = [
    { name: 'Spalding Street Performance Outdoor Basketballs', link: 'https://amzn.to/3XGxAyO', image: 'https://m.media-amazon.com/images/I/7187crn3osS._AC_SX679_.jpg' },
    { name: 'Venoms Printings Glow in The Dark Basketball', link: 'https://amzn.to/4cd8de3', image: 'https://m.media-amazon.com/images/I/71fjmV-FKOL._AC_SX679_.jpg' },
    { name: 'WILSON FIBA 3X3', link: 'https://amzn.to/4hSXJBP', image: 'https://m.media-amazon.com/images/I/81ucIYgfXkL._AC_SX679_.jpg' },
    { name: 'Men\'s Basketball Shoes Shock-Absorbing', link: 'https://amzn.to/3Eaebzy', image: 'https://m.media-amazon.com/images/I/71EL4VnHG8L._AC_SY535_.jpg' },
    { name: 'Nike Ja 1 Men\'s Basketball Shoes', link: 'https://amzn.to/4jhPQqF', image: 'https://m.media-amazon.com/images/I/71Ebn15CsIL._AC_SX535_.jpg' },
    { name: 'Nike Sabrina 1 Unisex Basketball Shoe', link: 'https://amzn.to/3FNmXUK', image: 'https://m.media-amazon.com/images/I/61ZzaxKGxKL._AC_SX535_.jpg' },
    { name: 'Gatorade 32 Oz Squeeze Water Sports Bottle', link: 'https://amzn.to/3XGxTcW', image: 'https://m.media-amazon.com/images/I/61Oag2w5KjL._AC_SX425_.jpg' },
    { name: 'YETI Yonder Water Bottle', link: 'https://amzn.to/3FRNCzN', image: 'https://m.media-amazon.com/images/I/51-67XDmchL._AC_SX425_.jpg' },
    { name: 'YETI Rambler 26 oz Bottle', link: 'https://amzn.to/4cdoyiR', image: 'https://m.media-amazon.com/images/I/51hoerI1tlL._AC_SX679_.jpg' },
    { name: 'Star Wars Chewbacca Basketball T-Shirt', link: 'https://amzn.to/42d5aOe', image: 'https://m.media-amazon.com/images/I/A1dbsmzbGeL._CLa%7C2140%2C2000%7C81qLStXGPZL.png%7C0%2C0%2C2140%2C2000%2B0.0%2C0.0%2C2140.0%2C2000.0_AC_SX679_.png' },
    { name: 'YETI Camino 20 Carryall', link: 'https://amzn.to/4hW0nGP', image: 'https://m.media-amazon.com/images/I/61-f50QdV0L._AC_SX679_.jpg' },
  ];

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const userSnapshot = await getDocs(collection(db, 'users'));
        const users = userSnapshot.docs.reduce((acc, doc) => {
          const email = doc.data().email;
          if (email && typeof email === 'string') {
            acc[email] = doc.data().displayName || email.split('@')[0];
          }
          return acc;
        }, {});

        const gameSnapshot = await getDocs(collection(db, 'games'));
        const gameList = gameSnapshot.docs.map(doc => {
          const creator = doc.data().creator;
          const players = doc.data().players || [];
          return {
            id: doc.id,
            ...doc.data(),
            creatorName: creator && typeof creator === 'string' ? (users[creator] || creator.split('@')[0]) : 'Unknown Creator',
            players: players.map(player => player && typeof player === 'string' ? (users[player] || player.split('@')[0]) : 'Unknown Player'),
          };
        });
        gameList.sort((a, b) => new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01'));
        console.log('Fetched games:', gameList);
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
      console.log('Current user:', currentUser);
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
      const userIdentifier = user.displayName || user.email.split('@')[0];
      if (!updatedPlayers.includes(userIdentifier)) {
        updatedPlayers.push(userIdentifier);
        await updateDoc(gameRef, { players: updatedPlayers });
        const gameSnapshot = await getDocs(collection(db, 'games'));
        const gameList = gameSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        gameList.sort((a, b) => new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01'));
        setGames(gameList);
        console.log(`Joined ${game.title} as ${userIdentifier}`);
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
        const gameSnapshot = await getDocs(collection(db, 'games'));
        const gameList = gameSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        gameList.sort((a, b) => new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01'));
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
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(newGame.time)) {
      alert(t('invalid_time_format'));
      return;
    }
    try {
      await addDoc(collection(db, 'games'), { ...newGame, players: [], creator: user.email });
      setNewGame({ title: '', date: '', time: '', skill: '', notes: '', players: [] });
      const gameSnapshot = await getDocs(collection(db, 'games'));
      const gameList = gameSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      gameList.sort((a, b) => new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01'));
      setGames(gameList);
    } catch (err) {
      setError('Failed to add game: ' + err.message);
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
    if (!email && !password) {
      setError(t('email_password_required'));
      return;
    } else if (!email) {
      setError(t('email_required'));
      return;
    } else if (!password) {
      setError(t('password_required'));
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
      setError(null);
    } catch (err) {
      if (err.code === 'auth/invalid-email') {
        setError(t('invalid_email'));
      } else if (err.code === 'auth/wrong-password') {
        setError(t('wrong_password'));
      } else if (err.code === 'auth/user-not-found') {
        setError(t('user_not_found'));
      } else {
        setError(t('login_failed', { message: err.message }));
      }
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t('email_password_required'));
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
      setError(null);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError(t('email_already_registered'));
      } else if (err.code === 'auth/weak-password') {
        setError(t('weak_password'));
      } else if (err.code === 'auth/invalid-email') {
        setError(t('invalid_email'));
      } else {
        setError(t('signup_failed', { message: err.message }));
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

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const filteredGames = games.filter(game => 
    (!filter.skill || game.skill === filter.skill) &&
    (!filter.date || game.date === filter.date)
  );

  if (loading) return (
    <div className="loading-spinner">
      <ClipLoader color="#007bff" loading={loading} size={50} />
      <p>{t('loading_games')}</p>
    </div>
  );
  if (error && user) return <div>{error}</div>;

  return (
    <Router>
      <ErrorBoundaryWithTranslation> {/* Existing top-level error boundary */}
        <Routes>
          <Route
            path="/"
            element={
              <div className="App" data-theme={theme}>
                <div className="title-wrapper">
                  <h1>{t('app_title')}</h1>
                  <span className="flamingo bigger">🦩</span>
                  <span className="beta">Beta</span>
                </div>
                <div className="header-controls">
                  <button onClick={toggleLanguage} className="language-toggle">
                    Switch to {i18n.language === 'en' ? 'Spanish' : 'English'}
                  </button>
                  <button onClick={toggleTheme} className="theme-toggle">
                    {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                  </button>
                </div>
                {!user ? (
                  <div>
                    {error && <p className="error-message">{error}</p>}
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
                    {error && <p className="error-message">{error}</p>}
                    <p>Welcome, {user.displayName || user.email}! <button onClick={handleLogout}>{t('logout')}</button></p>
                    <Link to="/profile">{t('profile')}</Link>
                  </div>
                )}
                <h2 className="large-heading">{t('upcoming_games')}</h2>
                <div className="filter-controls">
                  <select onChange={(e) => setFilter({ ...filter, skill: e.target.value })} value={filter.skill}>
                    <option value="">{t('all_skills')}</option>
                    <option value="Beginner">{t('beginner')}</option>
                    <option value="Intermediate">{t('intermediate')}</option>
                    <option value="Advanced">{t('advanced')}</option>
                  </select>
                  <input
                    type="date"
                    value={filter.date}
                    onChange={(e) => setFilter({ ...filter, date: e.target.value })}
                  />
                </div>
                <ErrorBoundaryWithTranslation> {/* Wrap game list with error boundary */}
                  {filteredGames.length === 0 ? (
                    <p>{t('no_games', { message: user ? t('add_some') : t('check_later') })}</p>
                  ) : (
                    <ul>
                      {filteredGames.map(game => (
                        <li key={game.id} className="game-row">
                          <Link to={`/game/${game.id}`} className="game-link">
                            {game.title} - {game.date} at {game.time} ({game.skill})
                          </Link>
                          {user && game.players && game.players.includes(user.displayName || user.email.split('@')[0]) ? (
                            <span className="joined-label">{t('joined')}</span>
                          ) : (
                            <button onClick={() => handleJoin(game)}>{t('join')}</button>
                          )}
                          <a href={createCalendarLink(game)} target="_blank" rel="noopener noreferrer" className="calendar-link">{t('add_to_calendar')}</a>
                          <a href={createICalLink(game)} download={`${game.title || 'Untitled Game'}.ics`} className="ical-link">{t('download_ical')}</a>
                          <a href={`sms:?body=Reminder: ${game.title} on ${game.date} at ${game.time}`} className="text-link">{t('text_to_join')}</a>
                          <button onClick={() => handleShareX(game)}>{t('X')}</button>
                          <button onClick={() => handleShareTikTok(game)}>{t('TikTok')}</button>
                          <button onClick={() => handleShareInstagram(game)}>{t('Instagram')}</button>
                          {user && game.creator === user.email && (
                            <button onClick={() => handleDeleteGame(game)} className="delete-button">{t('delete')}</button>
                          )}
                          {game.players && game.players.length > 0 && (
                            <span>Players: {game.players.join(', ')}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </ErrorBoundaryWithTranslation>
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
                <div className="affiliate-links">
                  <h2 className="large-heading">{t('basketball_gear')}</h2>
                  <div className="product-grid">
                    {affiliateProducts.map((product, index) => (
                      <a
                        key={index}
                        href={product.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="product-item"
                      >
                        <img src={product.image} alt={product.name} />
                        <p>{product.name}</p>
                      </a>
                    ))}
                  </div>
                  <p className="affiliate-disclosure">{t('affiliate_disclosure')}</p>
                </div>
                <p className="sponsored-by-large">
                  {t('sponsor_text')}{' '}
                  <a href="https://shopping-assistant-5m0q.onrender.com/" target="_blank" rel="noopener noreferrer">
                    {t('sponsor_link')}
                  </a>
                </p>
                <footer className="app-footer">
                  <p>{t('footer_copyright')}</p>
                  <p>{t('footer_contact')} <a href="mailto:bshoemak@mac.com">bshoemak@mac.com</a></p>
                </footer>
                {showBackToTop && (
                  <button className="back-to-top" onClick={scrollToTop}>{t('back_to_top')}</button>
                )}
              </div>
            }
          />
          <Route path="/game/:gameId" element={<GameDetails theme={theme} />} />
          <Route path="/profile" element={<Profile user={user} theme={theme} />} />
        </Routes>
      </ErrorBoundaryWithTranslation>
    </Router>
  );
}

function Profile({ user, theme }) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setPhone(data.phone || '');
          setAvatarUrl(data.avatar || '');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      let avatarUrlToSave = avatarUrl;

      if (avatar) {
        const storageRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(storageRef, avatar);
        avatarUrlToSave = await getDownloadURL(storageRef);
      }

      const userData = {
        phone,
        avatar: avatarUrlToSave,
        displayName: user.displayName || user.email.split('@')[0],
        email: user.email,
      };
      await setDoc(userRef, userData, { merge: true });
      setAvatarUrl(avatarUrlToSave);
      setAvatar(null);
      alert(t('profile_updated'));
    } catch (err) {
      console.error('Error saving profile:', err);
      alert(t('profile_save_failed', { message: err.message }));
    }
  };

  if (loading) return <div>{t('loading_profile')}</div>;

  return (
    <div className="profile" data-theme={theme}>
      <h2>{t('profile')}</h2>
      <p>{t('username')}: {user.displayName || user.email.split('@')[0]}</p>
      <p>{t('phone_label')}: {phone || 'Not set'}</p>
      {avatarUrl && <img src={avatarUrl} alt="Profile Avatar" className="profile-avatar" />}
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder={t('phone_placeholder')}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setAvatar(e.target.files[0])}
      />
      {avatar && <img src={URL.createObjectURL(avatar)} alt="Preview" className="profile-avatar-preview" />}
      <button onClick={handleSave}>{t('save')}</button>
      <Link to="/">{t('back_to_home')}</Link>
    </div>
  );
}

export default App;