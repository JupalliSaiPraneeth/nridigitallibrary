import React from 'react';
import { useLibrary } from '../context/LibraryContext.jsx';
import {
  Search,
  X,
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
    <section className="nri-hero-section full-bleed-hero" id="hero">
      {/* Background layer covering 100% edge-to-edge screen width */}
      <div className="nri-hero-bg-layer">
        <div
          className="nri-hero-photo-right"
          style={{ backgroundImage: "url('/college.png?v=7')" }}
        >
          <div className="nri-hero-gradient-overlay"></div>
        </div>
      </div>

      {/* Inner Container aligning typography and search bar with the page grid */}
      <div className="container nri-hero-content-wrap">
        {/* Left Text Content */}
        <div className="nri-hero-text-content">
          <h1 className="nri-hero-main-title">
            Explore Academic Textbooks,<br />
            Research & <span className="nri-highlight-orange">E-Books</span>
          </h1>

          <p className="nri-hero-main-subtitle">
            Access high-resolution digital textbooks, curriculum laboratory manuals,
            research publications and peer-reviewed journals 24/7.
          </p>
        </div>

        {/* Floating Search Bar */}
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
    </section>
  );
};
