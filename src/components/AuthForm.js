import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useTranslation } from 'react-i18next';

const AuthForm = ({ auth, onLoginSuccess, onSignupSuccess }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

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
      onLoginSuccess();
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
      onSignupSuccess();
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

  return (
    <div className="auth-form">
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
        <div className="auth-buttons">
          <button type="submit">{t('login')}</button>
          <button onClick={handleSignup}>{t('register')}</button>
        </div>
      </form>
      <p>{t('guests_browse')}</p>
    </div>
  );
};

export default AuthForm;