import React, { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';
import { getPages, createPage, toggleFollowPage } from '../services/pages';
import { useToast } from '../components/ToastContext.jsx';

const PagesExplore = () => {
  const { showToast } = useToast();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Community');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const loadPages = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getPages();
      setPages(res.data);
    } catch (err) {
      setPages([]);
      const msg = 'Failed to load pages';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      const res = await createPage({ title: trimmed, category, description });
      // Optimistically prepend
      setPages((prev) => [
        {
          _id: res.data._id,
          title: res.data.title,
          category: res.data.category,
          description: res.data.description,
          followersCount: (res.data.followers || []).length,
          isOwner: true,
          isFollowing: true,
        },
        ...prev,
      ]);
      setTitle('');
      setCategory('Community');
      setDescription('');
      showToast('Page created.', 'success');
    } catch (err) {
      showToast('Failed to create page.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleFollow = async (id) => {
    try {
      const res = await toggleFollowPage(id);
      setPages((prev) =>
        prev.map((p) =>
          p._id === id
            ? { ...p, followersCount: res.data.followersCount, isFollowing: res.data.isFollowing }
            : p
        )
      );
      showToast('Page follow status updated.', 'success');
    } catch (err) {
      showToast('Failed to update page.', 'error');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.feedColumn}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Pages</span>
            <span className={styles.badge}>Discover & create</span>
          </div>

          {/* Create Page form */}
          <form onSubmit={handleCreate} className={styles.composerInput}>
            <div className={styles.composerAvatar}>📄</div>
            <input
              className={styles.composerField}
              placeholder="Create a new page (title)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </form>
          <div className={styles.composerActions} style={{ justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <select
                className={styles.filterSelect}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Community">Community</option>
                <option value="Brand">Brand</option>
                <option value="Public Figure">Public Figure</option>
              </select>
            </div>
            <button
              type="button"
              className={styles.friendButton}
              onClick={handleCreate}
              disabled={creating || !title.trim()}
            >
              {creating ? 'Creating…' : 'Create Page'}
            </button>
          </div>
          <textarea
            className={styles.pagesTextarea}
            rows={2}
            placeholder="Short description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {loading && <div className={styles.updateMeta}>Loading pages...</div>}
          {error && <div className={styles.updateMeta}>{error}</div>}

          {!loading && !error && pages.length === 0 && (
            <div className={styles.updateMeta}>No pages yet. Be the first to create one!</div>
          )}

          {!loading &&
            pages.map((p) => (
              <div key={p._id} className={styles.updateItem}>
                <div className={styles.updateAvatar}>
                  <span className={styles.avatarInitial}>
                    {(p.title || '').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className={styles.updateBody}>
                  <div className={styles.updateTitle}>{p.title}</div>
                  <div className={styles.updateText}>
                    {p.category} · {p.followersCount} follower{p.followersCount === 1 ? '' : 's'}
                  </div>
                  {p.description && (
                    <div className={styles.updateText}>{p.description}</div>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.friendButton}
                  onClick={() => handleToggleFollow(p._id)}
                >
                  {p.isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default PagesExplore;
