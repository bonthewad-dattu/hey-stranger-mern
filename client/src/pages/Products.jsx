import React, { useState } from 'react';
import styles from './Dashboard.module.css';

const placeholderProducts = [
  {
    id: 1,
    name: 'Ocean Blue Hoodie',
    description: 'Soft cotton hoodie inspired by the Hey Stranger! colors.',
    price: '₹399',
    tag: 'New',
    image: 'https://images.pexels.com/photos/6311666/pexels-photo-6311666.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 2,
    name: 'Minimalist Sneakers',
    description: 'Everyday sneakers with a clean, modern design.',
    price: '₹590',
    tag: 'Trending',
    image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 3,
    name: 'Desk Setup Bundle',
    description: 'Mouse pad, notebook and pen set for your workspace.',
    price: '₹245',
    tag: 'Bundle',
    image: 'https://images.pexels.com/photos/3746318/pexels-photo-3746318.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 4,
    name: 'Creative Mug',
    description: 'Ceramic mug for coffee, tea and late-night coding.',
    price: '₹149',
    tag: 'Limited',
    image: 'https://images.pexels.com/photos/585750/pexels-photo-585750.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 5,
    name: 'Leather Backpack',
    description: 'Premium leather backpack for everyday use.',
    price: '₹1199',
    tag: 'Premium',
    image: 'https://images.pexels.com/photos/1420701/pexels-photo-1420701.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 6,
    name: 'Wireless Headphones',
    description: 'Noise-cancelling headphones with high-quality sound.',
    price: '₹899',
    tag: 'Hot',
    image: 'https://images.pexels.com/photos/374703/pexels-photo-374703.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 7,
    name: 'Smart Watch Lite',
    description: 'Tracks your health and daily activities.',
    price: '₹699',
    tag: 'Trending',
    image: 'https://images.pexels.com/photos/267394/pexels-photo-267394.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 8,
    name: 'Travel Water Bottle',
    description: 'Stainless steel insulated bottle for long trips.',
    price: '₹249',
    tag: 'Eco',
    image: 'https://images.pexels.com/photos/3737612/pexels-photo-3737612.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
];

const Products = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <div className={styles.page}>
      <div className={styles.feedColumn}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>My Products</span>
            <span className={styles.badge}>Placeholder data</span>
          </div>

          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
            This page shows a demo list of products with sample images and prices.
          </p>

          {/* PRODUCT GRID */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
              gap: '20px',
            }}
          >
            {placeholderProducts.map((p) => (
              <div
                key={p.id}
                style={{
                  borderRadius: '16px',
                  background: '#ffffff',
                  padding: '12px',
                  boxShadow: '0 8px 28px rgba(0,0,0,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onClick={() => setSelectedProduct(p)}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <div
                  style={{
                    width: '100%',
                    height: '150px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#e5e7eb',
                  }}
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '10px' }}>{p.name}</div>
                <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>{p.description}</div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '10px',
                  }}
                >
                  <span style={{ fontSize: '15px', fontWeight: 700 }}>{p.price}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      background: '#eef2ff',
                      color: '#4f46e5',
                      fontWeight: 500,
                    }}
                  >
                    {p.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRODUCT MODAL */}
      {selectedProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 50,
          }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              padding: '20px',
              width: '420px',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
          >
            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              style={{
                width: '100%',
                height: '260px',
                borderRadius: '12px',
                objectFit: 'cover',
              }}
            />

            <h2 style={{ marginTop: '16px', fontSize: '20px', fontWeight: 700 }}>
              {selectedProduct.name}
            </h2>

            <p style={{ marginTop: '6px', color: '#555' }}>{selectedProduct.description}</p>

            <h3 style={{ marginTop: '12px', fontWeight: 'bold', fontSize: '18px' }}>
              {selectedProduct.price}
            </h3>

            <button
              onClick={() => setSelectedProduct(null)}
              style={{
                marginTop: '18px',
                padding: '10px 16px',
                borderRadius: '8px',
                background: '#4f46e5',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                width: '100%',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
