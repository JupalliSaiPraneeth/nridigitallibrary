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
      <div className="hero-glow-1"></div>
      <div className="hero-glow-2"></div>

      <div className="container hero-grid">
        <div className="hero-content" style={{ width: '100%' }}>
          <div className="hero-badge" style={{ marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '50px', background: 'rgba(237, 107, 16, 0.1)', border: '1px solid rgba(237, 107, 16, 0.25)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-orange-bright)' }}>
            <Sparkles className="icon-xs text-orange" />
            <span>Accredited NAAC A+ Grade E-Library Portal</span>
          </div>

          <h1 className="hero-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)', lineHeight: 1.2 }}>
            Explore Academic Textbooks, Research & E-Books
          </h1>

          <p className="hero-subtitle" style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '28px', maxWidth: '720px' }}>
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
