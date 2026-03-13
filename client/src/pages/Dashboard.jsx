import React, { useEffect, useState } from 'react';
import { getFeedPosts, getMyPosts, createPost } from '../services/posts';
import { getDashboardStories } from '../services/dashboard';
import { getSavedPosts, savePost, unsavePost } from '../services/saved';
import { updatePost, deletePost } from '../services/postActions';
import { getCurrentUser } from '../services/auth';
import { likePost, getPostStats, getPostComments, addPostComment } from '../services/interactions';
import { useToast } from '../components/ToastContext.jsx';
import StoryViewer from '../components/StoryViewer.jsx';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [stories, setStories] = useState([]);
  const [composerText, setComposerText] = useState('');
  const [composerSubmitting, setComposerSubmitting] = useState(false);
  const [composerType, setComposerType] = useState('Text');
  const [composerMediaUrl, setComposerMediaUrl] = useState('');
  const [composerMediaFileName, setComposerMediaFileName] = useState('');
  const [greetingTitle, setGreetingTitle] = useState('');
  const [greetingQuote, setGreetingQuote] = useState('');
  const [greetingDate, setGreetingDate] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [filterScope, setFilterScope] = useState('all');
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [storyViewerIndex, setStoryViewerIndex] = useState(0);
  const [storyViewerItems, setStoryViewerItems] = useState([]);
  const MAX_VIDEO_BYTES = 7 * 1024 * 1024; // ~7MB client-side safety limit

  // interactions state
  const [postStats, setPostStats] = useState({}); // { [postId]: { likes, comments, reposts, liked } }
  const [commentsOpenFor, setCommentsOpenFor] = useState(null);
  const [commentsList, setCommentsList] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [lightbox, setLightbox] = useState({ open: false, url: '', isVideo: false });
  const [openMenuFor, setOpenMenuFor] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await getCurrentUser();
        const data = res.data || {};
        setCurrentUserName(data.name || data.username || '');
      } catch (err) {
        // ignore for now
      }
    };
    loadUser();
  }, []);

  const openComments = async (postId) => {
    setCommentsOpenFor(postId);
    try {
      const [stRes, cRes] = await Promise.all([getPostStats(postId), getPostComments(postId)]);
      setPostStats((prev) => ({ ...prev, [postId]: stRes.data }));
      setCommentsList(cRes.data);
    } catch (e) {
      showToast('Failed to load comments.', 'error');
    }
  };

  const handleAddComment = async () => {
    const text = commentInput.trim();
    if (!text || !commentsOpenFor) return;
    try {
      const res = await addPostComment(commentsOpenFor, text);
      setCommentsList((prev) => [res.data, ...prev]);
      setCommentInput('');
      setPostStats((prev) => {
        const s = prev[commentsOpenFor] || { likes: 0, comments: 0, reposts: 0, liked: false };
        return { ...prev, [commentsOpenFor]: { ...s, comments: (s.comments || 0) + 1 } };
      });
    } catch {}
  };

  const toggleLike = async (postId) => {
    try {
      const res = await likePost(postId);
      setPostStats((prev) => {
        const s = prev[postId] || { likes: 0, comments: 0, reposts: 0, liked: false };
        return { ...prev, [postId]: { ...s, likes: res.data.likes, liked: res.data.liked } };
      });
    } catch (e) {
      showToast('Failed to like post.', 'error');
    }
  };

  // Repost feature removed per request

  const handleShare = async (postId) => {
    try {
      const url = `${window.location.origin}/post/${postId}`;
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard.', 'success');
    } catch {
      showToast('Could not copy link.', 'error');
    }
  };

  useEffect(() => {
    const loadPostsForScope = (scope) => {
      if (scope === 'me') {
        return getMyPosts();
      }
      return getFeedPosts();
    };

    const fetchOnce = async () => {
      try {
        const [postsRes, savedRes, storiesRes] = await Promise.all([
          loadPostsForScope(filterScope),
          getSavedPosts(),
          getDashboardStories(),
        ]);
        setPosts(postsRes.data);
        setSavedIds(new Set(savedRes.data.map((p) => p._id)));
        setStories(storiesRes.data);
        // prefetch stats for the first few posts to avoid jank
        const firstFew = postsRes.data.slice(0, 6);
        firstFew.forEach(async (p) => {
          try {
            const st = await getPostStats(p._id);
            setPostStats((prev) => ({ ...prev, [p._id]: st.data }));
          } catch {}
        });
      } catch (err) {
        // ignore for now
      }
    };

    const pollFeed = async () => {
      try {
        const [postsRes, storiesRes] = await Promise.all([
          loadPostsForScope(filterScope),
          getDashboardStories(),
        ]);
        setPosts(postsRes.data);
        setStories(storiesRes.data);
      } catch {
        // ignore
      }
    };

    fetchOnce();
    const id = setInterval(pollFeed, 4000);
    return () => clearInterval(id);
  }, [filterScope]);

  useEffect(() => {
    const quotes = [
      'Write it on your heart that every day is the best day in the year.',
      'Small steps every day add up to big changes.',
      'Your future is created by what you do today, not tomorrow.',
      'Be the reason someone smiles today.',
      'Progress, not perfection.',
    ];

    const updateGreeting = () => {
      const now = new Date();
      const hours = now.getHours();
      let title = 'Good Evening';
      if (hours < 12) {
        title = 'Good Morning';
      } else if (hours < 18) {
        title = 'Good Afternoon';
      }

      const dateStr = now.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });

      const dayIndex = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
      const quote = quotes[dayIndex % quotes.length];

      const namePart = currentUserName || 'Friend';
      setGreetingTitle(`${title}, ${namePart}`);
      setGreetingQuote(quote);
      setGreetingDate(dateStr);
    };

    updateGreeting();
    const id = setInterval(updateGreeting, 60 * 1000);
    return () => clearInterval(id);
  }, [currentUserName]);

  const handleComposerMediaChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setComposerMediaUrl('');
      setComposerMediaFileName('');
      return;
    }

    if (composerType === 'Video') {
      if (file.size > MAX_VIDEO_BYTES) {
        setComposerMediaUrl('');
        setComposerMediaFileName('');
        e.target.value = '';
        showToast('Video is too large. Please upload a video under 4MB.', 'error');
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        const duration = video.duration || 0;
        if (duration > 15) {
          setComposerMediaUrl('');
          setComposerMediaFileName('');
          if (typeof e.target !== 'undefined') {
            e.target.value = '';
          }
          showToast('Please upload a video of 15 seconds or less.', 'error');
          return;
        }

        setComposerMediaFileName(file.name);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setComposerMediaUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      };
      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        showToast('Could not read video file.', 'error');
      };
      video.src = objectUrl;
      return;
    }

    setComposerMediaFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setComposerMediaUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleComposerSubmit = async (e) => {
    e.preventDefault();
    const text = composerText.trim();
    if (!text || composerSubmitting) return;
    setComposerSubmitting(true);
    try {
      const mappedType = composerType === 'Feeling' ? 'Text' : composerType;
      const payload = {
        type: mappedType,
        text,
      };
      if (composerType === 'Image' || composerType === 'Video') {
        payload.mediaUrl = composerMediaUrl || undefined;
      }

      const res = await createPost(payload);
      // Optimistically prepend new post into feed
      setPosts((prev) => [
        {
          _id: res.data._id,
          author: res.data.author,
          type: res.data.type,
          text: res.data.text,
          mediaUrl: res.data.mediaUrl,
          createdAt: res.data.createdAt,
          relativeTime: 'Today',
        },
        ...prev,
      ]);
      setComposerText('');
      setComposerType('Text');
      setComposerMediaUrl('');
      setComposerMediaFileName('');
      showToast('Post created.', 'success');
    } catch (err) {
      showToast('Failed to create post.', 'error');
    } finally {
      setComposerSubmitting(false);
    }
  };

  const recent = posts.slice(0, 4);

  const isVideoUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    if (url.startsWith('data:video')) return true;
    return /\.(mp4|webm|ogg)$/i.test(url);
  };

  return (
    <div className={styles.page}>
      {/* Center feed column */}
      <div className={styles.feedColumn}>
        {/* Stories */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Stories</span>
            <span className={styles.badge}>New</span>
          </div>
          <div className={styles.storiesRow}>
            <div
              className={styles.storyCard}
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('openStoryModal'));
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.storyEmoji}>🧑🏻</div>
              <div className={styles.storyPlus}>+</div>
            </div>
            {stories.map((s, idx) => {
              const isVideo = isVideoUrl(s.mediaUrl);
              const created = s.createdAt ? new Date(s.createdAt).getTime() : Date.now();
              const expiresAt = created + 24 * 60 * 60 * 1000;
              const remainingMs = Math.max(0, expiresAt - Date.now());
              const pctLeft = Math.max(0, Math.min(100, (remainingMs / (24 * 60 * 60 * 1000)) * 100));
              return (
                <div
                  key={s._id}
                  className={styles.storyCard}
                  onClick={() => {
                    setStoryViewerItems(stories);
                    setStoryViewerIndex(idx);
                    setStoryViewerOpen(true);
                  }}
                >
                  <div className={styles.storyThumb}>
                    {s.mediaUrl ? (
                      isVideo ? (
                        <video src={s.mediaUrl} muted playsInline />
                      ) : (
                        <img src={s.mediaUrl} alt="Story" />
                      )
                    ) : (
                      <span className={styles.storyEmoji}>📷</span>
                    )}
                  </div>
                  <div className={styles.storyProgress}>
                    <div
                      className={styles.storyProgressFill}
                      style={{ width: `${pctLeft}%` }}
                    />
                  </div>
                  <div className={styles.storyLabel}>{s.author}</div>
                </div>
              );
            })}
            {stories.length === 0 && (
              <div className={styles.updateMeta}>
                No stories yet. Create an Image/Video/Profile post to appear here.
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <form className={styles.card} onSubmit={handleComposerSubmit}>
          <div className={styles.composerInput}>
            <div className={styles.composerAvatar}>😊</div>
            <input
              className={styles.composerField}
              placeholder="What is on your mind? #Hashtag... @Mention... Link..."
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              disabled={composerSubmitting}
            />
          </div>
          <div className={styles.composerActions}>
            <button
              type="button"
              className={`${styles.chip} ${composerType === 'Image' ? styles.chipActive : ''}`}
              onClick={() => setComposerType('Image')}
            >
              <i className="fas fa-image" /> Photo
            </button>
            <button
              type="button"
              className={`${styles.chip} ${composerType === 'Video' ? styles.chipActive : ''}`}
              onClick={() => setComposerType('Video')}
            >
              <i className="fas fa-video" /> Video
            </button>
            <button
              type="button"
              className={`${styles.chip} ${composerType === 'Feeling' ? styles.chipActive : ''}`}
              onClick={() => setComposerType('Feeling')}
            >
              <i className="fas fa-smile" /> Feeling
            </button>
            <button
              type="submit"
              className={styles.postButton}
              disabled={composerSubmitting || !composerText.trim()}
            >
              {composerSubmitting ? 'Posting…' : 'Post'}
            </button>
          </div>
          {(composerType === 'Image' || composerType === 'Video') && (
            <div className={styles.composerMediaRow}>
              <div className={styles.fileInputWrapper}>
                <label className={styles.fileButton}>
                  <i className="fas fa-upload" />
                  <span>Choose file</span>
                  <input
                    type="file"
                    accept={composerType === 'Video' ? 'video/*' : 'image/*'}
                    onChange={handleComposerMediaChange}
                    className={styles.hiddenFileInput}
                  />
                </label>
                {composerMediaFileName && (
                  <span className={styles.fileNameText}>{composerMediaFileName}</span>
                )}
              </div>
            </div>
          )}
        </form>

        {/* Greeting card */}
        <div className={`${styles.card} ${styles.greetingCard}`}>
          <div className={styles.greetingIcon}>🌤️</div>
          <div>
            <div className={styles.greetingTextTitle}>{greetingTitle || `Hello, ${currentUserName || 'Friend'}`}</div>
            <div className={styles.greetingTextSub}>{greetingQuote}</div>
            {greetingDate && (
              <div className={styles.greetingTextDate}>{greetingDate}</div>
            )}
          </div>
        </div>

        {/* Recent updates */}
        <div className={styles.card}>
          <div className={styles.filterRow}>
            <span className={styles.cardTitle}>Recent Updates</span>
            <div className={styles.filterControls}>
              <select
                className={styles.filterSelect}
                value={filterScope}
                onChange={(e) => setFilterScope(e.target.value)}
              >
                <option value="all">All updates</option>
                <option value="me">My posts</option>
              </select>
              <button className={styles.iconButton}>
                <i className="fas fa-list" />
              </button>
            </div>
          </div>
          {recent.map((p) => {
            return (
              <div key={p._id} className={styles.updateItem}>
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
                  <div className={styles.postHeaderRow} style={{ position: 'relative' }}>
                  <div className={styles.updateTitle}>
                    <strong>{p.author || 'Someone'}</strong> shared a {p.type.toLowerCase()} post
                  </div>
                  <button
                    type="button"
                    className={styles.postMenuBtn}
                    title="More"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuFor((id) => (id === p._id ? null : p._id));
                    }}
                  >
                    ⋯
                  </button>
                  {openMenuFor === p._id && (
                    <div className={styles.postMenu} onClick={(e) => e.stopPropagation()}>
                      {p.isOwner && (
                        <button
                          type="button"
                          className={styles.postMenuItem}
                          onClick={async () => {
                            const nextText = window.prompt('Edit caption', p.text || '');
                            if (nextText == null) return;
                            try {
                              const res = await updatePost(p._id, { text: nextText });
                              setPosts((prev) => prev.map((post) => (post._id === p._id ? { ...post, text: res.data.text } : post)));
                              setOpenMenuFor(null);
                              showToast('Post updated.', 'success');
                            } catch (err) {
                              showToast('Failed to update post.', 'error');
                            }
                          }}
                        >
                          <i className="fas fa-pen" /> Edit
                        </button>
                      )}
                      {p.isOwner && (
                        <button
                          type="button"
                          className={styles.postMenuItem}
                          onClick={async () => {
                            if (!window.confirm('Delete this post?')) return;
                            try {
                              await deletePost(p._id);
                              setPosts((prev) => prev.filter((post) => post._id !== p._id));
                              setOpenMenuFor(null);
                              showToast('Post deleted.', 'success');
                            } catch (err) {
                              showToast('Failed to delete post.', 'error');
                            }
                          }}
                        >
                          <i className="fas fa-trash" /> Delete
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.postMenuItem}
                        onClick={() => {
                          setOpenMenuFor(null);
                          showToast('Thanks, this post was reported.', 'info');
                        }}
                      >
                        <i className="fas fa-flag" /> Report
                      </button>
                      <button
                        type="button"
                        className={styles.postMenuItem}
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(`${window.location.origin}/post/${p._id}`);
                            showToast('Link copied to clipboard.', 'success');
                          } catch {
                            showToast('Could not copy link.', 'error');
                          } finally {
                            setOpenMenuFor(null);
                          }
                        }}
                      >
                        <i className="fas fa-link" /> Copy link
                      </button>
                    </div>
                  )}
                  </div>
                  {p.text && (
                    <div className={styles.updateText}>
                      {p.text}
                    </div>
                  )}
                  {p.mediaUrl && (
                    <div
                      className={styles.updateMediaPreview}
                      onClick={() => setLightbox({ open: true, url: p.mediaUrl, isVideo: isVideoUrl(p.mediaUrl) })}
                    >
                      {isVideoUrl(p.mediaUrl) ? (
                        <video src={p.mediaUrl} muted playsInline />
                      ) : (
                        <img src={p.mediaUrl} alt="Post media" />
                      )}
                    </div>
                  )}
                  <div className={styles.updateFooterRow}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {p.mediaUrl && (
                        <span className={styles.updateMediaBadge}>
                          <i className="fas fa-image" /> Media
                        </span>
                      )}
                      <div className={styles.updateActions} onClick={(e) => e.stopPropagation()}>
                        {p.isOwner && (
                          <>
                            <button
                              type="button"
                              className={styles.updateActionBtn}
                              title="Edit caption"
                              onClick={async () => {
                                const nextText = window.prompt('Edit caption', p.text || '');
                                if (nextText == null) return;
                                try {
                                  const res = await updatePost(p._id, { text: nextText });
                                  setPosts((prev) =>
                                    prev.map((post) =>
                                      post._id === p._id ? { ...post, text: res.data.text } : post
                                    )
                                  );
                                  showToast('Post updated.', 'success');
                                } catch (err) {
                                  showToast('Failed to update post.', 'error');
                                }
                              }}
                            >
                              <i className="fas fa-pen" />
                            </button>
                            <button
                              type="button"
                              className={styles.updateActionBtn}
                              title="Delete post"
                              onClick={async () => {
                                if (!window.confirm('Delete this post?')) return;
                                try {
                                  await deletePost(p._id);
                                  setPosts((prev) => prev.filter((post) => post._id !== p._id));
                                  showToast('Post deleted.', 'success');
                                } catch (err) {
                                  showToast('Failed to delete post.', 'error');
                                }
                              }}
                            >
                              <i className="fas fa-trash" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          className={styles.updateActionBtn}
                          title={savedIds.has(p._id) ? 'Unsave' : 'Save'}
                          onClick={async () => {
                            try {
                              if (savedIds.has(p._id)) {
                                await unsavePost(p._id);
                                setSavedIds((prev) => {
                                  const copy = new Set(prev);
                                  copy.delete(p._id);
                                  return copy;
                                });
                                showToast('Post removed from saved.', 'info');
                              } else {
                                await savePost(p._id);
                                setSavedIds((prev) => new Set(prev).add(p._id));
                                showToast('Post saved.', 'success');
                              }
                            } catch (err) {
                              showToast('Failed to update saved posts.', 'error');
                            }
                          }}
                        >
                          <i className={savedIds.has(p._id) ? 'fas fa-bookmark' : 'far fa-bookmark'} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className={styles.interactionBar}>
                    <span className={styles.interactionMeta}>{p.relativeTime}</span>
                    <button
                      type="button"
                      className={styles.interactionBtn}
                      onClick={() => toggleLike(p._id)}
                      title="Like"
                    >
                      <i className={postStats[p._id]?.liked ? 'bi bi-heart-fill' : 'bi bi-heart'} style={{ color: postStats[p._id]?.liked ? '#ef4444' : undefined }} />
                      <span className={styles.interactionCount}>{postStats[p._id]?.likes ?? 0}</span>
                    </button>
                    <button
                      type="button"
                      className={styles.interactionBtn}
                      onClick={() => openComments(p._id)}
                      title="Comments"
                    >
                      <i className="bi bi-chat" />
                      <span className={styles.interactionCount}>{postStats[p._id]?.comments ?? 0}</span>
                    </button>
                    <button
                      type="button"
                      className={styles.interactionBtn}
                      onClick={() => handleShare(p._id)}
                      title="Share link"
                    >
                      <i className="bi bi-send" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {recent.length === 0 && (
            <div className={styles.updateMeta}>No updates yet. Start posting to see activity here.</div>
          )}
        </div>
      </div>
      {storyViewerOpen && (
        <StoryViewer
          stories={storyViewerItems}
          initialIndex={storyViewerIndex}
          onClose={() => setStoryViewerOpen(false)}
        />
      )}
      {lightbox.open && (
        <div className={styles.lightboxBackdrop} onClick={() => setLightbox({ open: false, url: '', isVideo: false })}>
          <div className={styles.lightboxModal} onClick={(e) => e.stopPropagation()}>
            {lightbox.isVideo ? (
              <video className={styles.lightboxMedia} src={lightbox.url} controls autoPlay />
            ) : (
              <img className={styles.lightboxMedia} src={lightbox.url} alt="Media" />
            )}
          </div>
          <button className={styles.lightboxClose} onClick={() => setLightbox({ open: false, url: '', isVideo: false })}>✕</button>
        </div>
      )}
      {commentsOpenFor && (
        <div className={styles.commentsBackdrop} onClick={() => setCommentsOpenFor(null)}>
          <div className={styles.commentsModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.commentsHeader}>Comments</div>
            <div className={styles.commentsBody}>
              {commentsList.map((c) => (
                <div key={c._id} className={styles.commentRow}>
                  <strong>{c.author}</strong>
                  <div>{c.text}</div>
                </div>
              ))}
              {commentsList.length === 0 && (
                <div className={styles.updateMeta}>No comments yet.</div>
              )}
            </div>
            <div className={styles.commentsFooter}>
              <input
                className={styles.commentsInput}
                placeholder="Write a comment"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
              />
              <button className={styles.commentsSend} onClick={handleAddComment}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
