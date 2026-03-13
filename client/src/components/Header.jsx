import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import { useToast } from './ToastContext.jsx';
import { searchUsers } from '../services/users';
import { createPost } from '../services/posts';
import {
  getFriendSuggestions,
  getIncomingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
} from '../services/friends';
import { getConversations, getMessagesWith, sendMessage } from '../services/messages';
import { getNotificationSummary } from '../services/notifications';
import { useCurrentUser } from './CurrentUserContext.jsx';

const Header = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useCurrentUser() || {};
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postType, setPostType] = useState('Text');
  const [postText, setPostText] = useState('');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [postMediaFileName, setPostMediaFileName] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postIsStory, setPostIsStory] = useState(false);
  const [friendsModalOpen, setFriendsModalOpen] = useState(false);
  const [friendSuggestions, setFriendSuggestions] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [notifications, setNotifications] = useState({ pendingRequests: 0, unreadMessages: 0, total: 0 });
  const [notificationsCleared, setNotificationsCleared] = useState(false);
  const MAX_VIDEO_BYTES = 7 * 1024 * 1024; // ~7MB client-side safety limit

  const handlePostMediaChange = (e, currentType) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPostMediaUrl('');
      setPostMediaFileName('');
      return;
    }

    if (currentType === 'Video') {
      if (file.size > MAX_VIDEO_BYTES) {
        setPostMediaUrl('');
        setPostMediaFileName('');
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
          setPostMediaUrl('');
          setPostMediaFileName('');
          e.target.value = '';
          showToast('Please upload a video of 15 seconds or less.', 'error');
          return;
        }

        setPostMediaFileName(file.name);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setPostMediaUrl(reader.result);
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

    setPostMediaFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setPostMediaUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    navigate('/login');
    showToast('You have been logged out.', 'info');
  };

  // Poll notification summary for navbar badge ("real-time" feel)
  useEffect(() => {
    if (notificationsCleared) {
      return undefined;
    }

    const loadSummary = async () => {
      try {
        const res = await getNotificationSummary();
        setNotifications(res.data);
      } catch (err) {
        // ignore errors for now
      }
    };

    loadSummary();
    const id = setInterval(loadSummary, 5000);
    return () => clearInterval(id);
  }, [notificationsCleared]);

  // Allow other components (e.g., Dashboard stories card) to open the same post modal
  useEffect(() => {
    const handler = () => {
      setPostIsStory(false);
      setPostModalOpen(true);
    };
    const storyHandler = () => {
      setPostIsStory(true);
      setPostType('Image');
      setPostModalOpen(true);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('openPostModal', handler);
      window.addEventListener('openStoryModal', storyHandler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('openPostModal', handler);
        window.removeEventListener('openStoryModal', storyHandler);
      }
    };
  }, []);

  const handleNotificationsClick = () => {
    // Clear badge immediately when user clicks the bell
    setNotifications({ pendingRequests: 0, unreadMessages: 0, total: 0 });
    setNotificationsCleared(true);
    navigate('/notifications');
  };

  // Inbox chat has its own full page now, so navbar just links to /inbox

  const openFriendsModal = async () => {
    setFriendsModalOpen(true);
    setFriendsLoading(true);
    try {
      const [sugRes, reqRes] = await Promise.all([
        getFriendSuggestions(),
        getIncomingRequests(),
      ]);
      setFriendSuggestions(sugRes.data);
      setIncomingRequests(reqRes.data);
    } catch (err) {
      setFriendSuggestions([]);
      setIncomingRequests([]);
    } finally {
      setFriendsLoading(false);
    }
  };

  const closeFriendsModal = () => {
    setFriendsModalOpen(false);
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      await sendFriendRequest(userId);
      setFriendSuggestions((prev) => prev.filter((u) => u._id !== userId));
      showToast('Friend request sent.', 'success');
    } catch (err) {
      // ignore for now
      showToast('Failed to send friend request.', 'error');
    }
  };

  const handleRespondRequest = async (id, action) => {
    try {
      if (action === 'accept') {
        await acceptFriendRequest(id);
        showToast('Friend request accepted.', 'success');
      } else {
        await declineFriendRequest(id);
        showToast('Friend request declined.', 'info');
      }
      setIncomingRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      // ignore for now
      showToast('Could not update friend request.', 'error');
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await searchUsers(q);
      setSearchResults(res.data);
      setSearchOpen(true);
    } catch (err) {
      setSearchResults([]);
      setSearchOpen(false);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectUser = (username) => {
    setSearchOpen(false);
    setSearchResults([]);
    setSearchTerm('');
    navigate(`/user/${username}`);
  };

  const handleOpenPostModal = () => {
    setPostModalOpen(true);
  };

  const handleClosePostModal = () => {
    if (postSubmitting) return;
    setPostModalOpen(false);
    setPostType('Text');
    setPostText('');
    setPostMediaUrl('');
    setPostMediaFileName('');
    setPostIsStory(false);
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    setPostSubmitting(true);
    try {
      await createPost({ type: postType, text: postText, mediaUrl: postMediaUrl || undefined, isStory: postIsStory });
      handleClosePostModal();
      showToast(postIsStory ? 'Story created.' : 'Post created.', 'success');
    } catch (err) {
      // Could add toast later
      showToast(postIsStory ? 'Failed to create story.' : 'Failed to create post.', 'error');
    } finally {
      setPostSubmitting(false);
    }
  };

  const handleLogoClick = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.hamburgerBtn}
        onClick={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('toggleSidebar'));
          }
        }}
        aria-label="Toggle menu"
      >
        <i className="bi bi-list" />
      </button>
      <h2 className={styles.logo} onClick={handleLogoClick}>Hey Stranger!</h2>
      <form className={styles.searchContainer} onSubmit={handleSearchSubmit}>
        <input
          type="text"
          className={styles.searchBar}
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit" className={styles.searchButton}>
          <i className={`fas fa-search ${styles.searchIcon}`}></i>
        </button>
        {searchOpen && (
          <div className={styles.searchResults}>
            {searchLoading && <div className={styles.searchItem}>Searching...</div>}
            {!searchLoading && searchResults.length === 0 && (
              <div className={styles.searchItem}>No users found</div>
            )}
            {!searchLoading &&
              searchResults.map((u) => (
                <button
                  key={u._id}
                  type="button"
                  className={styles.searchItem}
                  onClick={() => handleSelectUser(u.username)}
                >
                  <span className={styles.searchItemName}>{u.name}</span>
                  <span className={styles.searchItemUsername}>@{u.username}</span>
                </button>
              ))}
          </div>
        )}
      </form>
      <div className={styles.icons}>
        <button type="button" className={styles.postButton} onClick={handleOpenPostModal}>
          <i className="bi bi-patch-plus-fill" /> Post
        </button>
        <button
          type="button"
          className={styles.friendRequestButton}
          onClick={openFriendsModal}
        >
          <i className="bi bi-people-fill" /> Friend Requests
        </button>
        <button
          type="button"
          className={styles.inboxButton}
          onClick={() => navigate('/inbox')}
        >
          <i className="bi bi-chat-square-text" /> Inbox
        </button>
        <div
          className={styles.notificationIconContainer}
          onClick={handleNotificationsClick}
        >
          <i className={`bi bi-bell ${styles.notificationIcon}`} />
          {notifications.total > 0 && (
            <span className={styles.notificationCount}>{notifications.total}</span>
          )}
          <div className={styles.notificationDropdown}>
            <div className={styles.notificationItem}>
              Friend requests pending: {notifications.pendingRequests}
            </div>
            <div className={styles.notificationItem}>
              Unread messages: {notifications.unreadMessages}
            </div>
          </div>
        </div>
        <div className={styles.avatarWrapper}>
          <div
            className={styles.avatarCircle}
            onClick={() => navigate('/profile')}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || 'Me'}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              (user?.name || user?.username || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <div className={styles.avatarDropdown}>
            {/* <button type="button" onClick={() => navigate('/profile')}>
              <i className="fas fa-user" /> Profile
            </button> */}
            <button type="button" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt" /> Logout
            </button>
          </div>
        </div>
      </div>
      {postModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>{postIsStory ? 'Create Story' : 'Create Post'}</h3>
            <form onSubmit={handleSubmitPost} className={styles.modalForm}>
              <div className={styles.modalFieldRow}>
                <label className={styles.modalLabel}>Type</label>
                <select
                  className={styles.modalSelect}
                  value={postType}
                  onChange={(e) => setPostType(e.target.value)}
                >
                  <option value="Text">Text</option>
                  <option value="Image">Image</option>
                  <option value="Video">Video</option>
                  <option value="Profile Picture">Story / Profile Picture</option>
                </select>
              </div>
              <div className={styles.modalFieldRow}>
                <label className={styles.modalLabel}>
                  <input
                    type="checkbox"
                    checked={postIsStory}
                    onChange={(e) => setPostIsStory(e.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  Share to Stories (visible 24h only)
                </label>
              </div>
              <div className={styles.modalFieldRow}>
                <label className={styles.modalLabel}>Text</label>
                <textarea
                  className={styles.modalTextarea}
                  rows={3}
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="Share a thought, story, or update..."
                />
              </div>
              {(postType === 'Image' || postType === 'Video' || postType === 'Profile Picture') && (
                <div className={styles.modalFieldRow}>
                  <label className={styles.modalLabel}>Media</label>
                  <div className={styles.fileInputWrapper}>
                    <label className={styles.fileButton}>
                      <i className="fas fa-upload" />
                      <span>Choose file</span>
                      <input
                        type="file"
                        accept={postType === 'Video' ? 'video/*' : 'image/*'}
                        className={styles.hiddenFileInput}
                        onChange={(e) => handlePostMediaChange(e, postType)}
                      />
                    </label>
                    {postMediaFileName && (
                      <span className={styles.fileNameText}>Selected: {postMediaFileName}</span>
                    )}
                  </div>
                </div>
              )}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalCancel}
                  onClick={handleClosePostModal}
                  disabled={postSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.modalSubmit} disabled={postSubmitting}>
                  {postSubmitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {friendsModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Friend Requests</h3>
            {friendsLoading ? (
              <div className={styles.modalHint}>Loading...</div>
            ) : (
              <div className={styles.modalFriendsLayout}>
                <div className={styles.modalFriendsColumn}>
                  <div className={styles.modalLabel}>Suggestions</div>
                  {friendSuggestions.length === 0 && (
                    <div className={styles.modalHint}>No suggestions right now.</div>
                  )}
                  {friendSuggestions.map((u) => (
                    <div key={u._id} className={styles.modalFriendRow}>
                      <div>
                        <div className={styles.modalFriendName}>{u.name}</div>
                        <div className={styles.modalFriendUsername}>@{u.username}</div>
                      </div>
                      <button
                        type="button"
                        className={styles.modalSubmit}
                        onClick={() => handleSendFriendRequest(u._id)}
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
                <div className={styles.modalFriendsColumn}>
                  <div className={styles.modalLabel}>Incoming</div>
                  {incomingRequests.length === 0 && (
                    <div className={styles.modalHint}>No incoming requests.</div>
                  )}
                  {incomingRequests.map((r) => (
                    <div key={r._id} className={styles.modalFriendRow}>
                      <div>
                        <div className={styles.modalFriendName}>{r.from.name}</div>
                        <div className={styles.modalFriendUsername}>@{r.from.username}</div>
                      </div>
                      <div className={styles.modalFriendActions}>
                        <button
                          type="button"
                          className={styles.modalSubmit}
                          onClick={() => handleRespondRequest(r._id, 'accept')}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className={styles.modalCancel}
                          onClick={() => handleRespondRequest(r._id, 'decline')}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancel}
                onClick={closeFriendsModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
