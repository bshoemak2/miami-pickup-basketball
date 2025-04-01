import React, { useEffect, useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { auth, db, onAuthStateChanged, signOut } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import playersImage from './images/players_1.jpg';
import altMiamiImage from './images/alt_miami_image2.jpg';
import { useTranslation } from 'react-i18next';
import AuthForm from './components/AuthForm';
import GameList from './components/GameList';
import Profile from './components/Profile';
import ContactUs from './components/ContactUs';
import ErrorBoundaryWithTranslation from './ErrorBoundary';
import GameDetails from './GameDetails';
import './App.css';

function App() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [playerName, setPlayerName] = useState(''); // Empty string as initial fallback
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [theme, setTheme] = useState('light');

  const affiliateProducts = useMemo(() => [
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
    { name: 'Nike Lebron 19 Low Basketball Shoes', link: 'https://amzn.to/41RDgIL', image: 'https://m.media-amazon.com/images/I/51BTHvABRiL._AC_SY535_.jpg' },
    { name: 'Spalding TF DNA Smart Basketball + 1 Yr App Subscription', link: 'https://amzn.to/4hTs8jr', image: 'https://m.media-amazon.com/images/I/71hcrRFqW3L._AC_SX679_.jpg' },
    { name: 'Point 3 Road Trip 2.0 Backpack Basketball Backpack with Drawstrong Closure', link: 'https://amzn.to/4j8cpxH', image: 'https://m.media-amazon.com/images/I/71R27vLUTNL._AC_SX679_.jpg' },
    { name: 'ChalkTalkSPORTS Basketball Performance Shorts - Graffiti - Youth & Adult', link: 'https://amzn.to/3E4iBbk', image: 'https://m.media-amazon.com/images/I/71bgerfUFWL._AC_SX679_.jpg' },
    { name: 'ChalkTalkSPORTS Basketball Performance Crew Socks - Multiple Colors - Youth & Adult', link: 'https://amzn.to/4hZQpEm', image: 'https://m.media-amazon.com/images/I/71hUxesJy0L._AC_SX679_.jpg' },
  ], []);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed. Current user:', currentUser);
      setUser(currentUser);
      if (currentUser && mounted) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            const fetchedPlayerName = data.playerName || currentUser.email.split('@')[0];
            setPlayerName(fetchedPlayerName);
            console.log('Player name set to:', fetchedPlayerName);
          } else {
            const fallbackName = currentUser.email.split('@')[0];
            setPlayerName(fallbackName);
            console.log('No profile doc found, using fallback player name:', fallbackName);
          }
        } catch (err) {
          console.error('Error fetching playerName:', err);
          const fallbackName = currentUser.email.split('@')[0];
          setPlayerName(fallbackName);
          console.log('Error occurred, using fallback player name:', fallbackName);
        }
      } else if (mounted) {
        setPlayerName('');
      }
    });

    let scrollTimeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setShowBackToTop(window.scrollY > 300);
      }, 100);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      mounted = false;
      unsubscribe();
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout failed:', err.message);
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

  console.log('Rendering App with playerName:', playerName);

  return (
    <Router>
      <ErrorBoundaryWithTranslation>
        <Routes>
          <Route
            path="/"
            element={
              <div className="App" data-theme={theme}>
                <div className="title-wrapper">
                  <h1>{t('app_title')}</h1>
                  <span className="flamingo">🦩</span>
                  <span className="beta">Beta</span>
                </div>
                <div className="header-controls">
                  <button onClick={toggleLanguage} className="language-toggle">
                    {t('switch_to')} {i18n.language === 'en' ? 'Spanish' : 'English'}
                  </button>
                  <button onClick={toggleTheme} className="theme-toggle">
                    {theme === 'light' ? t('dark_mode') : t('light_mode')}
                  </button>
                </div>
                {!user ? (
                  <AuthForm
                    auth={auth}
                    onLoginSuccess={() => console.log('Login successful')}
                    onSignupSuccess={() => console.log('Signup successful')}
                  />
                ) : (
                  <div className="header-buttons">
                    <p>{playerName ? t('welcome', { playerName }) : t('loading_welcome')} <button onClick={handleLogout}>{t('logout')}</button></p>
                    <Link to="/profile" className="profile-link">{t('profile')}</Link>
                    <Link to="/contact" className="contact-link">{t('contact_us')}</Link>
                  </div>
                )}
                <GameList user={user} db={db} />
                <img src={playersImage} alt={t('flamingo_basketball_alt')} className="footer-image" />
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
                        <img src={product.image} alt={product.name} loading="lazy" />
                        <p>{product.name}</p>
                      </a>
                    ))}
                  </div>
                  <p className="affiliate-disclosure">{t('affiliate_disclosure')}</p>
                </div>
                <img src={altMiamiImage} alt={t('miami_basketball_alt')} className="alt-miami-image" />
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
                  <button className="back-to-top" onClick={scrollToTop} aria-label={t('back_to_top')}>
                    {t('back_to_top')}
                  </button>
                )}
              </div>
            }
          />
          <Route path="/game/:gameId" element={<GameDetails theme={theme} />} />
          <Route path="/profile" element={<Profile user={user} theme={theme} db={db} />} />
          <Route path="/contact" element={<ContactUs theme={theme} />} />
        </Routes>
      </ErrorBoundaryWithTranslation>
    </Router>
  );
}

export default App;