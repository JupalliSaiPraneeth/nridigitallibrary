/**
 * Local Laptop Digital Library API Service
 * Fetches book catalog data from the local Express server or deployed host.
 */

// Environment Variable: Configurable via Vite or window override
// Environment Variable: Configurable via Vite or window override
export const resolveApiUrl = () => {
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage ? window.localStorage.getItem("VITE_LIBRARY_API_URL") : null;
      if (stored && !stored.includes("8000")) {
        return stored.replace(/\/+$/, "");
      }
    } catch (e) {}

    if (window.VITE_LIBRARY_API_URL && !window.VITE_LIBRARY_API_URL.includes("8000")) {
      return window.VITE_LIBRARY_API_URL.replace(/\/+$/, "");
    }
    if (window.LIBRARY_API_URL && !window.LIBRARY_API_URL.includes("8000")) {
      return window.LIBRARY_API_URL.replace(/\/+$/, "");
    }

    const hostname = window.location.hostname;
    const port = window.location.port;
    if ((hostname === "localhost" || hostname === "127.0.0.1")) {
      return (port === "5000" || port === "5001") ? window.location.origin : "http://localhost:5001";
    }
  }

  try {
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_LIBRARY_API_URL) {
      const envVal = import.meta.env.VITE_LIBRARY_API_URL;
      if (envVal && !envVal.includes("8000")) return envVal.replace(/\/+$/, "");
    }
  } catch (e) {}

  return "http://localhost:5001";
};

export const API_URL = resolveApiUrl();

/**
 * Maps fields from server response to the existing frontend book model.
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

  let fileUrl = book.url || book.file || book.pdf_path || book.pdfUrl || "";
  if (fileUrl && fileUrl.startsWith("/") && !fileUrl.startsWith("//")) {
    fileUrl = `${currentApiUrl}${fileUrl}`;
  }

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
    fileName: book.fileName || "",
    fileType: book.fileType || "pdf",
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
 */
export async function getBooks(timeoutMs = 6000) {
  const activeApiUrl = resolveApiUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const candidateUrls = Array.from(new Set([
    activeApiUrl,
    'http://localhost:5001',
    'http://127.0.0.1:5001',
    'http://172.11.1.71:5000',
    'http://localhost:5000'
  ]));

  let lastError = null;

  try {
    for (const baseUrl of candidateUrls) {
      try {
        const response = await fetch(`${baseUrl}/api/books`, {
          signal: controller.signal
        });

        if (response.ok) {
          const data = await response.json();
          const rawList = Array.isArray(data) ? data : (Array.isArray(data?.books) ? data.books : []);
          if (baseUrl !== activeApiUrl && typeof window !== 'undefined') {
            window.VITE_LIBRARY_API_URL = baseUrl;
            try { localStorage.setItem('VITE_LIBRARY_API_URL', baseUrl); } catch (e) {}
          }
          return rawList.map(b => mapBookToFrontendModel(b, baseUrl));
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && activeApiUrl.startsWith('http:')) {
      throw new Error(`HTTPS Mixed Content Protection: Cannot fetch HTTP API (${activeApiUrl}) from HTTPS site (${window.location.origin}).`);
    }
    throw lastError || new Error('Failed to connect to digital library backend API.');
  } finally {
    clearTimeout(timer);
  }
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

