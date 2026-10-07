import React from 'react';
import { LibraryProvider } from './context/LibraryContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Hero } from './components/Hero.jsx';
import { BookCatalog } from './components/BookCatalog.jsx';
import { Footer } from './components/Footer.jsx';
import { BookDetailsModal } from './components/BookDetailsModal.jsx';
import { InteractiveReaderModal } from './components/InteractiveReaderModal.jsx';
import { AdminIngestModal } from './components/AdminIngestModal.jsx';
import { AdminReviewModal } from './components/AdminReviewModal.jsx';
import { AdminEditBookModal } from './components/AdminEditBookModal.jsx';
import { ShelfDrawer } from './components/ShelfDrawer.jsx';
import { LoginModal } from './components/LoginModal.jsx';
import { ConfirmModal } from './components/ConfirmModal.jsx';
import { Toast } from './components/Toast.jsx';

export function App() {
  return (
    <LibraryProvider>
      <div className="app-root">
        <Navbar />
        <main>
          <Hero />
          <BookCatalog />
        </main>
        <Footer />

        {/* Modals & Overlays */}
        <BookDetailsModal />
        <InteractiveReaderModal />
        <AdminIngestModal />
        <AdminReviewModal />
        <AdminEditBookModal />
        <ShelfDrawer />
        <LoginModal />
        <ConfirmModal />
        <Toast />
      </div>
    </LibraryProvider>
  );
}

export default App;
