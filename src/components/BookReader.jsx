import React, { useEffect, useRef, useState } from "react";
import { useLibrary } from "../context/LibraryContext.jsx";
import { generateRichChapters } from "../utils/chapterGenerator.js";

export const BookReader = ({
  book,
  isOpen,
  onClose,
}) => {
  const libraryContext = useLibrary ? useLibrary() : {};
  const { toggleSaveBook } = libraryContext || {};

  const readerWindowRef = useRef(null);

  const [tocOpen, setTocOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("toc");
  const [readerTheme, setReaderTheme] = useState("light");
  const [search, setSearch] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  const pdfSource = book?.pdfUrl || book?.pdf || book?.file || book?.pdf_path;
  const [pdfCurrentUrl, setPdfCurrentUrl] = useState(pdfSource);

  // State for toggling between PDF iframe and Rich Interactive HTML Chapters
  const [usePdfView, setUsePdfView] = useState(Boolean(pdfSource));
  const [pdfLoadError, setPdfLoadError] = useState(false);

  const rawChapters = (Array.isArray(book?.chapters) && book.chapters.length > 0)
    ? book.chapters
    : generateRichChapters(book?.title || "Academic Course Material", book?.dept || "CSE");
  const chapters = rawChapters;

  const activeChapter = chapters[currentChapterIndex] || {
    title: book?.title || "Academic Chapter",
    content: `<div class="reader-chapter-title">${book?.title || 'Academic Volume'}</div><p>${book?.desc || book?.description || 'Full interactive academic reader volume loaded.'}</p>`
  };

  useEffect(() => {
    setUsePdfView(Boolean(pdfSource));
    setPdfCurrentUrl(pdfSource);
    setPdfLoadError(false);
  }, [book, pdfSource]);

  const navigateToChapter = (idx) => {
    setCurrentChapterIndex(idx);
    const targetChapter = chapters[idx];
    if (targetChapter && pdfSource) {
      const pageNum = targetChapter.start_page || targetChapter.pageStart || (idx * 25 + 1);
      const cleanBase = pdfSource.split('#')[0];
      setPdfCurrentUrl(`${cleanBase}#page=${pageNum}`);
    }
  };

  /*
   * ============================================================
   * CLOSE / ESCAPE
   * ============================================================
   */

  useEffect(() => {
    if (!isOpen) return;

    document.body.classList.add("no-scroll");

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (
        event.key.toLowerCase() === "f" &&
        !event.target.matches("input, textarea, select")
      ) {
        toggleFullscreen();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.classList.remove("no-scroll");
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  /*
   * ============================================================
   * FULLSCREEN
   * ============================================================
   */

  const toggleFullscreen = async () => {
    try {
      const element = readerWindowRef.current;

      if (!element) return;

      if (!document.fullscreenElement) {
        await element.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        Boolean(document.fullscreenElement)
      );
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  /*
   * ============================================================
   * READER THEME
   * Original HTML supports:
   * light → sepia → dark
   * ============================================================
   */

  const cycleReaderTheme = () => {
    setReaderTheme((current) => {
      if (current === "light") return "sepia";
      if (current === "sepia") return "dark";
      return "light";
    });
  };

  const readerThemeText = {
    light: "Light",
    sepia: "Sepia",
    dark: "Dark",
  };

  /*
   * ============================================================
   * TOC
   * ============================================================
   */

  const toggleToc = () => {
    setTocOpen((current) => !current);
  };

  const closeReaderTocDrawer = () => {
    setTocOpen(false);
  };

  const switchReaderSidebarTab = (tab) => {
    setSidebarTab(tab);
  };

  /*
   * ============================================================
   * SEARCH
   * ============================================================
   */

  const handleReaderSearch = (event) => {
    setSearch(event.target.value);
  };

  const handleReaderSearchKey = (event) => {
    if (event.key === "Escape") {
      setSearch("");
    }

    if (event.key === "Enter") {
      console.log("Search:", search);
    }
  };

  /*
   * ============================================================
   * BOOKMARK
   * ============================================================
   */

  const handleBookmark = () => {
    if (toggleSaveBook && book) {
      toggleSaveBook(book);
    } else {
      console.log("Book saved:", book);
    }
  };

  /*
   * ============================================================
   * CLOSE
   * ============================================================
   */

  const handleClose = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error(error);
    }

    setIsFullscreen(false);
    setTocOpen(false);
    setSearch("");

    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="reader-modal-overlay active"
      id="interactiveReaderModal"
      data-reader-theme={readerTheme}
    >
      <div
        className={`reader-window ${
          isFullscreen ? "is-fullscreen" : ""
        }`}
        ref={readerWindowRef}
      >

        {/* ======================================================
            READER HEADER BAR
        ======================================================= */}

        <div className="reader-header">

          <div className="reader-header-info">

            {/* TOC BUTTON */}

            <button
              className="reader-tool-btn"
              id="toggleTocBtn"
              title="Toggle Table of Contents Sidebar"
              onClick={toggleToc}
            >
              <svg
                className="icon"
                viewBox="0 0 24 24"
              >
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
              </svg>

              TOC
            </button>


            {/* BOOK TITLE + AUTHOR */}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span
                className="reader-book-title"
                id="readerBookTitle"
              >
                {book?.title || "Book Title Loading..."}
              </span>

              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-dim)",
                }}
                id="readerBookAuthor"
              >
                {book?.author || "Author Name"}
              </span>
            </div>

          </div>


          {/* ==================================================
              READER TOOLBAR
          =================================================== */}

          <div className="reader-toolbar">

            {/* SEARCH */}

            <div
              className="reader-search-wrap"
              id="readerSearchWrap"
            >

              <svg
                className="icon"
                viewBox="0 0 24 24"
                style={{
                  fontSize: "16px",
                  color: "var(--accent-orange)",
                  flexShrink: 0,
                }}
              >
                <path
                  d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5
                  6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59
                  4.23-1.57l.27.28v.79l5 4.99L20.49 19
                  l-4.99-5zm-6 0C7.01 14 5 11.99 5
                  9.5S7.01 5 9.5 5 14 7.01 14 9.5
                  11.99 14 9.5 14z"
                />
              </svg>

              <input
                type="text"
                id="readerSearchInput"
                className="reader-search-input"
                placeholder="Search chapters, text, or page (e.g. 12, Solids)..."
                value={search}
                onChange={handleReaderSearch}
                onKeyDown={handleReaderSearchKey}
              />


              {/* SEARCH MATCH COUNT */}

              {search && (
                <span
                  id="readerSearchMatchesCount"
                  className="reader-search-badge"
                  title="Click to view all matches in book"
                >
                  0 in book
                </span>
              )}


              {/* PREVIOUS SEARCH MATCH */}

              {search && (
                <button
                  className="reader-search-nav-btn"
                  id="readerSearchPrevBtn"
                  title="Previous match in book (Shift+Enter)"
                  onClick={() =>
                    console.log("Previous match")
                  }
                >
                  <svg
                    className="icon"
                    viewBox="0 0 24 24"
                    style={{ fontSize: "16px" }}
                  >
                    <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z" />
                  </svg>
                </button>
              )}


              {/* NEXT SEARCH MATCH */}

              {search && (
                <button
                  className="reader-search-nav-btn"
                  id="readerSearchNextBtn"
                  title="Next match in book (Enter)"
                  onClick={() =>
                    console.log("Next match")
                  }
                >
                  <svg
                    className="icon"
                    viewBox="0 0 24 24"
                    style={{ fontSize: "16px" }}
                  >
                    <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z" />
                  </svg>
                </button>
              )}


              {/* ALL CHAPTERS */}

              {search && (
                <button
                  className="reader-all-search-btn"
                  id="readerSearchAllBtn"
                  title="View all chapters with matches"
                  onClick={() =>
                    console.log("Show all matches")
                  }
                >
                  All Chs
                </button>
              )}


              {/* GLOBAL SEARCH RESULTS */}

              <div
                className="reader-search-results-panel"
                id="readerGlobalSearchResultsPanel"
              >
                <div id="readerGlobalSearchResultsList">
                  {/* Dynamically populated */}
                </div>
              </div>

            </div>


            {/* MOBILE MENU BUTTON */}

            <button
              className={`reader-tool-btn reader-menu-btn ${mobileToolsOpen ? "active" : ""}`}
              id="readerMenuBtn"
              title="More Reading Tools"
              onClick={() => setMobileToolsOpen((prev) => !prev)}
            >
              <svg
                className="icon"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2
                  .9-2 2 .9 2 2 2zm0 2c-1.1 0-2
                  .9-2 2s.9 2 2 2 2-.9 2-2-.9-2
                  -2-2zm0 6c-1.1 0-2 .9-2 2s.9
                  2 2 2 2-.9 2-2-.9-2-2-2z"
                />
              </svg>
            </button>


            {/* ==================================================
                COLLAPSIBLE TOOLS
            =================================================== */}

            <div
              className={`reader-collapsible-tools ${mobileToolsOpen ? "active" : ""}`}
              id="readerCollapsibleTools"
            >

              {/* READER THEME */}

              <button
                className="reader-tool-btn"
                id="readerThemeBtn"
                title="Cycle Reading Theme (Light / Sepia / Dark)"
                onClick={cycleReaderTheme}
              >
                <svg
                  className="icon"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 3c-4.97 0-9 4.03-9 9s4.03
                    9 9 9 9-4.03 9-9c0-.46-.04-.92
                    -.1-1.36-.98 1.37-2.58 2.26-4.4
                    2.26-2.98 0-5.4-2.42-5.4-5.4
                    0-1.81.89-3.42 2.26-4.4
                    -.44-.06-.9-.1-1.36-.1z"
                  />
                </svg>

                <span id="readerThemeText">
                  {readerThemeText[readerTheme]}
                </span>
              </button>


              {/* CHAPTER SELECTOR */}

              <select
                className="reader-tool-btn"
                id="chapterSelector"
                title="Select Chapter"
                style={{
                  padding: "6px 10px",
                  cursor: "pointer",
                  width: "100%",
                }}
                value={currentChapterIndex}
                onChange={(event) => {
                  const idx = Number(event.target.value);
                  navigateToChapter(idx);
                }}
              >
                {chapters.map((ch, idx) => (
                  <option key={idx} value={idx}>
                    {ch.title}
                  </option>
                ))}
              </select>


              {/* BOOKMARK */}

              <button
                className="reader-tool-btn"
                id="readerBookmarkBtn"
                title="Save to My Bookshelf"
                onClick={handleBookmark}
              >
                <svg
                  className="icon"
                  viewBox="0 0 24 24"
                >
                  <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                </svg>

                Save
              </button>


              {/* FULLSCREEN */}

              <button
                className="reader-tool-btn"
                id="readerFullscreenBtn"
                title="Toggle Fullscreen Reading Mode (Shortcut: F)"
                onClick={toggleFullscreen}
              >
                <svg
                  className="icon"
                  id="fullscreenIcon"
                  viewBox="0 0 24 24"
                >
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>

                <span id="fullscreenBtnText">
                  {isFullscreen
                    ? "Exit Fullscreen"
                    : "Fullscreen"}
                </span>
              </button>

            </div>


            {/* CLOSE READER */}

            <button
              className="btn-icon"
              id="closeReaderBtn"
              title="Exit E-Book Reader"
              onClick={handleClose}
            >
              <svg
                className="icon"
                viewBox="0 0 24 24"
              >
                <path
                  d="M19 6.41L17.59 5 12
                  10.59 6.41 5 5 6.41 10.59
                  12 5 17.59 6.41 19 19
                  17.59 13.41 12z"
                />
              </svg>
            </button>

          </div>

        </div>


        {/* ======================================================
            READER BODY
        ======================================================= */}

        <div
          className={`reader-body-layout ${tocOpen ? "toc-drawer-open" : ""}`}
          id="readerBodyLayout"
          style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
        >

          {/* TOC BACKDROP */}

          <div
            className={`reader-toc-backdrop ${
              tocOpen ? "active" : ""
            }`}
            id="readerTocBackdrop"
            onClick={closeReaderTocDrawer}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.45)',
              zIndex: 9999,
              display: tocOpen ? 'block' : 'none',
              opacity: tocOpen ? 1 : 0,
              pointerEvents: tocOpen ? 'auto' : 'none',
              transition: 'opacity 0.25s ease'
            }}
          />


          {/* ==================================================
              TABLE OF CONTENTS SIDEBAR
          =================================================== */}

          <div
            className={`reader-toc-sidebar ${
              tocOpen ? "active toc-drawer-open" : ""
            }`}
            id="readerTocSidebar"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 'min(360px, 85vw)',
              height: '100%',
              zIndex: 10000,
              background: readerTheme === 'dark' ? '#0f172a' : (readerTheme === 'sepia' ? '#f3e5ca' : '#ffffff'),
              borderRight: '1px solid var(--border-light)',
              transform: tocOpen ? 'translateX(0)' : 'translateX(-105%)',
              visibility: tocOpen ? 'visible' : 'hidden',
              pointerEvents: tocOpen ? 'auto' : 'none',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '10px 0 35px rgba(0, 0, 0, 0.35)',
              transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
              overflowY: 'hidden'
            }}
          >

            {/* SIDEBAR TABS */}

            <div className="reader-sidebar-tabs">

              <button
                id="tocTabBtn"
                className={`sidebar-tab-btn ${
                  sidebarTab === "toc"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  switchReaderSidebarTab("toc")
                }
              >
                Table of Contents
              </button>


              <button
                id="figuresTabBtn"
                className={`sidebar-tab-btn ${
                  sidebarTab === "figures"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  switchReaderSidebarTab("figures")
                }
              >
                Figures (
                <span id="readerFiguresCount">
                  0
                </span>
                )
              </button>


              {/* DRAWER CLOSE */}

              <button
                className="reader-drawer-close-btn"
                title="Close Table of Contents"
                onClick={closeReaderTocDrawer}
              >
                &times;
              </button>

            </div>


            {/* TOC LIST */}

            {sidebarTab === "toc" && (
              <div id="tocItemList" style={{ padding: '14px', overflowY: 'auto', flex: 1 }}>
                {chapters.map((ch, idx) => {
                  const pageNum = ch.start_page || ch.pageStart || (idx * 25 + 1);
                  const isCurrent = currentChapterIndex === idx;
                  return (
                    <div
                      key={idx}
                      className={`toc-item ${isCurrent ? 'active' : ''}`}
                      style={{
                        padding: '12px 14px',
                        marginBottom: '8px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center',
                        background: isCurrent ? 'rgba(237, 107, 16, 0.12)' : 'var(--bg-card)',
                        border: isCurrent ? '1.5px solid var(--accent-orange)' : '1px solid var(--border-light)',
                        color: isCurrent ? 'var(--accent-orange-bright)' : 'var(--text-main)',
                        fontWeight: isCurrent ? 700 : 500,
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => {
                        navigateToChapter(idx);
                        closeReaderTocDrawer();
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingRight: '8px' }}>
                        <span style={{ fontSize: '0.88rem', lineHeight: 1.35 }}>
                          {ch.title}
                        </span>
                        <span style={{ fontSize: '0.74rem', opacity: 0.7 }}>
                          Chapter {idx + 1}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          padding: '3px 8px',
                          background: 'rgba(237, 107, 16, 0.15)',
                          color: 'var(--accent-orange-bright)',
                          borderRadius: '6px',
                          fontWeight: 700,
                          flexShrink: 0
                        }}
                      >
                        p. {pageNum}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}


            {/* FIGURES */}

            {sidebarTab === "figures" && (
              <div
                id="figuresGalleryList"
                className="figures-gallery-grid"
                style={{ padding: '16px' }}
              >
                <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  No figures extracted from this document.
                </div>
              </div>
            )}

          </div>


          {/* ==================================================
              MAIN READER VIEWPORT
          =================================================== */}

          <div
            className="reader-viewport"
            id="readerViewport"
            style={{
              padding: 0,
              overflow: "hidden",
              background: readerTheme === 'dark' ? '#0f172a' : (readerTheme === 'sepia' ? '#fbf0d9' : '#1e293b'),
              width: "100%",
              height: "100%",
              flex: 1,
              minHeight: 0,
              position: "relative",
            }}
          >

            {/* PDF SEARCH HIGHLIGHT BAR */}

            <div
              id="readerSearchHighlightBar"
              className="reader-search-highlight-bar"
            >

              <span
                className="search-hl-label"
                style={{
                  fontWeight: 600,
                  fontSize: "0.76rem",
                  color: "var(--text-muted)",
                }}
              >
                PDF Search:
              </span>


              <mark
                id="searchHlQueryText"
                className="search-hl-query"
              >
                {search || "keyword"}
              </mark>


              <span
                id="searchHlCounterText"
                className="search-hl-counter"
              >
                Page 1 • Match 1 of 1
              </span>


              <button
                className="search-hl-nav-btn"
                onClick={() =>
                  console.log("Previous PDF match")
                }
                title="Previous match in book"
              >
                ▲ Prev
              </button>


              <button
                className="search-hl-nav-btn"
                onClick={() =>
                  console.log("Next PDF match")
                }
                title="Next match in book"
              >
                ▼ Next
              </button>


              <button
                className="search-hl-list-btn"
                onClick={() =>
                  console.log("All matching pages")
                }
                title="View all matching pages"
              >
                All Matches
              </button>


              <button
                className="search-hl-close-btn"
                onClick={() => setSearch("")}
                title="Clear Search (Esc)"
              >
                ✕
              </button>

            </div>


            {/* ==================================================
                PDF OR INTERACTIVE CHAPTER READER VIEW
            =================================================== */}

            <div
              className="reader-pdf-view"
              id="readerPdfView"
              style={{
                width: "100%",
                height: "100%",
                minHeight: 0,
                flex: 1,
                display: "flex",
                flexDirection: "column",
                background: readerTheme === 'dark' ? '#0f172a' : (readerTheme === 'sepia' ? '#fbf0d9' : '#1e293b'),
                borderRadius: 0,
                margin: 0,
                padding: 0,
              }}
            >

              {usePdfView && pdfSource && !pdfLoadError ? (
                <iframe
                  id="readerPdfFrame"
                  title="PDF Document Viewer"
                  frameBorder="0"
                  src={pdfCurrentUrl || pdfSource}
                  onError={() => {
                    setPdfLoadError(true);
                    setUsePdfView(false);
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: 0,
                    flex: 1,
                    border: "none",
                    borderRadius: 0,
                    display: "block",
                    margin: 0,
                    padding: 0,
                    background: "#1e293b",
                  }}
                />
              ) : (
                <div 
                  className="reader-paper"
                  style={{ 
                    maxWidth: '820px', 
                    width: '90%',
                    margin: '32px auto', 
                    padding: '40px',
                    borderRadius: '16px',
                    background: readerTheme === 'dark' ? '#1e293b' : (readerTheme === 'sepia' ? '#fff9eb' : '#ffffff'),
                    color: readerTheme === 'dark' ? '#f8fafc' : (readerTheme === 'sepia' ? '#433422' : '#0f172a'),
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                    overflowY: 'auto',
                    height: 'calc(100% - 64px)'
                  }}
                >
                  {pdfLoadError && (
                    <div style={{ padding: '12px 16px', background: 'rgba(237, 107, 16, 0.15)', color: 'var(--accent-orange-bright)', borderRadius: '10px', marginBottom: '20px', fontSize: '0.88rem', fontWeight: 600 }}>
                      ℹ️ PDF server endpoint offline — automatically showing Interactive Chapter View below:
                    </div>
                  )}

                  <article className="reader-page-content">
                    {activeChapter.title && (
                      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '20px' }}>
                        {activeChapter.title}
                      </h1>
                    )}
                    {activeChapter.content && (
                      <div dangerouslySetInnerHTML={{ __html: activeChapter.content }} />
                    )}
                  </article>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default BookReader;
