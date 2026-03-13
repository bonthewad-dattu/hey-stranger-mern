import React, { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';
import { getBlogs, createBlog, toggleLikeBlog } from '../services/blogs';
import { useToast } from '../components/ToastContext.jsx';

const Blogs = () => {
  const { showToast } = useToast();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [creating, setCreating] = useState(false);

  const loadBlogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getBlogs();
      setBlogs(res.data);
    } catch (err) {
      setBlogs([]);
      const msg = 'Failed to load blogs';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle || !trimmedContent || creating) return;

    setCreating(true);
    try {
      const res = await createBlog({ title: trimmedTitle, content: trimmedContent });
      setBlogs((prev) => [
        {
          _id: res.data._id,
          title: res.data.title,
          content: res.data.content,
          likesCount: (res.data.likes || []).length,
          isOwner: true,
          isLiked: false,
          ownerName: 'You',
          ownerUsername: null,
        },
        ...prev,
      ]);
      setTitle('');
      setContent('');
      showToast('Blog published.', 'success');
    } catch (err) {
      showToast('Failed to publish blog.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleLike = async (id) => {
    try {
      const res = await toggleLikeBlog(id);
      setBlogs((prev) =>
        prev.map((b) =>
          b._id === id
            ? { ...b, likesCount: res.data.likesCount, isLiked: res.data.isLiked }
            : b
        )
      );
    } catch (err) {
      showToast('Failed to update like.', 'error');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.feedColumn}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Blogs</span>
            <span className={styles.badge}>Share your stories</span>
          </div>

          {/* Create Blog form */}
          <form onSubmit={handleCreate} className={styles.composerInput}>
            <div className={styles.composerAvatar}>✍️</div>
            <input
              className={styles.composerField}
              placeholder="Write a new blog post (title)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </form>
          <textarea
            className={styles.pagesTextarea}
            rows={4}
            placeholder="Your story..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className={styles.composerActions}>
            <button
              type="button"
              className={styles.friendButton}
              onClick={handleCreate}
              disabled={creating || !title.trim() || !content.trim()}
            >
              {creating ? 'Publishing…' : 'Publish Blog'}
            </button>
          </div>

          {loading && <div className={styles.updateMeta}>Loading blogs...</div>}
          {error && <div className={styles.updateMeta}>{error}</div>}

          {!loading && !error && blogs.length === 0 && (
            <div className={styles.updateMeta}>
              No blogs yet. Share your first story.
            </div>
          )}

          {!loading &&
            blogs.map((b) => (
              <div key={b._id} className={styles.updateItem}>
                <div className={styles.updateAvatar}>
                  <span className={styles.avatarInitial}>
                    {(b.title || '').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className={styles.updateBody}>
                  <div className={styles.updateTitle}>{b.title}</div>
                  <div className={styles.updateText}>{b.content}</div>
                  <div className={styles.updateMeta}>
                    {b.likesCount} like{b.likesCount === 1 ? '' : 's'}
                    {b.ownerName && (
                      <span>
                        {` · Posted by ${b.ownerName}`}
                        {b.ownerUsername ? ` (@${b.ownerUsername})` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.friendButton}
                  onClick={() => handleToggleLike(b._id)}
                >
                  {b.isLiked ? 'Liked' : 'Like'}
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Blogs;
