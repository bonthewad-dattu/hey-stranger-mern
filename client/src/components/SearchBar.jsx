import React from 'react';
import styles from './SearchBar.module.css';

const SearchBar = ({ value, onChange }) => {
  return (
    <div className={styles.searchBar}>
      <input
        type="text"
        placeholder="Search by Post ID or Text..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <i className="fas fa-search" />
    </div>
  );
};

export default SearchBar;
