import React, { useEffect, useMemo, useState } from 'react';
import { getMyMemories } from '../services/memories';
import { createPost } from '../services/posts';
import { deletePost } from '../services/postActions';
import { useToast } from '../components/ToastContext.jsx';
import styles from './Dashboard.module.css';

const Memories = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | stories | older
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showToast } = useToast?.() || { showToast: () => {} };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMyMemories();
        setPosts(res.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const now = Date.now();
    const isStoryType = (p) => ['Image', 'Video', 'Profile Picture'].includes(p.type);
    const isOlderThan24h = (p) => new Date(p.createdAt).getTime() <= now - 24 * 60 * 60 * 1000;
    const isOlderThan30d = (p) => new Date(p.createdAt).getTime() <= now - 30 * 24 * 60 * 60 * 1000;
    if (filter === 'stories') {
      return posts.filter((p) => isStoryType(p) && isOlderThan24h(p));
    }
    if (filter === 'older') {
      return posts.filter((p) => isOlderThan30d(p));
    }
    return posts;
  }, [posts, filter]);

  const isVideoUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    if (url.startsWith('data:video')) return true;
    return /(mp4|webm|ogg)$/i.test(url);
  };

  const handleReshareAsStory = async (p) => {
    try {
      if (!p.mediaUrl) {
        showToast('Only media posts can be shared to Stories.', 'info');
        return;
      }
      const type = p.type === 'Video' ? 'Video' : 'Image';
      const res = await createPost({ type, text: p.text || '', mediaUrl: p.mediaUrl, isStory: true });
      showToast('Shared to Stories. It will be visible for 24 hours.', 'success');
      return res;
    } catch (e) {
      showToast('Failed to share to Stories.', 'error');
    }
  };

  if (loading) {
    return <div>Loading your memories...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.feedColumn}>
        <div className={styles.card}>
          <div className={styles.filterRow}>
            <span className={styles.cardTitle}>Memories</span>
            <div className={styles.filterControls}>
              <select
                className={styles.filterSelect}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="stories">Stories archive</option>
                <option value="older">Older posts</option>
              </select>
            </div>
          </div>
          {filtered.map((p) => (
            <div key={p._id} className={styles.updateItem}>
              <div className={styles.updateAvatar}>
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
                  Y
                </span>
              </div>
              <div className={styles.updateBody}>
                <div className={styles.updateTitle}>
                  <strong>You</strong> shared a {p.type.toLowerCase()} post
                </div>
                {p.text && (
                  <div className={styles.updateText}>
                    {p.text}
                  </div>
                )}
                {p.mediaUrl && (
                  <div className={styles.updateMediaPreview}>
                    {isVideoUrl(p.mediaUrl) ? (
                      <video src={p.mediaUrl} muted playsInline />
                    ) : (
                      <img src={p.mediaUrl} alt="Post media" />
                    )}
                  </div>
                )}
                <div className={styles.updateFooterRow}>
                  <span className={styles.updateMeta}>{new Date(p.createdAt).toLocaleDateString()}</span>
                  {p.mediaUrl && (
                    <span className={styles.updateMediaBadge}>
                      <i className="fas fa-image" /> Media
                    </span>
                  )}
                  <div className={styles.updateActions}>
                    <button
                      type="button"
                      className={styles.updateActionBtn}
                      title="Delete post"
                      onClick={() => setDeleteTarget(p)}
                    >
                      <i className="fas fa-trash" />
                    </button>
                    <button
                      type="button"
                      className={styles.updateActionBtn}
                      title="Share to Stories"
                      onClick={() => handleReshareAsStory(p)}
                    >
                      <i className="fas fa-paper-plane" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {deleteTarget && (
            <div className={styles.modalBackdrop} onClick={() => setDeleteTarget(null)}>
              <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <div className={styles.modalTitle}>Delete post</div>
                </div>
                <div className={styles.modalBody}>
                  {deleteTarget.mediaUrl && (
                    <div className={styles.modalMediaPreview}>
                      {isVideoUrl(deleteTarget.mediaUrl) ? (
                        <video src={deleteTarget.mediaUrl} muted playsInline />
                      ) : (
                        <img src={deleteTarget.mediaUrl} alt="Media" />
                      )}
                    </div>
                  )}
                  <div className={styles.modalSubText}>Are you sure you want to permanently delete this post?</div>
                  {deleteTarget.text && (
                    <div className={styles.updateText} style={{ marginTop: 4 }}>{deleteTarget.text}</div>
                  )}
                  <div className={styles.modalActions}>
                    <button className={styles.modalSecondaryButton} onClick={() => setDeleteTarget(null)}>Cancel</button>
                    <button
                      className={styles.modalDangerButton}
                      onClick={async () => {
                        try {
                          await deletePost(deleteTarget._id);
                          setPosts((prev) => prev.filter((x) => x._id !== deleteTarget._id));
                          setDeleteTarget(null);
                          showToast('Post deleted.', 'success');
                        } catch (err) {
                          showToast('Failed to delete post.', 'error');
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {filtered.length === 0 && (
            <div className={styles.updateMeta}>No memories yet. They will appear here as your posts get older.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Memories;
