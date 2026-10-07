import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext.jsx';
import { Bookmark, Sun, Moon, User, Upload, Menu, X } from 'lucide-react';

export const Navbar = () => {
  const {
    theme,
    toggleTheme,
    shelf,
    user,
    logout,
    setActiveModal,
    setCurrentDept
  } = useLibrary();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const logoSrc = theme === 'dark' ? '/nridark-removebg-preview.png' : '/nrilogo.png';

  const handleOpenLogin = () => {
    setActiveModal('login');
    setMobileNavOpen(false);
  };

  const handleOpenIngest = () => {
    setActiveModal('bulkAdd');
    setMobileNavOpen(false);
  };

  const handleOpenShelf = () => {
    setActiveModal('shelf');
    setMobileNavOpen(false);
  };

  return (
    <header className="header">
      <div id="progressBar" className="reading-progress-bar"></div>

      <div className="container nav-container">
        {/* Brand Logo on FAR LEFT */}
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            setCurrentDept('all');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <img src={logoSrc} alt="DR. RVR NRI Logo" className="brand-logo-img" />
          <div className="brand-text">
            <span className="brand-title">DR. RVR NRI INSTITUTE OF TECHNOLOGY</span>
            <span className="brand-subtitle">DEEMED TO BE UNIVERSITY • DIGITAL LIBRARY</span>
          </div>
        </a>

        {/* Action Buttons on FAR RIGHT */}
        <div className="nav-actions">
          <button
            className="btn-icon desktop-theme-btn"
            onClick={toggleTheme}
            title="Toggle Light / Dark Theme"
          >
            {theme === 'dark' ? <Sun className="icon-sm text-amber" /> : <Moon className="icon-sm" />}
          </button>

          <button
            className="btn-secondary nav-ingest-btn"
            onClick={handleOpenIngest}
            title="AI Ingest & Book Management"
          >
            <Upload className="icon-xs text-orange" />
            <span>AI Ingest</span>
          </button>

          <button
            className="btn-icon nav-shelf-btn"
            onClick={handleOpenShelf}
            title="My Saved Bookshelf"
          >
            <Bookmark className="icon-sm" />
            {shelf.length > 0 && <span className="badge-count">{shelf.length}</span>}
          </button>

          {user ? (
            <button className="btn-primary nav-login-btn" onClick={logout} title="Click to Logout">
              <User className="icon-xs" />
              <span>{user.name}</span>
            </button>
          ) : (
            <button className="btn-primary nav-login-btn" onClick={handleOpenLogin}>
              <User className="icon-xs" />
              <span>Login Portal</span>
            </button>
          )}

          <button
            className="btn-icon hamburger-btn"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            title="Toggle Mobile Navigation Menu"
          >
            {mobileNavOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {mobileNavOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileNavOpen(false)}>
          <div className="mobile-nav-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <span className="brand-subtitle">Library Quick Navigation</span>
              <button className="btn-close" onClick={() => setMobileNavOpen(false)}><X /></button>
            </div>
            <div className="mobile-nav-links">
              <button className="mobile-nav-item" onClick={handleOpenShelf}>
                <Bookmark className="icon-sm" />
                <span>My Saved Shelf ({shelf.length})</span>
              </button>

              <button className="mobile-nav-item" onClick={handleOpenIngest}>
                <Upload className="icon-sm" />
                <span>AI Ingest & Book Management</span>
              </button>

              <button className="mobile-nav-item" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="icon-sm text-amber" /> : <Moon className="icon-sm" />}
                <span>Switch to {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              {user ? (
                <button className="mobile-nav-item text-red" onClick={() => { logout(); setMobileNavOpen(false); }}>
                  <User className="icon-sm" />
                  <span>Logout ({user.name})</span>
                </button>
              ) : (
                <button className="mobile-nav-item highlight" onClick={handleOpenLogin}>
                  <User className="icon-sm" />
                  <span>Student / Faculty Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
