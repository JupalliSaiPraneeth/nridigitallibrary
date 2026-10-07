import React, { useState } from 'react';
import { X, User, Key, Shield, LogIn } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';

export function LoginModal() {
  const { activeModal, closeModals, login } = useLibrary();
  
  const [role, setRole] = useState('student'); // 'student' | 'admin'
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');

  if (activeModal !== 'login') return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (role === 'student' && !rollNumber.trim()) return;
    login(rollNumber || 'ADMIN', role);
    closeModals();
  };

  return (
    <div className="modal-backdrop active" onClick={closeModals}>
      <div className="modal-container login-modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <LogIn size={22} className="modal-icon text-accent" />
            <h2>Library Portal Portal Authentication</h2>
          </div>
          <button className="modal-close-btn" onClick={closeModals} title="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body login-form">
          <div className="role-tab-picker">
            <button 
              type="button" 
              className={`role-tab ${role === 'student' ? 'active' : ''}`}
              onClick={() => setRole('student')}
            >
              <User size={16} /> Student Access
            </button>
            <button 
              type="button" 
              className={`role-tab ${role === 'admin' ? 'active' : ''}`}
              onClick={() => setRole('admin')}
            >
              <Shield size={16} /> Faculty / Admin
            </button>
          </div>

          {role === 'student' ? (
            <div className="form-group">
              <label>College Roll Number / Student ID</label>
              <div className="input-icon-wrapper">
                <User size={18} className="input-icon" />
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. 21KN1A0501" 
                  value={rollNumber} 
                  onChange={e => setRollNumber(e.target.value)} 
                />
              </div>
              <small className="form-help-text">Enter your DR. RVR NRI IT registered hall ticket number</small>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Faculty / Admin Username</label>
                <div className="input-icon-wrapper">
                  <User size={18} className="input-icon" />
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. admin@nriit.edu.in" 
                    value={rollNumber} 
                    onChange={e => setRollNumber(e.target.value)} 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Security Key / Password</label>
                <div className="input-icon-wrapper">
                  <Key size={18} className="input-icon" />
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                  />
                </div>
              </div>
            </>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModals}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-gold">
              Authenticate & Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginModal;
