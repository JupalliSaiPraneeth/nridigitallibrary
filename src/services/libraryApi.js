/**
 * Digital Library API Service
 * Secure Gateway for College Server Book Storage (75GB+)
 */

// Environment Variable: Configurable via Vite (.env) or window override
export const resolveApiUrl = () => {
  // 1. Highest priority: Build-time / runtime environment variable (Vercel Production)
  try {
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_LIBRARY_API_URL) {
      const envVal = import.meta.env.VITE_LIBRARY_API_URL;
      if (envVal && !envVal.includes("8000")) return envVal.replace(/\/+$/, "");
    }
  } catch (e) {}

  if (typeof window !== "undefined") {
    const isVercel = window.location.hostname.includes(".vercel.app") || window.location.protocol === "https:";

    // 2. Check localStorage, but ignore stale private LAN IPs if on production HTTPS/Vercel
    try {
      const stored = window.localStorage ? window.localStorage.getItem("VITE_LIBRARY_API_URL") : null;
      if (stored && !stored.includes("8000")) {
        const isLocalStored = stored.includes("localhost") || stored.includes("127.0.0.1") || stored.includes("192.168.") || stored.includes("172.11.");
        if (!isVercel || !isLocalStored) {
          return stored.replace(/\/+$/, "");
        }
      }
    } catch (e) {}

    // 3. Window globals
    if (window.VITE_LIBRARY_API_URL && !window.VITE_LIBRARY_API_URL.includes("8000")) {
      return window.VITE_LIBRARY_API_URL.replace(/\/+$/, "");
    }
    if (window.LIBRARY_API_URL && !window.LIBRARY_API_URL.includes("8000")) {
      return window.LIBRARY_API_URL.replace(/\/+$/, "");
    }

    // 4. Localhost dev server
    const hostname = window.location.hostname;
    const port = window.location.port;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return (port === "5000" || port === "5001" || port === "5002") ? window.location.origin : "http://localhost:5002";
    }
  }

  return "http://localhost:5002";
};

export const API_URL = resolveApiUrl();

/**
 * Maps fields from server response to the existing frontend book model.
 * Uses secure ID-based endpoints:
 * - Read/Stream:  /api/books/{book_id}/file
 * - Download:     /api/books/{book_id}/download
 */
export function mapBookToFrontendModel(book, customApiUrl) {
  if (!book) return null;
  const currentApiUrl = customApiUrl || resolveApiUrl();

  const deptMap = {
    "computer science": "CSE",
    "information technology": "CSE",
    "cse": "CSE",
    "python": "CSE",
    "programming": "CSE",
    "data structure": "CSE",
    "algorithm": "CSE",
    "software": "CSE",
    "electronics": "ECE",
    "communication": "ECE",
    "ece": "ECE",
    "vlsi": "ECE",
    "electrical": "EEE",
    "eee": "EEE",
    "mechanical": "MECH",
    "mech": "MECH",
    "civil": "CIVIL",
    "bridge": "CIVIL",
    "structural": "CIVIL",
    "pharmacy": "PHARM",
    "pharm": "PHARM",
    "management": "MBA",
    "business": "MBA",
    "mba": "MBA"
  };

  const textToScan = `${book.category || ''} ${book.dept || ''} ${book.title || ''} ${book.fileName || ''}`.toLowerCase();
  let resolvedDept = book.dept || "";
  if (!resolvedDept) {
    for (const [key, val] of Object.entries(deptMap)) {
      if (textToScan.includes(key)) {
        resolvedDept = val;
        break;
      }
    }
    if (!resolvedDept) resolvedDept = "CSE";
  }

  const authorName = book.author || (Array.isArray(book.authors) && book.authors.length ? book.authors.join(", ") : "Academic Scholars");
  const authorsList = Array.isArray(book.authors) && book.authors.length ? book.authors : [authorName];

  // Resolve ID-based secure file streaming and download URLs
  let fileUrl = "";
  if (book.id) {
    fileUrl = `${currentApiUrl}/api/books/${book.id}/file`;
  } else if (book.url || book.file || book.pdf_path || book.pdfUrl) {
    fileUrl = book.url || book.file || book.pdf_path || book.pdfUrl;
    if (fileUrl.startsWith("/") && !fileUrl.startsWith("//")) {
      fileUrl = `${currentApiUrl}${fileUrl}`;
    }
  }

  const downloadUrl = book.id ? `${currentApiUrl}/api/books/${book.id}/download` : fileUrl;

  let coverUrl = book.cover || book.cover_url || "";
  if (coverUrl && coverUrl.startsWith("/") && !coverUrl.startsWith("//")) {
    coverUrl = `${currentApiUrl}${coverUrl}`;
  }

  const pageCount = book.total_pages || book.pagesCount || 100;
  const description = book.description || book.desc || book.short_description || `Authentic academic volume on ${book.title || "course curriculum"} hosted on digital library server.`;
  const shortDesc = book.short_description || book.desc || description;

  return {
    id: book.id,
    title: book.title || "Untitled Book",
    subtitle: book.subtitle || "",
    author: authorName,
    authors: authorsList,
    category: book.category || (resolvedDept + " Curriculum"),
    dept: resolvedDept,
    cover: coverUrl,
    cover_url: coverUrl,
    file: fileUrl,
    pdf_path: fileUrl,
    pdfUrl: fileUrl,
    url: fileUrl,
    file_url: fileUrl,
    download_url: downloadUrl,
    downloadUrl: downloadUrl,
    fileName: book.fileName || "",
    fileType: book.fileType || "pdf",
    fileSize: book.fileSize || 0,
    desc: description,
    description: description,
    short_description: shortDesc,
    total_pages: pageCount,
    pagesCount: pageCount,
    year: book.year || book.publication_year || 2026,
    type: book.type || "textbook",
    publisher: book.publisher || "NRI Institute of Technology Academic Press",
    edition: book.edition || "1st Edition",
    isbn: book.isbn || "",
    chapters: Array.isArray(book.chapters) ? book.chapters : [],
    features: Array.isArray(book.features) && book.features.length ? book.features : [
      `Core curriculum principles and laboratory exercises in ${resolvedDept}`,
      `Authentic library volume: ${book.title || "Curriculum Resource"}`,
      "Streamed directly from digital library book server",
      "Interactive reader integration with high-resolution document viewing"
    ]
  };
}

