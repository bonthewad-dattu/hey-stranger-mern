import React, { useEffect, useRef, useState } from 'react';
import { getConversations, getMessagesWith, sendMessage } from '../services/messages';
import { searchUsers } from '../services/users';
import { useToast } from '../components/ToastContext.jsx';
import styles from './Dashboard.module.css';

const Inbox = () => {
  const { showToast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const chatBoxRef = useRef(null);

  // mobile responsiveness: show either list or chat on small screens
  const [isMobile, setIsMobile] = useState(false);
  const [showList, setShowList] = useState(true);

  const emojiList = ['😂','😢','👍','❤️'];

  const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

  const formatLastSeen = (iso) => {
    if (!iso) return 'Offline';
    const t = new Date(iso).getTime();
    const diff = Date.now() - t;
    if (diff < ONLINE_THRESHOLD_MS) return 'Online';
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `Last seen ${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Last seen ${hours} hr ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `Last seen ${days} day${days>1?'s':''} ago`;
    const weeks = Math.floor(days / 7);
    return `Last seen ${weeks} week${weeks>1?'s':''} ago`;
  };

  const isOnline = (iso) => {
    if (!iso) return false;
    return Date.now() - new Date(iso).getTime() < ONLINE_THRESHOLD_MS;
  };

  const handleAddEmoji = (emoji) => {
    setChatInput((prev) => `${prev}${emoji}`);
  };

  useEffect(() => {
    // detect viewport for responsive behavior
    const mq = window.matchMedia('(max-width: 900px)');
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // keep list/chat visibility in sync with viewport and selection
  useEffect(() => {
    if (isMobile) {
      setShowList(!activeChatUser);
    } else {
      setShowList(true);
    }
  }, [isMobile, activeChatUser]);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setError('');
        const res = await getConversations();
        setConversations(res.data);
        if (res.data.length > 0) {
          setActiveChatUser(res.data[0].user);
        }
      } catch (err) {
        setConversations([]);
        const msg = 'Failed to load conversations';
        setError(msg);
        showToast(msg, 'error');
      } finally {
        setConversationsLoading(false);
      }
    };
    loadConversations();
    const id = setInterval(loadConversations, 30000);
    return () => clearInterval(id);
  }, []);

  const loadMessages = async (userId) => {
    if (!userId) return;
    setChatLoading(true);
    try {
      const res = await getMessagesWith(userId);
      setChatMessages(res.data);
    } catch (err) {
      setChatMessages([]);
      const msg = 'Failed to load messages';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (!activeChatUser) return;
    // Load messages once when a conversation is opened/switched.
    // We no longer poll every few seconds to avoid the blinking effect.
    loadMessages(activeChatUser._id);
  }, [activeChatUser]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (!chatBoxRef.current) return;
    chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [chatMessages, activeChatUser]);

  const handleSelectConversation = (user) => {
    setActiveChatUser(user);
    if (isMobile) setShowList(false);
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await searchUsers(q);
      setSearchResults(res.data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleStartChatWith = (user) => {
    setActiveChatUser(user);
    setSearchResults([]);
    setSearchTerm('');
    if (isMobile) setShowList(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!activeChatUser || !chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    try {
      const res = await sendMessage(activeChatUser._id, text);
      setChatMessages((prev) => [...prev, res.data]);
      // Ensure conversation exists/updates in sidebar
      setConversations((prev) => {
        const existing = prev.find((c) => c.user._id === activeChatUser._id);
        const updated = {
          user: activeChatUser,
          lastMessageAt: res.data.createdAt || new Date().toISOString(),
        };
        if (!existing) {
          return [updated, ...prev];
        }
        return prev
          .map((c) => (c.user._id === activeChatUser._id ? updated : c))
          .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      });
      showToast('Message sent.', 'success');
    } catch {
      showToast('Failed to send message.', 'error');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.feedColumn}>
        <div className={styles.card}>
          <div className={styles.filterRow}>
            <span className={styles.cardTitle}>Inbox</span>
          </div>
          {error && <div className={styles.updateMeta}>{error}</div>}
          <div className={styles.chatLayout}>
            <div className={`${styles.chatSidebar} ${isMobile && !showList ? styles.chatSidebarMobileHidden : ''}`}>
              <form onSubmit={handleSearchSubmit} style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Search users to chat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.input}
                />
              </form>
              <div className={styles.modalLabel}>Conversations</div>
              {conversationsLoading && <div className={styles.updateMeta}>Loading...</div>}
              {!conversationsLoading && conversations.length === 0 && (
                <div className={styles.updateMeta}>No conversations yet. Start a new chat above.</div>
              )}
              {!conversationsLoading && conversations.map((c) => (
                <button
                  key={c.user._id}
                  type="button"
                  className={`${styles.chatUserRow} ${
                    activeChatUser && activeChatUser._id === c.user._id ? styles.chatUserRowActive : ''
                  }`}
                  onClick={() => handleSelectConversation(c.user)}
                >
                  <span className={styles.updateAvatar} style={{ marginRight: 8, position: 'relative' }}>
                    {c.user.avatarUrl ? (
                      <img
                        src={c.user.avatarUrl}
                        alt={c.user.name}
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      (c.user.name || c.user.username || 'U').charAt(0).toUpperCase()
                    )}
                    <span
                      className={`${styles.statusDot} ${isOnline(c.user.lastActiveAt) ? styles.statusOnline : styles.statusOffline}`}
                      title={formatLastSeen(c.user.lastActiveAt)}
                    />
                  </span>
                  <div>
                    <div className={styles.chatUserName}>{c.user.name}</div>
                    <div className={styles.chatUserUsername}>
                      @{c.user.username} · {formatLastSeen(c.user.lastActiveAt)}
                    </div>
                  </div>
                </button>
              ))}
              {searchLoading && <div className={styles.updateMeta}>Searching...</div>}
              {!searchLoading && searchResults.map((u) => (
                <button
                  key={u._id}
                  type="button"
                  className={styles.chatUserRow}
                  onClick={() => handleStartChatWith(u)}
                >
                  <span className={styles.updateAvatar} style={{ marginRight: 8 }}>
                    {u.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt={u.name}
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      (u.name || u.username || 'U').charAt(0).toUpperCase()
                    )}
                  </span>
                  <div>
                    <div className={styles.chatUserName}>{u.name}</div>
                    <div className={styles.chatUserUsername}>@{u.username}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className={`${styles.chatMain} ${isMobile && showList ? styles.chatMainMobileHidden : ''}`}>
              {!activeChatUser && (
                <div className={styles.updateMeta}>
                  Select a conversation on the left or search for a user to start chatting.
                </div>
              )}
              {activeChatUser && (
                <>
                  <div className={styles.chatHeaderRow}>
                    {isMobile && (
                      <button
                        type="button"
                        className={styles.chatBackBtn}
                        onClick={() => setShowList(true)}
                        title="Back to chats"
                      >
                        ← Chats
                      </button>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={styles.updateAvatar} style={{ position: 'relative' }}>
                        {activeChatUser.avatarUrl ? (
                          <img
                            src={activeChatUser.avatarUrl}
                            alt={activeChatUser.name}
                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          (activeChatUser.name || activeChatUser.username || 'U').charAt(0).toUpperCase()
                        )}
                        <span
                          className={`${styles.statusDot} ${isOnline(activeChatUser.lastActiveAt) ? styles.statusOnline : styles.statusOffline}`}
                          title={formatLastSeen(activeChatUser.lastActiveAt)}
                        />
                      </span>
                      <div>
                        <div className={styles.chatUserName}>{activeChatUser.name}</div>
                        <div className={styles.chatUserUsername}>
                          @{activeChatUser.username} · {formatLastSeen(activeChatUser.lastActiveAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.chatMessagesBox} ref={chatBoxRef}>
                    {chatLoading && <div className={styles.updateMeta}>Loading messages...</div>}
                    {!chatLoading &&
                      chatMessages.map((m) => (
                        <div
                          key={m._id}
                          className={`${styles.chatBubble} ${
                            m.from === activeChatUser._id ? styles.chatBubbleOther : styles.chatBubbleMe
                          }`}
                        >
                          {m.text}
                        </div>
                      ))}
                    {!chatLoading && chatMessages.length === 0 && (
                      <div className={styles.updateMeta}>No messages yet. Say hi!</div>
                    )}
                  </div>
                  <form className={styles.chatInputRow} onSubmit={handleSendMessage}>
                    <input
                      type="text"
                      placeholder="Write a message"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                    />
                    <div className={styles.chatIcons}>
                      {emojiList.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className={styles.chatIconBtn}
                          onClick={() => handleAddEmoji(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <button type="submit" className={styles.chatSendButton}>
                      Send
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inbox;
