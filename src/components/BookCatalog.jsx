import React from 'react';
import { useLibrary } from '../context/LibraryContext.jsx';
import { BookCard } from './BookCard.jsx';
import { SlidersHorizontal, ArrowUpDown, RefreshCw, SearchX } from 'lucide-react';

export const BookCatalog = () => {
  const {
    books,
    filteredBooks,
    loading,
    error,
    currentDept,
    setCurrentDept,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    reloadBooks
  } = useLibrary();

  const departments = [
    { id: 'all', label: 'All Departments' },
    { id: 'CSE', label: 'CSE & AI/DS' },
    { id: 'ECE', label: 'ECE Electronics' },
    { id: 'EEE', label: 'EEE Electrical' },
    { id: 'MECH', label: 'Mechanical Engg' },
    { id: 'CIVIL', label: 'Civil Engg' },
    { id: 'PHARM', label: 'Pharmacy' },
    { id: 'MBA', label: 'MBA & Management' }
  ];

  return (
    <section className="section catalog-section" id="catalog">
      <div className="container">
        <div className="catalog-controls-bar">
          <div className="catalog-control-group">
            <label htmlFor="catalogDeptSelect" className="catalog-control-label">
              <SlidersHorizontal className="icon-xs text-orange" />
              <span>Department:</span>
            </label>
            <div className="catalog-select-wrapper">
              <select
                id="catalogDeptSelect"
                className="catalog-select"
                value={currentDept}
                onChange={(e) => setCurrentDept(e.target.value)}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="catalog-control-group">
            <label htmlFor="sortSelect" className="catalog-control-label">
              <ArrowUpDown className="icon-xs text-orange" />
              <span>Sort By:</span>
            </label>
            <div className="catalog-select-wrapper">
              <select
                id="sortSelect"
                className="catalog-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="latest">Newest 2026</option>
                <option value="title">Title (A - Z)</option>
                <option value="rating">Highest Rating</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={reloadBooks}
            title="Refresh Catalog"
            style={{ width: '40px', height: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}
          >
            <RefreshCw className={`icon-sm ${loading ? 'spin' : ''}`} />
          </button>
        </div>

        {error && books && books.length > 0 && (
          <div style={{
            margin: '16px 0',
            padding: '12px 18px',
            background: 'rgba(237, 107, 16, 0.12)',
            border: '1px solid rgba(237, 107, 16, 0.25)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.88rem',
            color: 'var(--text-main)'
          }}>
            <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="catalog-loading-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px', padding: '24px 0' }}>
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="book-card-skeleton" style={{ height: '320px', background: 'var(--bg-secondary)', borderRadius: '24px', opacity: 0.6 }}></div>
            ))}
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="books-grid" id="booksGrid">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="empty-catalog-state" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <SearchX className="empty-icon text-orange" style={{ width: '64px', height: '64px', margin: '0 auto 16px auto', display: 'block' }} />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
              {!books || books.length === 0 ? 'No books are available!' : 'No E-Books Found'}
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
              {!books || books.length === 0
                ? 'No books are available in the library repository.'
                : 'Try adjusting your search keywords or department filters.'}
            </p>
            {books && books.length > 0 ? (
              <button
                className="btn-secondary"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentDept('all');
                }}
              >
                Reset Filters
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={reloadBooks}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}
              >
                <RefreshCw size={16} />
                <span>Reload Books</span>
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
