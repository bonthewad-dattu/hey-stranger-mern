import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, updateCurrentUser, deleteCurrentUser } from '../services/auth';
import { useToast } from '../components/ToastContext.jsx';
import { useCurrentUser } from '../components/CurrentUserContext.jsx';
import {
  getMyStats,
  getMyPosts,
  getMyMedia,
  getMyFollowers,
  getMyFriends,
  removeFollower,
} from '../services/social';
import styles from './Profile.module.css';

const Profile = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user: currentUser, setUser: setCurrentUser } = useCurrentUser() || {};
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({ postsCount: 0, mediaCount: 0, friendsCount: 0 });
  const [activeTab, setActiveTab] = useState('overview');
  const [posts, setPosts] = useState([]);
  const [media, setMedia] = useState([]);
  const [friends, setFriends] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [avatarFileName, setAvatarFileName] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, statsRes] = await Promise.all([getCurrentUser(), getMyStats()]);
        setUser(meRes.data);
        setForm({
          name: meRes.data.name || '',
          username: meRes.data.username || '',
          email: meRes.data.email || '',
          phone: meRes.data.phone || '',
          gender: meRes.data.gender || 'Male',
          dateOfBirth: meRes.data.dateOfBirth ? meRes.data.dateOfBirth.substring(0, 10) : '',
          bio: meRes.data.bio || '',
          avatarUrl: meRes.data.avatarUrl || '',
        });
        setStats({
          postsCount: statsRes.data.postsCount,
          mediaCount: statsRes.data.mediaCount,
          friendsCount: statsRes.data.friendsCount,
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadTabData = async (tab) => {
    setTabLoading(true);
    try {
      if (tab === 'posts') {
        const res = await getMyPosts();
        setPosts(res.data);
      } else if (tab === 'media') {
        const res = await getMyMedia();
        setMedia(res.data);
      } else if (tab === 'friends') {
        const res = await getMyFriends();
        setFriends(res.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load list';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setTabLoading(false);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab !== 'overview') {
      loadTabData(tab);
    }
  };

  const handleRemoveFollower = async () => {};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await updateCurrentUser({
        ...form,
        dateOfBirth: form.dateOfBirth || undefined,
      });
      setUser(res.data);
      if (setCurrentUser) {
        setCurrentUser(res.data);
      }
      setForm((prev) => ({
        ...prev,
        avatarUrl: res.data.avatarUrl || prev.avatarUrl,
      }));
      setMessage('Profile updated successfully');
      showToast('Profile updated successfully.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm('Are you sure you want to delete your account? This cannot be undone.');
    if (!ok) return;
    try {
      await deleteCurrentUser();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      navigate('/login');
      showToast('Account deleted.', 'info');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete account';
      setError(msg);
      showToast(msg, 'error');
    }
  };

  if (loading || !form) {
    return <div className={styles.wrapper}>Loading profile...</div>;
  }

  if (error && !user) {
    return <div className={styles.wrapper}>{error}</div>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarCircle}>
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt="Avatar" className={styles.avatarImg} />
            ) : (
              '🧑🏻'
            )}
          </div>
          <div>
            <h2 className={styles.name}>{form.name}</h2>
            <p className={styles.username}>@{form.username}</p>
            <p className={styles.bio}>{form.bio || 'Add a short bio about yourself.'}</p>
          </div>
        </div>

        {/* Stats row now clickable into detailed views */}
        <div className={styles.statsRow}>
          <button type="button" className={styles.statBox} onClick={() => handleTabClick('posts')}>
            <span className={styles.statLabel}>Posts</span>
            <span className={styles.statValue}>{stats.postsCount}</span>
          </button>
          <button type="button" className={styles.statBox} onClick={() => handleTabClick('media')}>
            <span className={styles.statLabel}>Media</span>
            <span className={styles.statValue}>{stats.mediaCount}</span>
          </button>
          <button type="button" className={styles.statBox} onClick={() => handleTabClick('friends')}>
            <span className={styles.statLabel}>Friends</span>
            <span className={styles.statValue}>{stats.friendsCount}</span>
          </button>
        </div>

        {activeTab !== 'overview' && (
          <div className={styles.tabPanel}>
            {tabLoading ? (
              <div className={styles.tabLoading}>Loading...</div>
            ) : (
              <>
                {activeTab === 'posts' && (
                  <ul className={styles.list}>
                    {posts.map((p) => (
                      <li key={p._id} className={styles.listItem}>
                        <span className={styles.listPrimary}>{p.text || '(No text)'}</span>
                        <span className={styles.listSecondary}>{p.type}</span>
                      </li>
                    ))}
                    {posts.length === 0 && <div className={styles.empty}>No posts yet.</div>}
                  </ul>
                )}
                {activeTab === 'media' && (
                  <ul className={styles.list}>
                    {media.map((p) => (
                      <li key={p._id} className={styles.listItem}>
                        <span className={styles.listPrimary}>{p.text || '(Media post)'}</span>
                        <span className={styles.listSecondary}>{p.type}</span>
                      </li>
                    ))}
                    {media.length === 0 && <div className={styles.empty}>No media yet.</div>}
                  </ul>
                )}
                {activeTab === 'friends' && (
                  <ul className={styles.list}>
                    {friends.map((u) => (
                      <li
                        key={u._id}
                        className={styles.listItem}
                        onClick={() => navigate(`/user/${u.username}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className={styles.listPrimary}>{u.name}</span>
                        <span className={styles.listSecondary}>@{u.username}</span>
                      </li>
                    ))}
                    {friends.length === 0 && <div className={styles.empty}>No friends yet.</div>}
                  </ul>
                )}
                {activeTab === 'followers' && null}
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSave} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          {message && <div className={styles.success}>{message}</div>}

          <div className={styles.grid}>
            <div className={styles.item}>
              <span className={styles.label}>Full Name</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Username</span>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Phone</span>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Gender</span>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className={styles.input}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Date of Birth</span>
              <input
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Avatar URL</span>
              <input
                name="avatarUrl"
                value={form.avatarUrl}
                onChange={handleChange}
                className={styles.input}
                placeholder="Link to your avatar image"
              />
              <div className={styles.avatarInputRow}>
                <label className={styles.fileButton}>
                  <i className="bi bi-upload" />
                  <span>Choose file</span>
                  <input
                    type="file"
                    accept="image/*"
                    className={styles.hiddenFileInput}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setAvatarFileName(file.name);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                          setForm((prev) => ({ ...prev, avatarUrl: reader.result }));
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {avatarFileName && (
                  <span className={styles.fileNameText}>{avatarFileName}</span>
                )}
                <div className={styles.avatarActions}>
                  <button
                    type="button"
                    className={styles.applyButton}
                    title="Apply avatar URL"
                    onClick={() => setForm((prev) => ({ ...prev, avatarUrl: prev.avatarUrl?.trim() || '' }))}
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    className={styles.clearButton}
                    title="Clear avatar"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, avatarUrl: '' }));
                      setAvatarFileName('');
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
            <div className={styles.itemFull}>
              <span className={styles.label}>Bio</span>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                className={styles.textarea}
                rows={3}
                placeholder="Write something about yourself..."
              />
            </div>
          </div>

          <div className={styles.actionsRow}>
            <button type="submit" className={styles.saveButton} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className={styles.deleteButton} onClick={handleDelete}>
              Delete Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
