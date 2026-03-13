import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  return (
    <aside className={styles.sidebar}>
      <h2>News</h2>
      <ul>
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? styles.activeLink : ''}>
            <i className="fas fa-newspaper" /> News Feed
          </NavLink>
        </li>
        <li>
          <NavLink to="/articles" className={({ isActive }) => isActive ? styles.activeLink : ''}>
            <i className="fas fa-file-alt" /> My Articles
          </NavLink>
        </li>
        {/* <li>
          <NavLink to="/products" className={({ isActive }) => isActive ? styles.activeLink : ''}>
            <i className="fas fa-box" /> My Products
          </NavLink>
        </li> */}
        <li>
          <NavLink to="/saved" className={({ isActive }) => isActive ? styles.activeLink : ''}>
            <i className="fas fa-bookmark" /> Saved Posts
          </NavLink>
        </li>
        <li>
          <NavLink to="/memories" className={({ isActive }) => isActive ? styles.activeLink : ''}>
            <i className="fas fa-clock" /> Memories
          </NavLink>
        </li>
      </ul>

      <h2>Explore</h2>
      <ul>
        <li>
          <NavLink to="/explore/people" className={({ isActive }) => (isActive ? styles.activeLink : '')}>
            <i className="fas fa-user-friends" /> People
          </NavLink>
        </li>
        <li>
          <NavLink to="/explore/pages" className={({ isActive }) => (isActive ? styles.activeLink : '')}>
            <i className="fas fa-flag" /> Pages
          </NavLink>
        </li>
        <li>
          <NavLink to="/explore/groups" className={({ isActive }) => (isActive ? styles.activeLink : '')}>
            <i className="fas fa-users" /> Groups
          </NavLink>
        </li>
        <li>
          <NavLink to="/explore/events" className={({ isActive }) => (isActive ? styles.activeLink : '')}>
            <i className="fas fa-calendar-alt" /> Events
          </NavLink>
        </li>
        <li>
          <NavLink to="/explore/watch" className={({ isActive }) => (isActive ? styles.activeLink : '')}>
            <i className="fas fa-tv" /> Watch
          </NavLink>
        </li>
        <li>
          <NavLink to="/explore/blogs" className={({ isActive }) => (isActive ? styles.activeLink : '')}>
            <i className="fas fa-blog" /> Blogs
          </NavLink>
        </li>
        <li>
          <NavLink to="/explore/marketplace" className={({ isActive }) => (isActive ? styles.activeLink : '')}>
            <i className="fas fa-store" /> Marketplace
          </NavLink>
        </li>
        <li>
          <NavLink to="/explore/offers" className={({ isActive }) => (isActive ? styles.activeLink : '')}>
            <i className="fas fa-gift" /> Offers
          </NavLink>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
