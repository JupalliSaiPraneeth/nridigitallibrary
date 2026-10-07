import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext.jsx';
import {
  Home,
  LayoutGrid,
  Layers,
  Compass,
  Bookmark,
  Sun,
  Moon,
  Bell,
  User,
  Upload,
  Menu,
  X
} from 'lucide-react';

export const Navbar = () => {
  const {
    theme,
    toggleTheme,
    shelf,
    user,
    logout,
    setActiveModal,
    setCurrentDept,
    setCurrentType
  } = useLibrary();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

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

  const handleNavClick = (tabId, targetElId, deptId, typeId) => {
    setActiveTab(tabId);
    setMobileNavOpen(false);

    if (deptId) setCurrentDept(deptId);
    if (typeId) setCurrentType(typeId);

    if (targetElId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(targetElId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="header top-navbar">
      <div id="progressBar" className="reading-progress-bar"></div>

      <div className="container nav-container">
        {/* Brand Logo & University Title (FAR LEFT) */}
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('home', 'top', 'all');
          }}
        >
          <img src={logoSrc} alt="DR. RVR NRI Logo" className="brand-logo-img" />
          <div className="brand-text">
            <span className="brand-title">DR. RVR NRI INSTITUTE OF TECHNOLOGY</span>
            <span className="brand-subtitle">DEEMED TO BE UNIVERSITY • DIGITAL LIBRARY</span>
          </div>
        </a>

        {/* Center Navigation Links */}
        <nav className="nav-center-menu">
          <button
            type="button"
            className={`nav-menu-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home', 'top')}
          >
            <Home className="icon-xs" />
            <span>Home</span>
          </button>

          <button
            type="button"
            className={`nav-menu-item ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => handleNavClick('browse', 'catalog')}
          >
            <LayoutGrid className="icon-xs" />
            <span>Browse</span>
          </button>

          <button
            type="button"
            className={`nav-menu-item ${activeTab === 'departments' ? 'active' : ''}`}
            onClick={() => handleNavClick('departments', 'catalog')}
          >
            <Layers className="icon-xs" />
            <span>Departments</span>
          </button>

          <button
            type="button"
            className={`nav-menu-item ${activeTab === 'research' ? 'active' : ''}`}
            onClick={() => handleNavClick('research', 'catalog', null, 'journal')}
          >
            <Compass className="icon-xs" />
            <span>Research</span>
          </button>

          <button
            type="button"
            className={`nav-menu-item ${activeTab === 'shelf' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('shelf');
              handleOpenShelf();
            }}
          >
            <Bookmark className="icon-xs" />
            <span>My Library</span>
            {shelf.length > 0 && <span className="nav-shelf-pill">{shelf.length}</span>}
          </button>
        </nav>

        {/* Action Buttons (FAR RIGHT) */}
        <div className="nav-actions">
          {/* Theme Toggle Button */}
          <button
            className="btn-icon nav-tool-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? <Sun className="icon-sm text-amber" /> : <Moon className="icon-sm" />}
          </button>

          {/* Notification Bell */}
          <button
            className="btn-icon nav-tool-btn nav-bell-btn"
            title="Library Notifications & Announcements"
            onClick={() => {
              const el = document.getElementById('catalog');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Bell className="icon-sm" />
            <span className="bell-badge-count">0</span>
          </button>

          {/* AI Ingest Button (Admin/Faculty) */}
          <button
            className="btn-icon nav-tool-btn nav-ingest-quick-btn"
            onClick={handleOpenIngest}
            title="AI Ingest & Book Management"
          >
            <Upload className="icon-sm text-orange" />
          </button>

          {/* Login Button (Solid Orange) */}
          {user ? (
            <button className="btn-primary nav-main-login-btn" onClick={logout} title="Click to Logout">
              <User className="icon-xs" />
              <span>{user.name}</span>
            </button>
          ) : (
            <button className="btn-primary nav-main-login-btn" onClick={handleOpenLogin}>
              <User className="icon-xs" />
              <span>Login</span>
            </button>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            className="btn-icon hamburger-btn"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            title="Toggle Menu"
          >
            {mobileNavOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileNavOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileNavOpen(false)}>
          <div className="mobile-nav-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <span className="brand-subtitle">NRI Digital Library</span>
              <button className="btn-close" onClick={() => setMobileNavOpen(false)}><X /></button>
            </div>
            <div className="mobile-nav-links">
              <button
                className={`mobile-nav-item ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => handleNavClick('home', 'top')}
              >
                <Home className="icon-sm text-orange" />
                <span>Home</span>
              </button>

              <button
                className="mobile-nav-item"
                onClick={() => handleNavClick('browse', 'catalog')}
              >
                <LayoutGrid className="icon-sm" />
                <span>Browse All Books</span>
              </button>

              <button
                className="mobile-nav-item"
                onClick={() => handleNavClick('departments', 'catalog')}
              >
                <Layers className="icon-sm" />
                <span>Academic Departments</span>
              </button>

              <button
                className="mobile-nav-item"
                onClick={() => handleNavClick('research', 'catalog', null, 'journal')}
              >
                <Compass className="icon-sm" />
                <span>Research Publications</span>
              </button>

              <button className="mobile-nav-item" onClick={handleOpenShelf}>
                <Bookmark className="icon-sm" />
                <span>My Library Shelf ({shelf.length})</span>
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
