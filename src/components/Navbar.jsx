import React, { useState, useEffect, useRef } from 'react';
import { useLibrary } from '../context/LibraryContext.jsx';
import {
  Home,
  LayoutGrid,
  Layers,
  Search,
  Bookmark,
  Bell,
  Sun,
  Moon,
  User,
  Upload,
  Menu,
  X,
  Check,
  ExternalLink
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
    setCurrentType,
    setSearchQuery
  } = useLibrary();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const notifRef = useRef(null);

  const logoSrc = theme === 'dark' ? '/nridark-removebg-preview.png' : '/nrilogo.png';

  const notifications = [
    {
      id: 1,
      title: 'New Research Publications',
      desc: '120+ IEEE & Springer journals and conference papers indexed for CSE & AI/DS.',
      time: '10m ago',
      type: 'journal'
    },
    {
      id: 2,
      title: 'Curriculum Update (R23)',
      desc: 'Updated laboratory manuals and core engineering textbooks now live.',
      time: '1h ago',
      type: 'textbook'
    },
    {
      id: 3,
      title: 'GATE 2026 Reference Shelf',
      desc: 'New GATE previous year solved papers added across all departments.',
      time: '1d ago',
      type: 'gate'
    }
  ];

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen]);

  const handleHomeClick = (e) => {
    e?.preventDefault();
    setActiveTab('home');
    setCurrentDept('all');
    setCurrentType('all');
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileNavOpen(false);
  };

  const handleBrowseClick = (e) => {
    e?.preventDefault();
    setActiveTab('browse');
    setCurrentDept('all');
    setMobileNavOpen(false);
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDepartmentsClick = (e) => {
    e?.preventDefault();
    setActiveTab('departments');
    setMobileNavOpen(false);
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        const select = document.getElementById('catalogDeptSelect');
        if (select) {
          select.focus();
        }
      }, 400);
    }
  };

  const handleResearchClick = (e) => {
    e?.preventDefault();
    setActiveTab('research');
    setCurrentType('journal');
    setMobileNavOpen(false);
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleShelfClick = (e) => {
    e?.preventDefault();
    setActiveTab('library');
    setActiveModal('shelf');
    setMobileNavOpen(false);
  };

  const handleOpenLogin = () => {
    setActiveModal('login');
    setMobileNavOpen(false);
  };

  const handleOpenIngest = () => {
    setActiveModal('bulkAdd');
    setMobileNavOpen(false);
  };

  const markAllRead = () => {
    setUnreadCount(0);
  };

  return (
    <header className="header">
      <div id="progressBar" className="reading-progress-bar"></div>

      <div className="container nav-container">
        {/* Brand Logo on Left */}
        <a href="#" className="brand" onClick={handleHomeClick} title="Dr. RVR NRI Digital Library Home">
          <img src={logoSrc} alt="DR. RVR NRI Logo" className="brand-logo-img" />
          <div className="brand-text">
            <span className="brand-title">DR. RVR NRI INSTITUTE OF TECHNOLOGY</span>
            <span className="brand-subtitle">DEEMED TO BE UNIVERSITY • DIGITAL LIBRARY</span>
          </div>
        </a>

        {/* Center Navigation Links (Home, Browse, Departments, Research, My Library) */}
        <nav className="nav-center-menu" aria-label="Main Navigation">
          <button
            type="button"
            className={`nav-center-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={handleHomeClick}
          >
            <Home className="nav-item-icon" />
            <span>Home</span>
          </button>

          <button
            type="button"
            className={`nav-center-item ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={handleBrowseClick}
          >
            <LayoutGrid className="nav-item-icon" />
            <span>Browse</span>
          </button>

          <button
            type="button"
            className={`nav-center-item ${activeTab === 'departments' ? 'active' : ''}`}
            onClick={handleDepartmentsClick}
          >
            <Layers className="nav-item-icon" />
            <span>Departments</span>
          </button>

          <button
            type="button"
            className={`nav-center-item ${activeTab === 'research' ? 'active' : ''}`}
            onClick={handleResearchClick}
          >
            <Search className="nav-item-icon" />
            <span>Research</span>
          </button>

          <button
            type="button"
            className={`nav-center-item ${activeTab === 'library' ? 'active' : ''}`}
            onClick={handleShelfClick}
          >
            <Bookmark className="nav-item-icon" />
            <span>My Library</span>
            {shelf.length > 0 && <span className="nav-badge-pill">{shelf.length}</span>}
          </button>
        </nav>

        {/* Actions on Far Right */}
        <div className="nav-actions">
          {/* Theme Toggle Button */}
          <button
            type="button"
            className="btn-icon desktop-theme-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="icon-sm text-amber" /> : <Moon className="icon-sm" />}
          </button>

          {/* Notification Bell with Red Badge Dot */}
          <div className="notif-dropdown-wrapper" ref={notifRef}>
            <button
              type="button"
              className="btn-icon nav-notif-btn"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              title="Notifications & Updates"
              aria-label="Notifications"
            >
              <Bell className="icon-sm" />
              {unreadCount > 0 && <span className="notif-red-dot" title={`${unreadCount} unread announcements`}></span>}
            </button>

            {notificationsOpen && (
              <div className="notif-popover">
                <div className="notif-popover-header">
                  <div className="notif-header-title">
                    <Bell className="icon-xs text-orange" />
                    <span>Announcements</span>
                  </div>
                  {unreadCount > 0 && (
                    <button type="button" className="notif-mark-read-btn" onClick={markAllRead}>
                      <Check className="icon-xs" />
                      <span>Mark read</span>
                    </button>
                  )}
                </div>

                <div className="notif-list">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className="notif-item"
                      onClick={() => {
                        if (item.type) setCurrentType(item.type);
                        setNotificationsOpen(false);
                        document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <div className="notif-item-header">
                        <span className="notif-item-title">{item.title}</span>
                        <span className="notif-item-time">{item.time}</span>
                      </div>
                      <p className="notif-item-desc">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Ingest shortcut button */}
          <button
            type="button"
            className="btn-secondary nav-ingest-btn"
            onClick={handleOpenIngest}
            title="AI Ingest & Book Management"
          >
            <Upload className="icon-xs text-orange" />
            <span>AI Ingest</span>
          </button>

          {/* Login Button in Vibrant Orange */}
          {user ? (
            <button
              type="button"
              className="btn-primary nav-login-btn"
              onClick={logout}
              title={`Logged in as ${user.name} - Click to Logout`}
            >
              <User className="icon-xs" />
              <span>{user.name}</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary nav-login-btn"
              onClick={handleOpenLogin}
              title="Student / Faculty Portal Login"
            >
              <User className="icon-xs" />
              <span>Login</span>
            </button>
          )}

          {/* Hamburger Menu Toggle on Mobile */}
          <button
            type="button"
            className="btn-icon hamburger-btn"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            title="Toggle Mobile Navigation Menu"
            aria-label="Navigation Menu"
          >
            {mobileNavOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileNavOpen(false)}>
          <div className="mobile-nav-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <span className="brand-subtitle">Library Quick Navigation</span>
              <button type="button" className="btn-close" onClick={() => setMobileNavOpen(false)}>
                <X />
              </button>
            </div>
            <div className="mobile-nav-links">
              <button
                type="button"
                className={`mobile-nav-item ${activeTab === 'home' ? 'active' : ''}`}
                onClick={handleHomeClick}
              >
                <Home className="icon-sm" />
                <span>Home</span>
              </button>

              <button
                type="button"
                className={`mobile-nav-item ${activeTab === 'browse' ? 'active' : ''}`}
                onClick={handleBrowseClick}
              >
                <LayoutGrid className="icon-sm" />
                <span>Browse Catalog</span>
              </button>

              <button
                type="button"
                className={`mobile-nav-item ${activeTab === 'departments' ? 'active' : ''}`}
                onClick={handleDepartmentsClick}
              >
                <Layers className="icon-sm" />
                <span>Academic Departments</span>
              </button>

              <button
                type="button"
                className={`mobile-nav-item ${activeTab === 'research' ? 'active' : ''}`}
                onClick={handleResearchClick}
              >
                <Search className="icon-sm" />
                <span>Research Publications</span>
              </button>

              <button
                type="button"
                className={`mobile-nav-item ${activeTab === 'library' ? 'active' : ''}`}
                onClick={handleShelfClick}
              >
                <Bookmark className="icon-sm" />
                <span>My Saved Shelf ({shelf.length})</span>
              </button>

              <button type="button" className="mobile-nav-item" onClick={handleOpenIngest}>
                <Upload className="icon-sm text-orange" />
                <span>AI Ingest & Book Management</span>
              </button>

              <button type="button" className="mobile-nav-item" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="icon-sm text-amber" /> : <Moon className="icon-sm" />}
                <span>Switch to {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              {user ? (
                <button
                  type="button"
                  className="mobile-nav-item text-red"
                  onClick={() => {
                    logout();
                    setMobileNavOpen(false);
                  }}
                >
                  <User className="icon-sm" />
                  <span>Logout ({user.name})</span>
                </button>
              ) : (
                <button type="button" className="mobile-nav-item highlight" onClick={handleOpenLogin}>
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

