import React from 'react';
import { useLibrary } from '../context/LibraryContext.jsx';
import { Search, X, BookOpen, FileText, GraduationCap, ChevronDown } from 'lucide-react';

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

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const el = document.getElementById('catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero" id="hero">
      {/* Campus Photo Backdrop on Right Side (Iconic Building & Facade) */}
      <div className="hero-campus-backdrop" aria-hidden="true">
        <img
          src="/college.webp"
          alt="DR. RVR NRI Institute of Technology Campus"
          className="hero-campus-photo"
        />
        <div className="hero-campus-gradient-mask"></div>
      </div>

      <div className="container hero-container">
        {/* Top Header Row: Heading on Left & Floating Stats Bar on Right */}
        <div className="hero-top-row">
          <div className="hero-title-group">
            <h1 className="hero-title">
              Explore Academic Textbooks,<br className="hero-title-break" />
              Research & <span className="hero-text-orange">E-Books</span>
            </h1>

            <p className="hero-subtitle">
              Access high-resolution digital textbooks, curriculum laboratory manuals, research publications and peer-reviewed journals 24/7.
            </p>
          </div>

          {/* Floating Stats Bar (25K+ E-Books | 5K+ Research Papers | 20+ Departments) */}
          <div className="hero-stats-card" aria-label="Library Collection Statistics">
            <div className="hero-stat-item">
              <BookOpen className="hero-stat-icon" />
              <div className="hero-stat-data">
                <span className="hero-stat-value">25K+</span>
                <span className="hero-stat-name">E-Books</span>
              </div>
            </div>

            <div className="hero-stat-sep" aria-hidden="true"></div>

            <div className="hero-stat-item">
              <FileText className="hero-stat-icon" />
              <div className="hero-stat-data">
                <span className="hero-stat-value">5K+</span>
                <span className="hero-stat-name">Research Papers</span>
              </div>
            </div>

            <div className="hero-stat-sep" aria-hidden="true"></div>

            <div className="hero-stat-item">
              <GraduationCap className="hero-stat-icon" />
              <div className="hero-stat-data">
                <span className="hero-stat-value">20+</span>
                <span className="hero-stat-name">Departments</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Modern Search Bar (NO rounded pill shape per instruction) */}
        <form className="search-box-clean" onSubmit={handleSearchSubmit}>
          <div className="search-input-field">
            <Search className="search-leading-icon" />
            <input
              type="text"
              className="search-clean-input"
              placeholder="Search by title, author, ISBN, subject or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-icon-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search query"
                aria-label="Clear search"
              >
                <X className="icon-xs" />
              </button>
            )}
          </div>

          <div className="search-divider" aria-hidden="true"></div>

          <div className="search-dept-wrapper">
            <select
              id="heroDeptSelect"
              className="search-dept-select"
              value={currentDept}
              onChange={(e) => setCurrentDept(e.target.value)}
              aria-label="Select Academic Department"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
            <ChevronDown className="search-dept-chevron" />
          </div>

          <button
            type="submit"
            className="search-clean-btn"
            title="Search Library Catalog"
          >
            <Search className="icon-xs" />
            <span>Search</span>
          </button>
        </form>

        {/* Quick Filter Type Chips */}
        <div className="type-chips-bar">
          {types.map((t) => (
            <button
              type="button"
              key={t.id}
              className={`type-chip ${currentType === t.id ? 'active' : ''}`}
              onClick={() => setCurrentType(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
