import React from 'react';
import { X, Bookmark, Trash2, BookOpen, Eye } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';

export function ShelfDrawer() {
  const { activeModal, closeModals, shelf, toggleSaveBook, clearShelf, openBookDetails, openInteractiveReader } = useLibrary();

  if (activeModal !== 'shelf') return null;

  return (
    <div className="modal-backdrop active" onClick={closeModals}>
      <div className="shelf-drawer-container" onClick={e => e.stopPropagation()}>
        <div className="shelf-header">
          <div className="shelf-title">
            <Bookmark size={20} className="text-accent" />
            <h3>My Saved Bookshelf</h3>
            <span className="badge badge-count">{shelf.length}</span>
          </div>

          <div className="shelf-header-actions">
            {shelf.length > 0 && (
              <button className="btn-icon-text danger-text" onClick={clearShelf} title="Clear shelf">
                <Trash2 size={14} /> Clear All
              </button>
            )}
            <button className="modal-close-btn" onClick={closeModals}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="shelf-body">
          {shelf.length === 0 ? (
            <div className="shelf-empty-state">
              <Bookmark size={48} className="empty-icon" />
              <h4>Your Bookshelf is Empty</h4>
              <p>Click the bookmark icon on any textbook or paper card in the catalog to save it for quick offline study access.</p>
            </div>
          ) : (
            <div className="shelf-books-grid">
              {shelf.map(book => (
                <div key={book.id} className="shelf-book-item">
                  <img src={book.cover} alt={book.title} className="shelf-cover" />
                  <div className="shelf-book-info">
                    <span className="badge badge-dept-sm">{book.dept}</span>
                    <h4 className="shelf-book-title">{book.title}</h4>
                    <p className="shelf-book-author">{book.author}</p>
                    <div className="shelf-book-actions">
                      <button className="btn btn-sm btn-secondary" onClick={() => openBookDetails(book)}>
                        <Eye size={12} /> Details
                      </button>
                      <button className="btn btn-sm btn-primary" onClick={() => openInteractiveReader(book)}>
                        <BookOpen size={12} /> Read
                      </button>
                      <button className="btn-icon danger" onClick={() => toggleSaveBook(book)} title="Remove from shelf">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShelfDrawer;
