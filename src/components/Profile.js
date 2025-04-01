import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

const Profile = ({ user, theme, db }) => {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (user === null) return;
    if (!user || !user.uid) {
      setError(t('no_user_logged_in'));
      setLoading(false);
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setPhone(data.phone || '');
        setPlayerName(data.playerName || 'Not set');
      } else {
        setPhone('');
        setPlayerName('Not set');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(t('profile_fetch_error', { message: err.message }));
    } finally {
      setLoading(false);
    }
  }, [user, db, t]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const debounce = (func, delay) => {
    let timeout;
    return (value) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(value), delay);
    };
  };

  const handlePhoneChange = debounce(setPhone, 300);
  const handlePlayerNameChange = debounce(setPlayerName, 300);

  const handleSave = useCallback(async () => {
    if (!user || !user.uid) {
      setError(t('no_user_logged_in'));
      return;
    }

    setSaving(true);
    const userData = {
      phone,
      playerName,
      displayName: user.displayName || user.email.split('@')[0],
      email: user.email,
    };
    setIsEditing(false);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, userData, { merge: true });
      alert(t('profile_updated'));
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(t('profile_save_failed', { message: err.message }));
      setIsEditing(true);
    } finally {
      setSaving(false);
    }
  }, [user, phone, playerName, t]);

  if (loading) return <div>{t('loading_profile')}</div>;

  if (error) return (
    <div className="error" data-theme={theme}>
      {error}
      <button onClick={() => { setError(null); setLoading(true); fetchProfile(); }} style={{ marginLeft: '1rem' }}>
        {t('retry')}
      </button>
      <Link to="/" className="back-link" aria-label={t('back_to_home')}>{t('back_to_home')}</Link>
    </div>
  );

  if (!user) {
    return (
      <div className="profile" data-theme={theme}>
        <h2>{t('profile')}</h2>
        <p>{t('please_login')}</p>
        <Link to="/" className="back-link" aria-label={t('back_to_home')}>{t('back_to_home')}</Link>
      </div>
    );
  }

  return (
    <div className="profile" data-theme={theme}>
      <h2>{t('profile')}</h2>
      {isEditing ? (
        <>
          <p>{t('username')}: {user.displayName || user.email.split('@')[0]}</p>
          <p>Email: {user.email}</p>
          <input
            type="tel"
            defaultValue={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder={t('phone_placeholder')}
            aria-label={t('phone_label')}
            disabled={saving}
          />
          <input
            type="text"
            defaultValue={playerName}
            onChange={(e) => handlePlayerNameChange(e.target.value)}
            placeholder={t('player_name')}
            aria-label={t('player_name')}
            disabled={saving}
          />
          <div className="form-buttons">
            <button
              onClick={handleSave}
              aria-label={t('save_profile_changes')}
              disabled={saving}
            >
              {saving ? t('saving') : t('save')}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              aria-label={t('cancel_profile_changes')}
              disabled={saving}
            >
              {t('cancel')}
            </button>
          </div>
        </>
      ) : (
        <>
          <p>{t('username')}: {user.displayName || user.email.split('@')[0]}</p>
          <p>Email: {user.email}</p>
          <p>{t('phone_label')}: {phone || 'Not set'}</p>
          <p>{t('player_name')}: {playerName}</p>
          <button
            onClick={() => setIsEditing(true)}
            aria-label={t('edit_profile')}
          >
            {t('edit_profile')}
          </button>
        </>
      )}
      <Link to="/" className="back-link" aria-label={t('back_to_home')}>{t('back_to_home')}</Link>
    </div>
  );
};

export default Profile;