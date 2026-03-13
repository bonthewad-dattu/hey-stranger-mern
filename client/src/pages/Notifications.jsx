import React, { useEffect, useState } from 'react';
import { getNotificationHistory, markNotificationsRead } from '../services/notifications';
import styles from './Dashboard.module.css';

const Notifications = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        // Mark notifications as read on open (affects navbar badge)
        try {
          await markNotificationsRead();
        } catch {
          // ignore marking errors
        }
        const res = await getNotificationHistory();
        setItems(res.data);
      } catch (err) {
        setItems([]);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className={styles.page}>Loading notifications...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.feedColumn}>
        <div className={styles.card}>
          <div className={styles.filterRow}>
            <span className={styles.cardTitle}>Notifications</span>
          </div>
          {error && <div className={styles.updateMeta}>{error}</div>}
          <div className={styles.articlesList}>
            {items.map((n, idx) => (
              <div key={idx} className={`${styles.updateItem} ${styles.articlesItem}`}>
                <div className={styles.updateAvatar}>
                  {n.avatarUrl ? (
                    <img
                      src={n.avatarUrl}
                      alt={n.actorName || 'User'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        color: '#6b7280',
                      }}
                    >
                      {(n.actorName || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className={styles.updateBody}>
                  <div className={styles.updateTitle}>{n.description}</div>
                  {n.type === 'message' && n.text && (
                    <div className={styles.updateText}>
                      "{n.text.length > 120 ? `${n.text.slice(0, 120)}…` : n.text}"
                    </div>
                  )}
                  <div className={styles.updateFooterRow}>
                    <span className={styles.updateMeta}>{new Date(n.createdAt).toLocaleString()}</span>
                    <span className={styles.updateMediaBadge}>
                      {n.type === 'message' ? 'Message' : 'Friend'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {items.length === 0 && (
            <div className={styles.updateMeta}>You do not have any notifications yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
