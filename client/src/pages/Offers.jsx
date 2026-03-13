import React, { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';
import { getOffers, createOffer, toggleClaimOffer } from '../services/offers';
import { useToast } from '../components/ToastContext.jsx';

const Offers = () => {
  const { showToast } = useToast();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [creating, setCreating] = useState(false);

  const loadOffers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getOffers();
      setOffers(res.data);
    } catch (err) {
      setOffers([]);
      const msg = 'Failed to load offers';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedDetails = details.trim();
    if (!trimmedTitle || creating) return;

    setCreating(true);
    try {
      const res = await createOffer({
        title: trimmedTitle,
        details: trimmedDetails,
        expiresAt: expiresAt || undefined,
      });
      setOffers((prev) => [
        {
          _id: res.data._id,
          title: res.data.title,
          details: res.data.details,
          expiresAt: res.data.expiresAt,
          claimedCount: (res.data.claimedBy || []).length,
          isOwner: true,
          isClaimed: false,
          ownerName: 'You',
          ownerUsername: null,
        },
        ...prev,
      ]);
      setTitle('');
      setDetails('');
      setExpiresAt('');
      showToast('Offer created.', 'success');
    } catch (err) {
      showToast('Failed to create offer.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleClaim = async (id) => {
    try {
      const res = await toggleClaimOffer(id);
      setOffers((prev) =>
        prev.map((o) =>
          o._id === id
            ? { ...o, claimedCount: res.data.claimedCount, isClaimed: res.data.isClaimed }
            : o
        )
      );
    } catch (err) {
      showToast('Failed to update offer claim.', 'error');
    }
  };

  const formatDate = (value) => {
    if (!value) return 'No expiry';
    try {
      const d = new Date(value);
      return d.toLocaleDateString();
    } catch (e) {
      return value;
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.feedColumn}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Offers</span>
            <span className={styles.badge}>Special deals</span>
          </div>

          {/* Create Offer form */}
          <form onSubmit={handleCreate} className={styles.composerInput}>
            <div className={styles.composerAvatar}>🎁</div>
            <input
              className={styles.composerField}
              placeholder="Create a new offer (title)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </form>
          <textarea
            className={styles.pagesTextarea}
            rows={2}
            placeholder="Details (optional)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
          <div className={styles.composerActions}>
            <input
              type="date"
              className={styles.composerField}
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <button
              type="button"
              className={styles.friendButton}
              onClick={handleCreate}
              disabled={creating || !title.trim()}
            >
              {creating ? 'Creating…' : 'Create Offer'}
            </button>
          </div>

          {loading && <div className={styles.updateMeta}>Loading offers...</div>}
          {error && <div className={styles.updateMeta}>{error}</div>}

          {!loading && !error && offers.length === 0 && (
            <div className={styles.updateMeta}>
              No offers yet. Create one to share with others.
            </div>
          )}

          {!loading &&
            offers.map((o) => (
              <div key={o._id} className={styles.updateItem}>
                <div className={styles.updateAvatar}>
                  <span className={styles.avatarInitial}>
                    {(o.title || '').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className={styles.updateBody}>
                  <div className={styles.updateTitle}>{o.title}</div>
                  {o.details && (
                    <div className={styles.updateText}>{o.details}</div>
                  )}
                  <div className={styles.updateMeta}>
                    Expires: {formatDate(o.expiresAt)} · {o.claimedCount} claimed
                    {o.ownerName && (
                      <span>
                        {` · Posted by ${o.ownerName}`}
                        {o.ownerUsername ? ` (@${o.ownerUsername})` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.friendButton}
                  onClick={() => handleToggleClaim(o._id)}
                >
                  {o.isClaimed ? 'Claimed' : 'Claim'}
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Offers;
