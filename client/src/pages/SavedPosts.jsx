import React, { useEffect, useState } from 'react';
import { getSavedPosts, unsavePost } from '../services/saved';
import StoryViewer from '../components/StoryViewer.jsx';
import styles from './Dashboard.module.css';

const SavedPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getSavedPosts();
        setPosts(res.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isVideoUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    if (url.startsWith('data:video')) return true;
    return /(\.mp4|\.webm|\.ogg)$/i.test(url);
  };

  const handleUnsave = async (postId) => {
    try {
      await unsavePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      // silently fail for now
    }
  };

  if (loading) {
    return <div>Loading saved posts...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.feedColumn}>
        <div className={styles.card}>
          <div className={styles.filterRow}>
            <span className={styles.cardTitle}>Saved Posts</span>
          </div>
          <div className={styles.articlesList}>
            {posts.map((p, idx) => (
              <div key={p._id} className={`${styles.updateItem} ${styles.articlesItem}`}>
                <div className={styles.updateAvatar}>
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt={p.author || 'User'}
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
                      {(p.author || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className={styles.updateBody}>
                  <div className={styles.updateTitle}>
                    You saved a {p.type?.toLowerCase() || 'text'} post from <strong>{p.author || 'Someone'}</strong>
                  </div>
                  {p.text && (
                    <div className={styles.updateText}>
                      {p.text.slice(0, 140)}
                      {p.text.length > 140 ? '…' : ''}
                    </div>
                  )}
                  {p.mediaUrl && (
                    <div
                      className={styles.updateMediaPreview}
                      onClick={() => {
                        setViewerIndex(idx);
                        setViewerOpen(true);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {isVideoUrl(p.mediaUrl) ? (
                        <video src={p.mediaUrl} muted playsInline />
                      ) : (
                        <img src={p.mediaUrl} alt="Post media" />
                      )}
                    </div>
                  )}
                  <div className={styles.updateFooterRow}>
                    <span className={styles.updateMeta}>{p.relativeTime}</span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {p.mediaUrl && (
                        <span className={styles.updateMediaBadge}>
                          <i className="fas fa-image" /> Media
                        </span>
                      )}
                      <button
                        type="button"
                        className={styles.updateActionBtn}
                        onClick={() => handleUnsave(p._id)}
                        title="Unsave post"
                      >
                        <i className="fas fa-bookmark" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {posts.length === 0 && (
            <div className={styles.updateMeta}>You have not saved any posts yet.</div>
          )}
        </div>
      </div>
      {viewerOpen && (
        <StoryViewer
          stories={posts}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
};

export default SavedPosts;
