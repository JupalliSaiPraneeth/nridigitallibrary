import React, { createContext, useContext, useState, useEffect } from 'react';
import { getBooks, API_URL } from '../services/libraryApi.js';
import { generateRichChapters } from '../utils/chapterGenerator.js';

const LibraryContext = createContext(null);

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};

export const LibraryProvider = ({ children }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [currentDept, setCurrentDept] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [currentType, setCurrentType] = useState('all');

  // Saved Shelf (localStorage)
  const [shelf, setShelf] = useState(() => {
    try {
      const saved = localStorage.getItem('nri_saved_shelf');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Auth / Role State
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('nri_user_session');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  // Theme (Dark / Light)
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('nri_theme');
      if (savedTheme) return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) {
      return 'light';
    }
  });

  // Modals State
  const [activeModal, setActiveModal] = useState(null); // 'details' | 'reader' | 'login' | 'bulkAdd' | 'adminReview' | 'adminEdit' | 'shelf'
  const [selectedBook, setSelectedBook] = useState(null);
  const [readerBook, setReaderBook] = useState(null);
  const [activeReviewBook, setActiveReviewBook] = useState(null);
  const [activeEditBook, setActiveEditBook] = useState(null);

  // Toast & Confirm Modal
  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    iconType: 'warning'
  });

  // Apply Theme class and data-theme attribute on document
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.setAttribute('data-theme', 'light');
    }
    try {
      localStorage.setItem('nri_theme', theme);
    } catch (e) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Toast Helper
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Confirm Modal Helper
  const showConfirm = ({ title, message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel', iconType = 'warning' }) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        if (onConfirm) await onConfirm();
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      },
      confirmText,
      cancelText,
      iconType
    });
  };

  const closeConfirm = () => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  // Sync Shelf with LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('nri_saved_shelf', JSON.stringify(shelf));
    } catch (e) {}
  }, [shelf]);

  const toggleSaveBook = (book) => {
    if (!book) return;
    setShelf(prev => {
      const exists = prev.some(item => item.id === book.id);
      if (exists) {
        showToast(`Removed "${book.title}" from your bookshelf`, 'info');
        return prev.filter(item => item.id !== book.id);
      } else {
        showToast(`Added "${book.title}" to your bookshelf`, 'success');
        return [...prev, book];
      }
    });
  };

  const isInShelf = (bookId) => {
    return shelf.some(item => item.id === bookId);
  };

  const clearShelf = () => {
    setShelf([]);
    showToast('Cleared your bookshelf', 'info');
  };

  // Load Books from Backend / Fallback
  const fetchBooksData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBooks(6000);
      const processed = (data || []).map(b => {
        const dept = b.dept || 'CSE';
        const chapters = (Array.isArray(b.chapters) && b.chapters.length > 0)
          ? b.chapters
          : generateRichChapters(b.title, dept);
        return {
          ...b,
          chapters,
          dept,
          total_pages: b.total_pages || (chapters.length * 28),
          rating: b.rating || (Math.random() * 0.4 + 4.6).toFixed(1)
        };
      });
      setBooks(processed);
    } catch (err) {
      console.warn('API fetch warning, using fallback books dataset:', err);
      setError('College book server storage is currently offline or connecting via fallback mode. Displaying verified academic curriculum library.');
      // Fallback sample books if backend is offline
      const fallbackList = [
        {
          id: 101,
          title: "Artificial Intelligence & Neural Networks",
          subtitle: "A Comprehensive Modern Approach",
          author: "Dr. K. V. Subbarao & Prof. R. Sharma",
          authors: ["Dr. K. V. Subbarao", "Prof. R. Sharma"],
          category: "CSE Curriculum",
          dept: "CSE",
          cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
          desc: "Comprehensive academic guide covering machine learning algorithms, deep neural network architectures, transformers, and practical Python laboratory exercises.",
          year: 2026,
          type: "textbook",
          rating: "4.9",
          total_pages: 540,
          chapters: generateRichChapters("Artificial Intelligence & Neural Networks", "CSE")
        },
        {
          id: 102,
          title: "CMOS Digital Integrated Circuit Design",
          subtitle: "VLSI Architecture & Microelectronics",
          author: "Dr. M. Nageswara Rao",
          authors: ["Dr. M. Nageswara Rao"],
          category: "ECE Curriculum",
          dept: "ECE",
          cover: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80",
          desc: "In-depth treatment of semiconductor device physics, MOSFET scaling, synthesizable Verilog HDL architectures, and low-power IC layout principles.",
          year: 2025,
          type: "reference",
          rating: "4.8",
          total_pages: 480,
          chapters: generateRichChapters("CMOS Digital Integrated Circuit Design", "ECE")
        },
        {
          id: 103,
          title: "High Voltage Transmission & Power Grid Dynamics",
          subtitle: "Grid Stability & Renewable Integration",
          author: "Prof. S. Ramakrishna",
          authors: ["Prof. S. Ramakrishna"],
          category: "EEE Curriculum",
          dept: "EEE",
          cover: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&auto=format&fit=crop&q=80",
          desc: "Essential principles of modern smart grid systems, high-voltage AC/DC power transmission line design, transient stability, and FACTS controllers.",
          year: 2026,
          type: "textbook",
          rating: "4.7",
          total_pages: 420,
          chapters: generateRichChapters("High Voltage Transmission", "EEE")
        },
        {
          id: 104,
          title: "Robotics, Mechatronics & Fluid Mechanics",
          subtitle: "Industrial Automation & Thermal Engineering",
          author: "Dr. P. V. Prasad",
          authors: ["Dr. P. V. Prasad"],
          category: "MECH Curriculum",
          dept: "MECH",
          cover: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&auto=format&fit=crop&q=80",
          desc: "Thorough study of mechanical design, CAD/CAM kinematics, thermodynamic cycles, hydraulic machinery, and automated robotic systems.",
          year: 2025,
          type: "textbook",
          rating: "4.8",
          total_pages: 510,
          chapters: generateRichChapters("Robotics & Mechatronics", "MECH")
        },
        {
          id: 105,
          title: "Advanced Structural Engineering & Seismic Design",
          subtitle: "Reinforced Concrete & Foundation Analysis",
          author: "Dr. G. Hanumantha Rao",
          authors: ["Dr. G. Hanumantha Rao"],
          category: "CIVIL Curriculum",
          dept: "CIVIL",
          cover: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop&q=80",
          desc: "Structural mechanics, earthquake-resistant design methodologies, soil load-bearing capacity, and reinforced concrete beam analysis.",
          year: 2026,
          type: "textbook",
          rating: "4.9",
          total_pages: 600,
          chapters: generateRichChapters("Advanced Structural Engineering", "CIVIL")
        },
        {
          id: 106,
          title: "Pharmacology & Molecular Drug Discovery",
          subtitle: "Medicinal Chemistry & Biopharmaceutics",
          author: "Dr. A. Lakshmi Devi",
          authors: ["Dr. A. Lakshmi Devi"],
          category: "PHARM Curriculum",
          dept: "PHARM",
          cover: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&auto=format&fit=crop&q=80",
          desc: "Explores active pharmaceutical ingredient synthesis, receptor kinetics, drug delivery systems, and biopharmaceutical compliance standard protocols.",
          year: 2025,
          type: "journal",
          rating: "4.9",
          total_pages: 460,
          chapters: generateRichChapters("Pharmacology & Molecular Drug Discovery", "PHARM")
        }
      ];
      setBooks(fallbackList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooksData();
  }, []);

  // Auth Handling
  const login = (rollNumber, role = 'student') => {
    const userSession = {
      rollNumber,
      role,
      name: role === 'admin' ? 'Administrator' : `Student (${rollNumber})`,
      loggedInAt: new Date().toISOString()
    };
    setUser(userSession);
    try {
      localStorage.setItem('nri_user_session', JSON.stringify(userSession));
    } catch (e) {}
    showToast(`Logged in successfully as ${userSession.name}`, 'success');
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('nri_user_session');
    } catch (e) {}
    showToast('Logged out of session', 'info');
  };

  // Open / Close Modals
  const openBookDetails = (book) => {
    setSelectedBook(book);
    setActiveModal('details');
  };

  const openInteractiveReader = (book) => {
    setReaderBook(book);
    setActiveModal('reader');
  };

  const closeModals = () => {
    setActiveModal(null);
  };

  // Filtered & Sorted Books
  const filteredBooks = books.filter(book => {
    const matchesDept = currentDept === 'all' || (book.dept || '').toUpperCase() === currentDept.toUpperCase();
    const matchesType = currentType === 'all' || (book.type || '').toLowerCase() === currentType.toLowerCase();
    
    if (!matchesDept || !matchesType) return false;

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase().trim();
    const titleMatch = (book.title || '').toLowerCase().includes(q);
    const authorMatch = (book.author || '').toLowerCase().includes(q);
    const descMatch = (book.desc || book.description || '').toLowerCase().includes(q);
    const deptMatch = (book.dept || '').toLowerCase().includes(q);

    return titleMatch || authorMatch || descMatch || deptMatch;
  }).sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    } else if (sortBy === 'rating') {
      return (parseFloat(b.rating || 0)) - (parseFloat(a.rating || 0));
    } else if (sortBy === 'popular') {
      return (b.total_pages || 0) - (a.total_pages || 0);
    } else {
      // 'latest'
      return (b.year || 0) - (a.year || 0);
    }
  });

  const value = {
    books,
    setBooks,
    filteredBooks,
    loading,
    error,
    reloadBooks: fetchBooksData,

    // Filters
    currentDept,
    setCurrentDept,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    currentType,
    setCurrentType,

    // Shelf
    shelf,
    toggleSaveBook,
    isInShelf,
    clearShelf,

    // Theme
    theme,
    toggleTheme,

    // Auth
    user,
    login,
    logout,

    // Modals
    activeModal,
    setActiveModal,
    selectedBook,
    setSelectedBook,
    readerBook,
    setReaderBook,
    activeReviewBook,
    setActiveReviewBook,
    activeEditBook,
    setActiveEditBook,
    openBookDetails,
    openInteractiveReader,
    closeModals,

    // Feedback
    toast,
    showToast,
    confirmState,
    showConfirm,
    closeConfirm
  };

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  );
};
