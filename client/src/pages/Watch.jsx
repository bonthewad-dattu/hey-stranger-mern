import React, { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';
import { getVideos, createVideo, toggleLikeVideo } from '../services/watch';
import { useToast } from '../components/ToastContext.jsx';

const Watch = () => {
  const { showToast } = useToast();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const loadVideos = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getVideos();
      setVideos(res.data);
    } catch (err) {
      setVideos([]);
      const msg = 'Failed to load videos';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedUrl = videoUrl.trim();
    if (!trimmedTitle || !trimmedUrl || creating) return;

    setCreating(true);
    try {
      const res = await createVideo({
        title: trimmedTitle,
        videoUrl: trimmedUrl,
        description,
      });
      setVideos((prev) => [
        {
          _id: res.data._id,
          title: res.data.title,
          videoUrl: res.data.videoUrl,
          description: res.data.description,
          likesCount: (res.data.likes || []).length,
          isOwner: true,
          isLiked: false,
          ownerName: 'You',
          ownerUsername: null,
        },
        ...prev,
      ]);
      setTitle('');
      setVideoUrl('');
      setDescription('');
      showToast('Video shared.', 'success');
    } catch (err) {
      showToast('Failed to share video.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleLike = async (id) => {
    try {
      const res = await toggleLikeVideo(id);
      setVideos((prev) =>
        prev.map((v) =>
          v._id === id
            ? { ...v, likesCount: res.data.likesCount, isLiked: res.data.isLiked }
            : v
        )
      );
    } catch (err) {
      showToast('Failed to update like.', 'error');
    }
  };

  const isDirectVideo = (url) => {
    return /(\.mp4|\.webm|\.ogg)$/i.test(url);
  };

  return (
    <div className={styles.page}>
      <div className={styles.feedColumn}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Watch</span>
            <span className={styles.badge}>Share videos</span>
          </div>

          {/* Add video form */}
          <form onSubmit={handleCreate} className={styles.composerInput}>
            <div className={styles.composerAvatar}>🎬</div>
            <input
              className={styles.composerField}
              placeholder="Share a video (title)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </form>
          <input
            className={styles.composerField}
            placeholder="Video URL (mp4/webm/ogg or a link)"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          <textarea
            className={styles.pagesTextarea}
            rows={2}
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className={styles.composerActions}>
            <button
              type="button"
              className={styles.friendButton}
              onClick={handleCreate}
              disabled={creating || !title.trim() || !videoUrl.trim()}
            >
              {creating ? 'Sharing…' : 'Share Video'}
            </button>
          </div>

          {loading && <div className={styles.updateMeta}>Loading videos...</div>}
          {error && <div className={styles.updateMeta}>{error}</div>}

          {!loading && !error && videos.length === 0 && (
            <div className={styles.updateMeta}>
              No videos yet. Share one from your favorite source.
            </div>
          )}

          {!loading &&
            videos.map((v) => (
              <div key={v._id} className={styles.updateItem}>
                <div className={styles.updateAvatar}>
                  <span className={styles.avatarInitial}>
                    {(v.title || '').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className={styles.updateBody}>
                  <div className={styles.updateTitle}>{v.title}</div>
                  {isDirectVideo(v.videoUrl) ? (
                    <video
                      className={styles.updateMedia}
                      controls
                      src={v.videoUrl}
                    />
                  ) : (
                    <a
                      href={v.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.updateText}
                    >
                      {v.videoUrl}
                    </a>
                  )}
                  {v.description && (
                    <div className={styles.updateText}>{v.description}</div>
                  )}
                  <div className={styles.updateMeta}>
                    {v.likesCount} like{v.likesCount === 1 ? '' : 's'}
                    {v.ownerName && (
                      <span>
                        {` · Posted by ${v.ownerName}`}
                        {v.ownerUsername ? ` (@${v.ownerUsername})` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.friendButton}
                  onClick={() => handleToggleLike(v._id)}
                >
                  {v.isLiked ? 'Liked' : 'Like'}
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Watch;
