import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUserByUsername, getUserPostsByUsername } from '../services/users';
import { sendFriendRequest, unfriend } from '../services/friends';
import { useToast } from '../components/ToastContext.jsx';
import { useCurrentUser } from '../components/CurrentUserContext.jsx';
import styles from './Profile.module.css';

const UserPublicProfile = () => {
  const { username } = useParams();
  const { showToast } = useToast();
  const { user: currentUser } = useCurrentUser() || {};
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requested, setRequested] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const [userRes, postsRes] = await Promise.all([
        getUserByUsername(username),
        getUserPostsByUsername(username),
      ]);
      setUser(userRes.data);
      setPosts(postsRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      await loadProfile();
    };
    load();
  }, [username]);

  const handleUnfriend = async () => {
    if (!user?._id) return;
    try {
      await unfriend(user._id);
      showToast('Unfriended successfully.', 'info');
      await loadProfile();
    } catch (err) {
      showToast('Failed to unfriend.', 'error');
    }
  };

  const handleSendFriendRequest = async () => {
    if (!user?._id) return;
    try {
      await sendFriendRequest(user._id);
      setRequested(true);
      showToast('Friend request sent.', 'success');
    } catch (err) {
      showToast('Failed to send friend request.', 'error');
    }
  };

  if (loading) {
    return <div className={styles.wrapper}>Loading profile...</div>;
  }

  if (error) {
    return <div className={styles.wrapper}>{error}</div>;
  }

  if (!user) {
    return <div className={styles.wrapper}>User not found</div>;
  }

  const postsCount = posts.length;
  const mediaCount = posts.filter((p) => ['Image', 'Video', 'Profile Picture'].includes(p.type)).length;
  const friendsCount = Array.isArray(user.friends) ? user.friends.length : 0;
  const isSelf = currentUser && user._id === currentUser._id;
  const isFriend =
    !isSelf && currentUser && Array.isArray(user.friends)
      ? user.friends.map((id) => id.toString()).includes(currentUser._id)
      : false;

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarCircle}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className={styles.avatarImg} />
            ) : (
              '🧑🏻'
            )}
          </div>
          <div>
            <h2 className={styles.name}>{user.name}</h2>
            <p className={styles.username}>@{user.username}</p>
            <p className={styles.bio}>{user.bio || 'No bio yet.'}</p>
          </div>
          {!isSelf && (
            <div className={styles.actionsRow}>
              {isFriend ? (
                <button type="button" className={styles.deleteButton} onClick={handleUnfriend}>
                  Unfriend
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.saveButton}
                  onClick={handleSendFriendRequest}
                  disabled={requested}
                >
                  {requested ? 'Requested' : 'Add Friend'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Posts</span>
            <span className={styles.statValue}>{postsCount}</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Media</span>
            <span className={styles.statValue}>{mediaCount}</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Friends</span>
            <span className={styles.statValue}>{friendsCount}</span>
          </div>
        </div>

        <div className={styles.tabPanel}>
          {posts.length === 0 ? (
            <div className={styles.empty}>No posts yet.</div>
          ) : (
            <ul className={styles.list}>
              {posts.map((p) => (
                <li key={p._id} className={styles.listItem}>
                  <span className={styles.listPrimary}>{p.text || '(No text)'}</span>
                  <span className={styles.listSecondary}>{p.type}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPublicProfile;
