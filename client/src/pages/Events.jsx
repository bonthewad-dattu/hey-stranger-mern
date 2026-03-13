import React, { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';
import { getEvents, createEvent, toggleGoingEvent } from '../services/events';
import { useToast } from '../components/ToastContext.jsx';

const Events = () => {
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getEvents();
      setEvents(res.data);
    } catch (err) {
      setEvents([]);
      const msg = 'Failed to load events';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || creating || !date) return;

    const isoDate = new Date(`${date}T${time || '00:00'}:00Z`).toISOString();

    setCreating(true);
    try {
      const res = await createEvent({
        title: trimmedTitle,
        date: isoDate,
        location,
        description,
      });
      setEvents((prev) => [
        {
          _id: res.data._id,
          title: res.data.title,
          date: res.data.date,
          location: res.data.location,
          description: res.data.description,
          goingCount: (res.data.going || []).length,
          isOwner: true,
          isGoing: true,
          ownerName: 'You',
          ownerUsername: null,
        },
        ...prev,
      ]);
      setTitle('');
      setDate('');
      setTime('');
      setLocation('');
      setDescription('');
      showToast('Event created.', 'success');
    } catch (err) {
      showToast('Failed to create event.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleGoing = async (id) => {
    try {
      const res = await toggleGoingEvent(id);
      setEvents((prev) =>
        prev.map((ev) =>
          ev._id === id
            ? { ...ev, goingCount: res.data.goingCount, isGoing: res.data.isGoing }
            : ev
        )
      );
    } catch (err) {
      showToast('Failed to update event attendance.', 'error');
    }
  };

  const formatDate = (value) => {
    if (!value) return '';
    try {
      const d = new Date(value);
      return d.toLocaleString();
    } catch (e) {
      return value;
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.feedColumn}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Events</span>
            <span className={styles.badge}>Plan & attend</span>
          </div>

          {/* Create Event form */}
          <form onSubmit={handleCreate} className={styles.composerInput}>
            <div className={styles.composerAvatar}>📅</div>
            <input
              className={styles.composerField}
              placeholder="Create a new event (title)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </form>
          <div className={styles.composerActions}>
            <input
              type="date"
              className={styles.composerField}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <input
              type="time"
              className={styles.composerField}
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <button
              type="button"
              className={styles.friendButton}
              onClick={handleCreate}
              disabled={creating || !title.trim() || !date}
            >
              {creating ? 'Creating…' : 'Create Event'}
            </button>
          </div>
          <input
            className={styles.composerField}
            placeholder="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <textarea
            className={styles.pagesTextarea}
            rows={2}
            placeholder="Short description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {loading && <div className={styles.updateMeta}>Loading events...</div>}
          {error && <div className={styles.updateMeta}>{error}</div>}

          {!loading && !error && events.length === 0 && (
            <div className={styles.updateMeta}>
              No events yet. Create one to organize something new.
            </div>
          )}

          {!loading &&
            events.map((ev) => (
              <div key={ev._id} className={styles.updateItem}>
                <div className={styles.updateAvatar}>
                  <span className={styles.avatarInitial}>
                    {(ev.title || '').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className={styles.updateBody}>
                  <div className={styles.updateTitle}>{ev.title}</div>
                  <div className={styles.updateText}>
                    {formatDate(ev.date)}{ev.location ? ` · ${ev.location}` : ''}
                  </div>
                  {ev.description && (
                    <div className={styles.updateText}>{ev.description}</div>
                  )}
                  <div className={styles.updateMeta}>
                    {ev.goingCount} going
                    {ev.ownerName && (
                      <span>
                        {` · Posted by ${ev.ownerName}`}
                        {ev.ownerUsername ? ` (@${ev.ownerUsername})` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.friendButton}
                  onClick={() => handleToggleGoing(ev._id)}
                >
                  {ev.isGoing ? 'Going' : "I'm going"}
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Events;
