import React from 'react';
import { useLibrary } from '../context/LibraryContext.jsx';
import { Search, Sparkles, X } from 'lucide-react';

export const Hero = () => {
  const {
    searchQuery,
    setSearchQuery,
    currentDept,
    setCurrentDept,
    currentType,
    setCurrentType
  } = useLibrary();

  const departments = [
    { id: 'all', label: 'All Departments' },
    { id: 'CSE', label: 'CSE & AI/DS' },
    { id: 'ECE', label: 'Electronics (ECE)' },
    { id: 'EEE', label: 'Electrical (EEE)' },
    { id: 'MECH', label: 'Mechanical Engg' },
    { id: 'CIVIL', label: 'Civil Engg' },
    { id: 'PHARM', label: 'Pharmacy' },
    { id: 'MBA', label: 'MBA & Management' }
  ];

  const types = [
    { id: 'all', label: 'All Materials' },
    { id: 'textbook', label: 'Core Textbooks' },
    { id: 'reference', label: 'Reference Manuals' },
    { id: 'journal', label: 'Research Publications' },
    { id: 'gate', label: 'GATE & Lab Guides' }
  ];

  return (
    <section className="hero" id="hero">
      <div className="container hero-grid">
        <div className="hero-content" style={{ width: '100%' }}>
          <h1 className="hero-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '6px', color: 'var(--text-main)', lineHeight: 1.2 }}>
            Explore Academic Textbooks, Research & E-Books
          </h1>

          <p className="hero-subtitle" style={{ fontSize: 'clamp(0.85rem, 1.3vw, 1.02rem)', color: 'var(--text-muted)', marginBottom: '14px', maxWidth: 'none', width: '100%', whiteSpace: 'nowrap' }}>
            Access high-resolution digital textbooks, curriculum laboratory manuals, and peer-reviewed journals 24/7.
          </p>

          <div className="search-box-wrap">
            <div className="search-input-group">
              <Search className="icon-sm search-icon" style={{ opacity: 0.6 }} />
              <input
                type="text"
                className="search-input"
                placeholder="Search by Title, Author, Topic (e.g., Deep Learning, VLSI, Microgrids, Kinematics)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                >
                  <X className="icon-xs" />
                </button>
              )}
            </div>

            <select
              className="search-filter-select"
              value={currentDept}
              onChange={(e) => setCurrentDept(e.target.value)}
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>

            <button
              className="btn-primary"
              onClick={() => {
                const el = document.getElementById('catalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Search E-Books
            </button>
          </div>

          <div className="type-chips-bar">
            {types.map((t) => (
              <span
                key={t.id}
                className={`type-chip ${currentType === t.id ? 'active' : ''}`}
                onClick={() => setCurrentType(t.id)}
                style={{ cursor: 'pointer' }}
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