/**
 * Fetch books from the Server REST API with automatic candidate port fallback.
 * Uses isolated per-candidate AbortControllers so a slow remote host never aborts other candidates.
 */
export async function getBooks() {
  const activeApiUrl = resolveApiUrl();

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Candidate order:
  let candidateUrls = [];
  if (isHttps) {
    // Production Vercel HTTPS environment - strictly use HTTPS configured domain
    candidateUrls = [activeApiUrl];
  } else if (isLocalhost) {
    // In local development, probe local running instances first before slow/unreachable external LAN IPs
    const localPorts = [
      'http://localhost:5002',
      'http://localhost:5000',
      'http://localhost:5001',
      'http://localhost:8000',
      'http://127.0.0.1:5002',
      'http://127.0.0.1:5000'
    ];
    if (activeApiUrl.includes('localhost') || activeApiUrl.includes('127.0.0.1')) {
      candidateUrls = [activeApiUrl, ...localPorts];
    } else {
      candidateUrls = [...localPorts, activeApiUrl];
    }
  } else {
    candidateUrls = [activeApiUrl, 'http://localhost:5002', 'http://localhost:5000'];
  }

  // Deduplicate
  candidateUrls = Array.from(new Set(candidateUrls.filter(Boolean)));

  let lastError = null;

  for (const baseUrl of candidateUrls) {
    const candidateController = new AbortController();
    // 2500ms timeout per host ensures quick fallback if a remote IP is unreachable
    const candidateTimer = setTimeout(() => {
      try { candidateController.abort(); } catch (e) {}
    }, 2500);

    try {
      const response = await fetch(`${baseUrl}/api/books`, {
        signal: candidateController.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      clearTimeout(candidateTimer);

      if (response.ok) {
        const data = await response.json();
        const rawList = Array.isArray(data) ? data : (Array.isArray(data?.books) ? data.books : []);
        if (baseUrl !== activeApiUrl && typeof window !== 'undefined' && !isHttps) {
          window.VITE_LIBRARY_API_URL = baseUrl;
          try { localStorage.setItem('VITE_LIBRARY_API_URL', baseUrl); } catch (e) {}
        }
        return rawList.map(b => mapBookToFrontendModel(b, baseUrl));
      }
    } catch (err) {
      clearTimeout(candidateTimer);
      lastError = err;
      // Do not fail entirely if one candidate times out; try next candidate
    }
  }

  if (isHttps && activeApiUrl.startsWith('http:')) {
    throw new Error(`HTTPS Mixed Content Protection: Cannot fetch insecure HTTP API (${activeApiUrl}) from HTTPS site (${window.location.origin}). Configure HTTPS via Cloudflare Tunnel or NGINX.`);
  }
  throw lastError || new Error('Failed to connect to digital library backend API.');
}

// Expose on global window object for browser script tag compatibility
if (typeof window !== "undefined") {
  window.LibraryApi = {
    get API_URL() { return resolveApiUrl(); },
    set API_URL(val) {
      if (val) {
        try { localStorage.setItem("VITE_LIBRARY_API_URL", val); } catch (e) {}
        window.VITE_LIBRARY_API_URL = val;
        window.LIBRARY_API_URL = val;
      }
    },
    getBooks,
    mapBookToFrontendModel,
    resolveApiUrl
  };
  window.getBooks = getBooks;
  window.LIBRARY_API_URL = resolveApiUrl();
}
