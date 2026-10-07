import React from 'react';
import { useLibrary } from '../context/LibraryContext.jsx';
import {
  Search,
  X,
  BookOpen,
  FileText,
  GraduationCap,
  ChevronDown
} from 'lucide-react';

export const Hero = () => {
  const {
    searchQuery,
    setSearchQuery,
    currentDept,
    setCurrentDept
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

  const handleSearchSubmit = () => {
    const el = document.getElementById('catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="nri-hero-section" id="hero">
      <div className="container nri-hero-container">
        {/* Main Hero Card with Campus Background */}
        <div className="nri-hero-banner-card">
          {/* Background Image: college.png */}
          <div
            className="nri-hero-bg-layer"
            style={{ backgroundImage: "url('/college.png')" }}
          >
            {/* Gradient Overlay for crystal clear typography on the left */}
            <div className="nri-hero-gradient-overlay"></div>
          </div>

          {/* Left Text & Stats Content */}
          <div className="nri-hero-text-content">
            <h1 className="nri-hero-main-title">
              Explore Academic Textbooks,<br />
              Research & <span className="nri-highlight-orange">E-Books</span>
            </h1>

            <p className="nri-hero-main-subtitle">
              Access high-resolution digital textbooks, curriculum laboratory manuals,<br className="hide-mobile" />
              research publications and peer-reviewed journals 24/7.
            </p>

            {/* 3 Metric Badges */}
            <div className="nri-hero-metrics-row">
              <div className="nri-metric-badge">
                <div className="nri-metric-icon-wrap">
                  <BookOpen className="nri-metric-icon" />
                </div>
                <div className="nri-metric-labels">
                  <span className="nri-metric-number">25K+</span>
                  <span className="nri-metric-title">E-Books</span>
                </div>
              </div>

              <div className="nri-metric-badge">
                <div className="nri-metric-icon-wrap">
                  <FileText className="nri-metric-icon" />
                </div>
                <div className="nri-metric-labels">
                  <span className="nri-metric-number">5K+</span>
                  <span className="nri-metric-title">Research Papers</span>
                </div>
              </div>

              <div className="nri-metric-badge">
                <div className="nri-metric-icon-wrap">
                  <GraduationCap className="nri-metric-icon" />
                </div>
                <div className="nri-metric-labels">
                  <span className="nri-metric-number">20+</span>
                  <span className="nri-metric-title">Departments</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Search Bar (Anchored at the bottom) */}
          <div className="nri-floating-search-bar">
            <div className="nri-search-field-left">
              <Search className="nri-search-lead-icon" />
              <input
                type="text"
                className="nri-search-text-input"
                placeholder="Search by title, author, ISBN, subject or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchSubmit();
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="nri-search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear input"
                >
                  <X className="icon-xs" />
                </button>
              )}
            </div>

            <div className="nri-search-vertical-divider"></div>

            <div className="nri-search-dept-wrapper">
              <select
                className="nri-search-dept-dropdown"
                value={currentDept}
                onChange={(e) => setCurrentDept(e.target.value)}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
              <ChevronDown className="nri-search-dept-arrow" />
            </div>

            <button
              type="button"
              className="nri-search-action-btn"
              onClick={handleSearchSubmit}
            >
              <Search className="nri-search-btn-icon" />
              <span>Search</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
