import React, { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';
import {
  getMarketplaceItems,
  createMarketplaceItem,
  toggleInterestedItem,
} from '../services/marketplace';
import { useToast } from '../components/ToastContext.jsx';

const Marketplace = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('General');
  const [condition, setCondition] = useState('Used');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMarketplaceItems();
      setItems(res.data);
    } catch (err) {
      setItems([]);
      const msg = 'Failed to load marketplace items';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const numericPrice = Number(price);
    if (!trimmedTitle || !price || Number.isNaN(numericPrice) || creating) return;

    setCreating(true);
    try {
      const res = await createMarketplaceItem({
        title: trimmedTitle,
        price: numericPrice,
        category,
        condition,
        description,
      });
      setItems((prev) => [
        {
          _id: res.data._id,
          title: res.data.title,
          price: res.data.price,
          category: res.data.category,
          condition: res.data.condition,
          description: res.data.description,
          interestedCount: (res.data.interested || []).length,
          isOwner: true,
          isInterested: false,
          ownerName: 'You',
          ownerUsername: null,
        },
        ...prev,
      ]);
      setTitle('');
      setPrice('');
      setCategory('General');
      setCondition('Used');
      setDescription('');
      showToast('Item listed in marketplace.', 'success');
    } catch (err) {
      showToast('Failed to list item.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleInterested = async (id) => {
    try {
      const res = await toggleInterestedItem(id);
      setItems((prev) =>
        prev.map((i) =>
          i._id === id
            ? {
                ...i,
                interestedCount: res.data.interestedCount,
                isInterested: res.data.isInterested,
              }
            : i
        )
      );
    } catch (err) {
      showToast('Failed to update interest.', 'error');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.feedColumn}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Marketplace</span>
            <span className={styles.badge}>Buy & sell</span>
          </div>

          {/* Create Item form */}
          <form onSubmit={handleCreate} className={styles.composerInput}>
            <div className={styles.composerAvatar}>🛒</div>
            <input
              className={styles.composerField}
              placeholder="List an item (title)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </form>
          <div className={styles.composerActions}>
            <input
              type="number"
              className={styles.composerField}
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <select
              className={styles.filterSelect}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="General">General</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Home">Home</option>
            </select>
            <select
              className={styles.filterSelect}
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              <option value="New">New</option>
              <option value="Used">Used</option>
            </select>
            <button
              type="button"
              className={styles.friendButton}
              onClick={handleCreate}
              disabled={
                creating || !title.trim() || !price || Number.isNaN(Number(price))
              }
            >
              {creating ? 'Listing…' : 'List Item'}
            </button>
          </div>
          <textarea
            className={styles.pagesTextarea}
            rows={2}
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {loading && <div className={styles.updateMeta}>Loading marketplace...</div>}
          {error && <div className={styles.updateMeta}>{error}</div>}

          {!loading && !error && items.length === 0 && (
            <div className={styles.updateMeta}>
              No items yet. Be the first to list something.
            </div>
          )}

          {!loading &&
            items.map((i) => (
              <div key={i._id} className={styles.updateItem}>
                <div className={styles.updateAvatar}>
                  <span className={styles.avatarInitial}>
                    {(i.title || '').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className={styles.updateBody}>
                  <div className={styles.updateTitle}>{i.title}</div>
                  <div className={styles.updateText}>
                    ${i.price} · {i.category} · {i.condition}
                  </div>
                  {i.description && (
                    <div className={styles.updateText}>{i.description}</div>
                  )}
                  <div className={styles.updateMeta}>
                    {i.interestedCount} interested
                    {i.ownerName && (
                      <span>
                        {` · Posted by ${i.ownerName}`}
                        {i.ownerUsername ? ` (@${i.ownerUsername})` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.friendButton}
                  onClick={() => handleToggleInterested(i._id)}
                >
                  {i.isInterested ? 'Interested' : 'I\'m interested'}
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
