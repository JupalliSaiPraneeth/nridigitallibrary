import React from 'react';
import { useLibrary } from '../context/LibraryContext.jsx';
import { X, BookOpen, Bookmark, Edit, Trash2, Layers, ListOrdered, Globe, Star } from 'lucide-react';

export const BookDetailsModal = () => {
  const {
    activeModal,
    selectedBook,
    closeModals,
    openInteractiveReader,
    toggleSaveBook,
    isInShelf,
    user,
    setActiveModal,
    setActiveEditBook,
    showConfirm,
    showToast,
    setBooks
  } = useLibrary();

  if (activeModal !== 'details' || !selectedBook) return null;

  const saved = isInShelf(selectedBook.id);

  const handleEditBook = () => {
    setActiveEditBook(selectedBook);
    setActiveModal('adminEdit');
  };

  const handleDeleteBook = () => {
    showConfirm({
      title: 'Delete E-Book Volume',
      message: `Are you sure you want to permanently delete "${selectedBook.title}" from the digital library?`,
      confirmText: 'Delete Book',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setBooks(prev => prev.filter(b => b.id !== selectedBook.id));
        showToast(`Deleted "${selectedBook.title}"`, 'info');
        closeModals();
      }
    });
  };

  return (
    <div className="modal-overlay active" id="bookDetailsModal" onClick={closeModals}>
      <div className="modal-card book-details-modal-card" onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button matching index.css .modal-close */}
        <button className="modal-close" onClick={closeModals} title="Close Modal">
          <X size={20} />
        </button>

        <div className="book-details-content">
          {/* Left Poster Cover Column */}
          <div className="book-details-cover">
            <div className="dept-poster-card" style={{ width: '100%', maxWidth: '280px', margin: '0 auto' }}>
              <button
                type="button"
                className={`poster-bookmark-btn ${saved ? 'saved' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSaveBook(selectedBook);
                }}
                title={saved ? 'Remove from Bookshelf' : 'Save to Bookshelf'}
              >
                <Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />
              </button>

              <div className="poster-circle-emblem">
                <svg className="poster-open-book-icon" viewBox="0 0 64 64">
                  <path d="M12 16c0-2.2 1.8-4 4-4h14v36H16c-2.2 0-4-1.8-4-4V16z" fill="#ffffff" stroke="#0f172a"
                    strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M52 16c0-2.2-1.8-4-4-4H34v36h14c2.2 0 4-1.8 4-4V16z" fill="#ffffff" stroke="#0f172a"
                    strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M34 16h14v22H34z" fill="#fff7ed" />
                  <path d="M16 16h14v22H16z" fill="#fff7ed" />
                  <path d="M20 22h8M20 28h6M36 22h8M36 28h8M36 34h5" stroke="#ed6b10" strokeWidth="3"
                    strokeLinecap="round" />
                  <path d="M34 48l-4 6-4-6v-6h8v6z" fill="#ed6b10" />
                </svg>
              </div>

              <div className="poster-title-section">
                <h2 className="poster-dept-title">{selectedBook.dept || 'CSE'} DEPARTMENT</h2>
                <div className="poster-divider">
                  <span className="divider-line"></span>
                  <BookOpen className="divider-book-icon icon-xs text-orange" size={14} />
                  <span className="divider-line"></span>
                </div>
                <h3 className="poster-book-title">{selectedBook.title}</h3>
                <p className="poster-book-author">
                  {selectedBook.author || (Array.isArray(selectedBook.authors) ? selectedBook.authors.join(', ') : 'Academic Faculty')}
                </p>
              </div>

              <div className="poster-wave-footer">
                <svg className="wave-shape" viewBox="0 0 500 150" preserveAspectRatio="none">
                  <path d="M0,40 C150,90 350,-10 500,40 L500,150 L0,150 Z" fill={`url(#waveGradientDetails-${selectedBook.id})`}></path>
                  <defs>
                    <linearGradient id={`waveGradientDetails-${selectedBook.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ed6b10" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>

          {/* Right Info Column */}
          <div className="book-details-info">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span className="book-details-dept">
                {selectedBook.category || `${selectedBook.dept} Curriculum`}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', paddingRight: '48px' }}>
                <Star size={16} color="#d97706" fill="#d97706" />
                <span>{selectedBook.rating || '4.7'}</span>
              </div>
            </div>

            <h2 className="book-details-title">
              {selectedBook.title}
            </h2>

            <p className="book-details-author">
              By <strong>{selectedBook.author || (Array.isArray(selectedBook.authors) ? selectedBook.authors.join(', ') : 'Academic Scholars')}</strong>
            </p>

            {/* Meta Chips */}
            <div className="book-details-meta">
              <div className="meta-item">
                <Layers size={16} />
                <span>{selectedBook.dept || 'CSE'} Dept</span>
              </div>
              <div className="meta-item">
                <ListOrdered size={16} />
                <span>{selectedBook.total_pages || 100} Pages</span>
              </div>
              <div className="meta-item">
                <Globe size={16} />
                <span>English</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="book-details-actions-top">
              <button
                className="btn btn-primary"
                onClick={() => {
                  closeModals();
                  openInteractiveReader(selectedBook);
                }}
              >
                <BookOpen size={18} />
                <span>Read Interactive E-Book</span>
              </button>

              <button
                className={`btn btn-secondary ${saved ? 'active' : ''}`}
                onClick={() => toggleSaveBook(selectedBook)}
              >
                <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
                <span>{saved ? 'In My Bookshelf' : 'Save to Bookshelf'}</span>
              </button>

              {user?.role === 'admin' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-ghost btn-sm" onClick={handleEditBook}>
                    <Edit size={14} /> Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={handleDeleteBook}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>

            {/* Description Section */}
            <div className="book-details-section">
              <h3 className="section-title">Description</h3>
              <p className="book-details-description">
                {selectedBook.desc || selectedBook.description || `Official academic volume on ${selectedBook.title} hosted on digital library server.`}
              </p>
            </div>

            {/* Table of Contents Section */}
            <div className="book-details-section">
              <h3 className="section-title">Table of Contents</h3>
              <div className="toc-preview">
                {(selectedBook.chapters || []).map((ch, idx) => (
                  <div 
                    key={idx} 
                    className="toc-preview-item"
                    onClick={() => {
                      closeModals();
                      openInteractiveReader(selectedBook);
                    }}
                  >
                    <span>{idx + 1}. {ch.title}</span>
                    <span>p. {ch.start_page || (idx * 25 + 1)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BookDetailsModal;
