import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';
import { searchUsers } from '../services/users';
import { sendFriendRequest } from '../services/friends';
import { getMyFriends } from '../services/social';
import { useToast } from '../components/ToastContext.jsx';
import { useCurrentUser } from '../components/CurrentUserContext.jsx';

const People = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user: currentUser } = useCurrentUser() || {};
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentIds, setSentIds] = useState(new Set());
  const [friendIds, setFriendIds] = useState(new Set());

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const res = await getMyFriends();
        const ids = new Set(res.data.map((u) => u._id));
        setFriendIds(ids);
      } catch (err) {
        // ignore for now; we can still show search results
      }
    };
    loadFriends();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      setResults([]);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await searchUsers(q);
      setResults(res.data);
    } catch (err) {
      setResults([]);
      const msg = 'Failed to search people';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await sendFriendRequest(userId);
      setSentIds((prev) => new Set(prev).add(userId));
      showToast('Friend request sent.', 'success');
    } catch (err) {
      showToast('Failed to send friend request.', 'error');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.feedColumn}>
        <div className={styles.card}>
          <div className={styles.filterRow}>
            <span className={styles.cardTitle}>People</span>
          </div>
          <form onSubmit={handleSearch} className={styles.composerInput}>
            <input
              className={styles.composerField}
              placeholder="Search people by name or @username"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>
          {loading && <div className={styles.updateMeta}>Searching...</div>}
          {error && <div className={styles.updateMeta}>{error}</div>}
          {!loading && results.length === 0 && !error && (
            <div className={styles.updateMeta}>
              Type a name or username above to find people.
            </div>
          )}
          {!loading &&
            results.map((u) => {
              const isSelf = currentUser && currentUser._id === u._id;
              const isFriend = friendIds.has(u._id);
              const isRequested = sentIds.has(u._id);
              const showButton = !isSelf;
              return (
                <div
                  key={u._id}
                  className={styles.updateItem}
                  onClick={() => navigate(`/user/${u.username}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.updateAvatar}>
                    {u.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt={u.name || u.username}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <span className={styles.avatarInitial}>
                        {(u.name || u.username || '').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className={styles.updateBody}>
                    <div className={styles.updateTitle}>{u.name}</div>
                    <div className={styles.updateText}>@{u.username}</div>
                  </div>
                  {showButton && (
                    <button
                      type="button"
                      className={styles.friendButton}
                      disabled={isFriend || isRequested}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isFriend && !isRequested) {
                          handleSendRequest(u._id);
                        }
                      }}
                    >
                      {isFriend ? 'Friends' : isRequested ? 'Requested' : 'Add Friend'}
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default People;
