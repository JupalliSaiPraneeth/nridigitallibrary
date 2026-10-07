import React from 'react';
import { X, Check, Trash2, Eye, ShieldCheck, AlertCircle } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';

export function AdminReviewModal() {
  const { activeModal, activeReviewBook, closeModals, showToast, books, setBooks, openInteractiveReader } = useLibrary();

  if (activeModal !== 'adminReview' || !activeReviewBook) return null;

  const handleApprove = () => {
    showToast(`Approved resource "${activeReviewBook.title}" into Central Library`, 'success');
    closeModals();
  };

  const handleReject = () => {
    setBooks(prev => prev.filter(b => b.id !== activeReviewBook.id));
    showToast(`Rejected & removed "${activeReviewBook.title}"`, 'info');
    closeModals();
  };

  return (
    <div className="modal-backdrop active" onClick={closeModals}>
      <div className="modal-container admin-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <ShieldCheck size={22} className="modal-icon text-accent" />
            <h2>Review Academic Ingest Submission</h2>
          </div>
          <button className="modal-close-btn" onClick={closeModals} title="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body review-body">
          <div className="review-card">
            <div className="review-cover-col">
              <img 
                src={activeReviewBook.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'} 
                alt={activeReviewBook.title}
                className="review-cover-img" 
              />
              <span className="badge badge-dept">{activeReviewBook.dept}</span>
            </div>

            <div className="review-details-col">
              <h3>{activeReviewBook.title}</h3>
              <p className="subtitle">{activeReviewBook.subtitle || `By ${activeReviewBook.author}`}</p>
              <div className="meta-tags">
                <span>Category: {activeReviewBook.category}</span>
                <span>Type: {activeReviewBook.type}</span>
                <span>Pages: {activeReviewBook.total_pages || 450}</span>
              </div>
              <p className="desc-preview">{activeReviewBook.desc || activeReviewBook.description}</p>
            </div>
          </div>
        </div>

        <div className="modal-footer justify-between">
          <button className="btn btn-danger" onClick={handleReject}>
            <Trash2 size={16} /> Reject Submission
          </button>

          <div className="action-buttons-group" style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => openInteractiveReader(activeReviewBook)}>
              <Eye size={16} /> Preview Content
            </button>
            <button className="btn btn-primary btn-gold" onClick={handleApprove}>
              <Check size={16} /> Approve & Index
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminReviewModal;
