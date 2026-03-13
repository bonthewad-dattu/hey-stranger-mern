import React, { useEffect, useState } from 'react';
import styles from './StoryViewer.module.css';
import { getCommentsForPost, addCommentToPost } from '../services/comments';
import { useToast } from './ToastContext.jsx';

const EMOJIS = ['👍', '❤️', '😂', '😮'];

const StoryViewer = ({ stories, initialIndex = 0, onClose }) => {
  const { showToast } = useToast();
  const [index, setIndex] = useState(initialIndex);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');

  const story = stories[index];

  const isVideoUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    if (url.startsWith('data:video')) return true;
    return /\.(mp4|webm|ogg)$/i.test(url);
  };

  const loadComments = async (postId) => {
    if (!postId) return;
    setLoading(true);
    try {
      const res = await getCommentsForPost(postId);
      setComments(res.data);
    } catch (err) {
      setComments([]);
      showToast('Failed to load comments.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (story?._id) {
      loadComments(story._id);
    }
  }, [story?._id]);

  const handleAddComment = async (text) => {
    const trimmed = text.trim();
    if (!story?._id || !trimmed) return;
    try {
      const res = await addCommentToPost(story._id, { text: trimmed });
      setComments((prev) => [res.data, ...prev]);
      showToast('Comment added.', 'success');
    } catch (err) {
      showToast('Failed to add comment.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const current = input;
    setInput('');
    await handleAddComment(current);
  };

  const handleEmojiClick = async (emoji) => {
    await handleAddComment(emoji);
  };

  const handlePrev = () => {
    if (index > 0) {
      setIndex((i) => i - 1);
    }
  };

  const handleNext = () => {
    if (index < stories.length - 1) {
      setIndex((i) => i + 1);
    }
  };

  if (!story) return null;

  const createdAt = story.createdAt ? new Date(story.createdAt) : null;
  const dateLabel = createdAt ? createdAt.toLocaleString() : '';

  const isVideo = isVideoUrl(story.mediaUrl);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.viewer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.mediaPanel}>
          <div className={styles.mediaBox}>
            {story.mediaUrl ? (
              isVideo ? (
                <video src={story.mediaUrl} controls autoPlay />
              ) : (
                <img src={story.mediaUrl} alt="Story" />
              )
            ) : (
              <span>Story</span>
            )}
          </div>
          <div className={styles.storyMeta}>
            <span>{story.author || 'Someone'}</span>
            <span>{dateLabel}</span>
          </div>
          <div className={styles.reactionsRow}>
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                className={styles.reactionButton}
                onClick={() => handleEmojiClick(e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.sidebar}>
          <div className={styles.headerRow}>
            <div className={styles.author}>{story.author || 'Someone'}</div>
            <div className={styles.controls}>
              <button
                type="button"
                className={styles.controlButton}
                onClick={handlePrev}
                disabled={index === 0}
              >
                Prev
              </button>
              <button
                type="button"
                className={styles.controlButton}
                onClick={handleNext}
                disabled={index === stories.length - 1}
              >
                Next
              </button>
              <button
                type="button"
                className={styles.controlButton}
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
          <div className={styles.commentsBox}>
            {loading && <div>Loading comments...</div>}
            {!loading && comments.length === 0 && <div>No comments yet. Be the first to react.</div>}
            {!loading &&
              comments.map((c) => (
                <div key={c._id} className={styles.commentItem}>
                  <span className={styles.commentAuthor}>{c.author}</span>
                  <span>{c.text}</span>
                </div>
              ))}
          </div>
          <form className={styles.commentForm} onSubmit={handleSubmit}>
            <input
              className={styles.commentInput}
              placeholder="Reply with a comment..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className={styles.commentSubmit} disabled={!input.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;
