import React, { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';
import { getGroups, createGroup, toggleJoinGroup } from '../services/groups';
import { useToast } from '../components/ToastContext.jsx';

const Groups = () => {
  const { showToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const loadGroups = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getGroups();
      setGroups(res.data);
    } catch (err) {
      setGroups([]);
      const msg = 'Failed to load groups';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      const res = await createGroup({ name: trimmed, topic, description });
      setGroups((prev) => [
        {
          _id: res.data._id,
          name: res.data.name,
          topic: res.data.topic,
          description: res.data.description,
          membersCount: (res.data.members || []).length,
          isOwner: true,
          isMember: true,
        },
        ...prev,
      ]);
      setName('');
      setTopic('');
      setDescription('');
      showToast('Group created.', 'success');
    } catch (err) {
      showToast('Failed to create group.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleJoin = async (id) => {
    try {
      const res = await toggleJoinGroup(id);
      setGroups((prev) =>
        prev.map((g) =>
          g._id === id
            ? { ...g, membersCount: res.data.membersCount, isMember: res.data.isMember }
            : g
        )
      );
      showToast('Group membership updated.', 'success');
    } catch (err) {
      showToast('Failed to update group membership.', 'error');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.feedColumn}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Groups</span>
            <span className={styles.badge}>Communities</span>
          </div>

          {/* Create Group form */}
          <form onSubmit={handleCreate} className={styles.composerInput}>
            <div className={styles.composerAvatar}>👥</div>
            <input
              className={styles.composerField}
              placeholder="Create a new group (name)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </form>
          <div className={styles.composerActions}>
            <div style={{ flex: 1 }}>
              <input
                className={styles.input}
                placeholder="Topic (e.g., Photography, Gaming)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <button
              type="button"
              className={styles.friendButton}
              onClick={handleCreate}
              disabled={creating || !name.trim()}
            >
              {creating ? 'Creating…' : 'Create Group'}
            </button>
          </div>
          <textarea
            className={styles.pagesTextarea}
            rows={2}
            placeholder="Short description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {loading && <div className={styles.updateMeta}>Loading groups...</div>}
          {error && <div className={styles.updateMeta}>{error}</div>}

          {!loading && !error && groups.length === 0 && (
            <div className={styles.updateMeta}>No groups yet. Create one to start a community.</div>
          )}

          {!loading &&
            groups.map((g) => (
              <div key={g._id} className={styles.updateItem}>
                <div className={styles.updateAvatar}>
                  <span className={styles.avatarInitial}>
                    {(g.name || '').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className={styles.updateBody}>
                  <div className={styles.updateTitle}>{g.name}</div>
                  <div className={styles.updateText}>
                    {g.topic || 'General'} · {g.membersCount} member{g.membersCount === 1 ? '' : 's'}
                  </div>
                  {g.description && (
                    <div className={styles.updateText}>{g.description}</div>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.friendButton}
                  onClick={() => handleToggleJoin(g._id)}
                >
                  {g.isMember ? 'Joined' : 'Join'}
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Groups;
