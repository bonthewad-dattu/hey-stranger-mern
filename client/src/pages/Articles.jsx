import React, { useEffect, useState } from 'react';
import { getMyPosts } from '../services/posts';
import { updatePost, deletePost } from '../services/postActions';
import { useToast } from '../components/ToastContext.jsx';
import StoryViewer from '../components/StoryViewer.jsx';
import styles from './Dashboard.module.css';

const Articles = () => {
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [storyViewerIndex, setStoryViewerIndex] = useState(0);
  const [editingPost, setEditingPost] = useState(null);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingPost, setDeletingPost] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMyPosts();
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

  const openEditModal = (post) => {
    setEditingPost(post);
    setEditText(post.text || '');
  };

  const closeEditModal = () => {
    if (savingEdit) return;
    setEditingPost(null);
    setEditText('');
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editingPost) return;
    const nextText = editText.trim();
    setSavingEdit(true);
    try {
      const res = await updatePost(editingPost._id, { text: nextText });
      setPosts((prev) =>
        prev.map((p) => (p._id === editingPost._id ? { ...p, text: res.data.text } : p))
      );
      showToast('Post updated.', 'success');
      closeEditModal();
    } catch (err) {
      showToast('Failed to update post.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const openDeleteModal = (post) => {
    setDeletingPost(post);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeletingPost(null);
  };

  const confirmDelete = async () => {
    if (!deletingPost) return;
    setDeleting(true);
    try {
      await deletePost(deletingPost._id);
      setPosts((prev) => prev.filter((p) => p._id !== deletingPost._id));
      showToast('Post deleted.', 'success');
      closeDeleteModal();
    } catch (err) {
      showToast('Failed to delete post.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div>Loading your articles...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.feedColumn}>
        <div className={styles.card}>
          <div className={styles.filterRow}>
            <span className={styles.cardTitle}>My Articles</span>
          </div>
          <div className={styles.articlesList}>
            {posts.map((p, idx) => (
              <div key={p._id} className={`${styles.updateItem} ${styles.articlesItem}`}>
                <div className={styles.updateAvatar}>
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt={p.author || 'You'}
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
                      {(p.author || 'You').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className={styles.updateBody}>
                  <div className={styles.updateTitle}>
                    <strong>You</strong> posted a {p.type.toLowerCase()} update
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
                        setStoryViewerIndex(idx);
                        setStoryViewerOpen(true);
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
                    <span className={styles.updateMeta}>
                      {p.relativeTime || new Date(p.createdAt).toLocaleDateString()}
                    </span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {p.mediaUrl && (
                        <span className={styles.updateMediaBadge}>
                          <i className="fas fa-image" /> Media
                        </span>
                      )}
                      <div
                        className={styles.updateActions}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <button
                          type="button"
                          className={styles.updateActionBtn}
                          title="Edit caption"
                          onClick={() => openEditModal(p)}
                        >
                          <i className="fas fa-pen" />
                        </button>
                        <button
                          type="button"
                          className={styles.updateActionBtn}
                          title="Delete post"
                          onClick={() => openDeleteModal(p)}
                        >
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {posts.length === 0 && (
            <div className={styles.updateMeta}>You have not posted any articles yet.</div>
          )}
        </div>
      </div>
      {storyViewerOpen && (
        <StoryViewer
          stories={posts}
          initialIndex={storyViewerIndex}
          onClose={() => setStoryViewerOpen(false)}
        />
      )}
      {editingPost && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Edit post</span>
            </div>
            <form onSubmit={submitEdit} className={styles.modalBody}>
              {editingPost.mediaUrl && (
                <div className={styles.modalMediaPreview}>
                  {isVideoUrl(editingPost.mediaUrl) ? (
                    <video src={editingPost.mediaUrl} muted playsInline />
                  ) : (
                    <img src={editingPost.mediaUrl} alt="Post media" />
                  )}
                </div>
              )}
              <label className={styles.modalLabel}>Caption</label>
              <textarea
                className={styles.modalTextarea}
                rows={3}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Update your caption..."
              />
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalSecondaryButton}
                  onClick={closeEditModal}
                  disabled={savingEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.modalPrimaryButton}
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deletingPost && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Delete post</span>
            </div>
            <div className={styles.modalBody}>
              {deletingPost.mediaUrl && (
                <div className={styles.modalMediaPreview}>
                  {isVideoUrl(deletingPost.mediaUrl) ? (
                    <video src={deletingPost.mediaUrl} muted playsInline />
                  ) : (
                    <img src={deletingPost.mediaUrl} alt="Post media" />
                  )}
                </div>
              )}
              <p className={styles.modalText}>
                Are you sure you want to permanently delete this post?
              </p>
              {deletingPost.text && (
                <p className={styles.modalSubText}>{deletingPost.text}</p>
              )}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalSecondaryButton}
                  onClick={closeDeleteModal}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.modalDangerButton}
                  onClick={confirmDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Articles;
