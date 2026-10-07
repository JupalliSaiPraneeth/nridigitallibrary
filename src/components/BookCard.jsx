import React from 'react';
import { useLibrary } from '../context/LibraryContext.jsx';
import { Bookmark, BookOpen, Edit, Trash2 } from 'lucide-react';

export const BookCard = ({ book }) => {
  const {
    openInteractiveReader,
    openBookDetails,
    toggleSaveBook,
    isInShelf,
    user,
    setActiveEditBook,
    setActiveModal,
    showConfirm,
    showToast,
    setBooks,
    setCurrentDept
  } = useLibrary();

  const saved = isInShelf(book.id);

  const handleEdit = (e) => {
    e.stopPropagation();
    setActiveEditBook(book);
    setActiveModal('adminEdit');
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    showConfirm({
      title: 'Delete E-Book Volume',
      message: `Are you sure you want to delete "${book.title}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setBooks(prev => prev.filter(b => b.id !== book.id));
        showToast(`Deleted "${book.title}"`, 'info');
      }
    });
  };

  return (
    <div
      className="book-card dept-poster-card"
      onClick={() => openBookDetails(book)}
    >
      {user?.role === 'admin' && (
        <div className="admin-card-actions" onClick={(e) => e.stopPropagation()}>
          <button className="admin-card-btn edit-btn" title="Admin Edit Book" onClick={handleEdit}>
            <Edit className="icon-xs" />
          </button>
          <button className="admin-card-btn delete-btn" title="Admin Delete Book" onClick={handleDelete}>
            <Trash2 className="icon-xs" />
          </button>
        </div>
      )}

      <button
        type="button"
        className={`poster-bookmark-btn ${saved ? 'saved' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleSaveBook(book);
        }}
        title={saved ? 'Remove from Bookshelf' : 'Save to Bookshelf'}
      >
        <Bookmark className="icon-xs" fill={saved ? 'currentColor' : 'none'} />
      </button>

      <div className="poster-circle-emblem" onClick={() => openBookDetails(book)}>
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

      <div className="poster-title-section" onClick={() => openBookDetails(book)}>
        <h2
          className="poster-dept-title"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentDept(book.dept);
          }}
          title={`Filter by ${book.dept}`}
        >
          {book.dept || 'CSE'} DEPARTMENT
        </h2>

        <div className="poster-divider">
          <span className="divider-line"></span>
          <BookOpen className="divider-book-icon icon-xs text-orange" />
          <span className="divider-line"></span>
        </div>

        <h3 className="poster-book-title">{book.title}</h3>
        <p className="poster-book-author">
          {book.author || (Array.isArray(book.authors) ? book.authors.join(', ') : 'Academic Faculty')}
        </p>
      </div>

      <div className="poster-wave-footer">
        <svg className="wave-shape" viewBox="0 0 500 150" preserveAspectRatio="none">
          <path d="M0,40 C150,90 350,-10 500,40 L500,150 L0,150 Z" fill={`url(#waveGradient-${book.id})`}></path>
          <defs>
            <linearGradient id={`waveGradient-${book.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ed6b10" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
        </svg>
        <button
          className="poster-cta-btn"
          onClick={(e) => {
            e.stopPropagation();
            openBookDetails(book);
          }}
        >
          <BookOpen className="icon-xs" />
          <span>Explore E-Book &rarr;</span>
        </button>
      </div>
    </div>
  );
};
