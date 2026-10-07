import React, { useState, useEffect } from 'react';
import { X, Edit3, Save } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';

export function AdminEditBookModal() {
  const { activeModal, activeEditBook, closeModals, showToast, setBooks } = useLibrary();

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    dept: 'CSE',
    category: '',
    desc: '',
    year: 2026,
    cover: ''
  });

  useEffect(() => {
    if (activeEditBook) {
      setFormData({
        title: activeEditBook.title || '',
        author: activeEditBook.author || '',
        dept: activeEditBook.dept || 'CSE',
        category: activeEditBook.category || '',
        desc: activeEditBook.desc || activeEditBook.description || '',
        year: activeEditBook.year || 2026,
        cover: activeEditBook.cover || ''
      });
    }
  }, [activeEditBook]);

  if (activeModal !== 'adminEdit' || !activeEditBook) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setBooks(prev => prev.map(b => {
      if (b.id === activeEditBook.id) {
        return {
          ...b,
          title: formData.title,
          author: formData.author,
          dept: formData.dept,
          category: formData.category || `${formData.dept} Curriculum`,
          desc: formData.desc,
          description: formData.desc,
          year: parseInt(formData.year, 10) || 2026,
          cover: formData.cover || b.cover
        };
      }
      return b;
    }));

    showToast(`Updated book "${formData.title}" details`, 'success');
    closeModals();
  };

  return (
    <div className="modal-backdrop active" onClick={closeModals}>
      <div className="modal-container admin-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <Edit3 size={22} className="modal-icon text-accent" />
            <h2>Edit Catalog Resource Metadata</h2>
          </div>
          <button className="modal-close-btn" onClick={closeModals} title="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-body admin-form">
          <div className="form-group-grid">
            <div className="form-group">
              <label>Book Title</label>
              <input 
                type="text" 
                name="title" 
                required 
                value={formData.title} 
                onChange={handleChange} 
              />
            </div>

            <div className="form-group">
              <label>Author / Editor</label>
              <input 
                type="text" 
                name="author" 
                required 
                value={formData.author} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="form-group-grid">
            <div className="form-group">
              <label>Department</label>
              <select name="dept" value={formData.dept} onChange={handleChange}>
                <option value="CSE">CSE - Computer Science & Eng</option>
                <option value="ECE">ECE - Electronics & Comm Eng</option>
                <option value="EEE">EEE - Electrical & Electronics</option>
                <option value="MECH">MECH - Mechanical Eng</option>
                <option value="CIVIL">CIVIL - Civil Eng</option>
                <option value="PHARM">PHARM - Pharmacy & Bio Sciences</option>
              </select>
            </div>

            <div className="form-group">
              <label>Publication Year</label>
              <input 
                type="number" 
                name="year" 
                value={formData.year} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Cover Image URL</label>
            <input 
              type="text" 
              name="cover" 
              value={formData.cover} 
              onChange={handleChange} 
            />
          </div>

          <div className="form-group">
            <label>Description / Overview</label>
            <textarea 
              name="desc" 
              rows={4} 
              value={formData.desc} 
              onChange={handleChange} 
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModals}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-gold">
              <Save size={16} /> Save Metadata Updates
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminEditBookModal;
