import React from 'react';
import styles from './StatsCards.module.css';

const StatsCards = ({ stats }) => {
  return (
    <div className={styles.statsSection}>
      <div className={styles.statBox}>
        <h3>{stats.posts}</h3>
        <p>Posts</p>
      </div>
      <div className={styles.statBox}>
        <h3>{stats.comments}</h3>
        <p>Comments</p>
      </div>
      <div className={styles.statBox}>
        <h3>{stats.reactions}</h3>
        <p>Total Reactions</p>
      </div>
    </div>
  );
};

export default StatsCards;
