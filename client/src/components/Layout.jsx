import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import styles from './Layout.module.css';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handler = () => setSidebarOpen((v) => !v);
    if (typeof window !== 'undefined') {
      window.addEventListener('toggleSidebar', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('toggleSidebar', handler);
      }
    };
  }, []);

  return (
    <div className={styles.appContainer}>
      <Header />
      <div className={styles.bodyContainer}>
        <div className={`${styles.sidebarDrawer} ${sidebarOpen ? styles.sidebarDrawerOpen : ''}`}>
          <Sidebar />
        </div>
        {sidebarOpen && (
          <div
            className={styles.sidebarBackdrop}
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerCol}>
            <div className={styles.footerBrand}>Hey Stranger!</div>
            <div className={styles.footerDesc}>
              Your modern social space to share posts, stories, and connect with people, pages, and groups.
            </div>
            <div className={styles.footerSocialRow}>
              <a href="#" className={styles.footerSocial} aria-label="Facebook"><i className="fab fa-facebook-f" /></a>
              <a href="#" className={styles.footerSocial} aria-label="Twitter"><i className="fab fa-x-twitter" /></a>
              <a href="#" className={styles.footerSocial} aria-label="Instagram"><i className="fab fa-instagram" /></a>
              <a href="#" className={styles.footerSocial} aria-label="LinkedIn"><i className="fab fa-linkedin-in" /></a>
            </div>
          </div>
          <div className={styles.footerCol}>
            <div className={styles.footerTitle}>Quick Links</div>
            <a href="/dashboard" className={styles.footerLink}>Home</a>
            <a href="/saved" className={styles.footerLink}>Saved Posts</a>
            <a href="/memories" className={styles.footerLink}>Memories</a>
            <a href="/explore/people" className={styles.footerLink}>People</a>
            <a href="/explore/watch" className={styles.footerLink}>Watch</a>
            <a href="/explore/marketplace" className={styles.footerLink}>Marketplace</a>
          </div>
          <div className={styles.footerCol}>
            <div className={styles.footerTitle}>Contact Us</div>
            <div className={styles.footerContact}><i className="fas fa-envelope" /> support@heystranger.app</div>
            <div className={styles.footerContact}><i className="fas fa-map-marker-alt" /> Anywhere, Earth</div>
            <a href="#" className={styles.footerContact}><i className="fas fa-download" /> Download App</a>
          </div>
        </div>
        <div className={styles.footerDivider} />
        <div className={styles.footerBottom}>© 2025 Hey Stranger Platform. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default Layout;
