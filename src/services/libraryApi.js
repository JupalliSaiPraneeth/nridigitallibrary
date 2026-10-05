/**
 * Local Laptop Digital Library API Service
 * Fetches book catalog data from the local Express server or deployed host.
 */

// Environment Variable: Configurable via Vite or window override
const resolveApiUrl = () => {
  // If running on a deployed web domain (like onrender.com or vercel.app), use the deployed origin
  if (typeof window !== "undefined" && window.location.protocol.startsWith("http")) {
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1" && hostname !== "192.168.56.1") {
      return window.location.origin;
    }
  }

  try {
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_LIBRARY_API_URL) {
      const envVal = import.meta.env.VITE_LIBRARY_API_URL;
      if (envVal && !envVal.includes("8000")) return envVal.replace(/\/+$/, "");
    }
  } catch (e) {
    // import.meta not available in standard browser scripts
  }

  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage ? window.localStorage.getItem("VITE_LIBRARY_API_URL") : null;
      if (stored) {
        if (stored.includes("8000") || stored.includes("192.168.77.239")) {
          window.localStorage.removeItem("VITE_LIBRARY_API_URL");
        } else {
          return stored.replace(/\/+$/, "");
        }
      }
    } catch (e) {}

    if (window.VITE_LIBRARY_API_URL && !window.VITE_LIBRARY_API_URL.includes("8000")) {
      return window.VITE_LIBRARY_API_URL.replace(/\/+$/, "");
    }
    if (window.LIBRARY_API_URL && !window.LIBRARY_API_URL.includes("8000")) {
      return window.LIBRARY_API_URL.replace(/\/+$/, "");
    }
  }

  // Local laptop Express server address
  return "http://192.168.56.1:5001";
};

export const API_URL = resolveApiUrl();

/**
 * Maps fields from server response to the existing frontend book model.
 * Handles both the local laptop server format and the deployed server format.
 */
export function mapBookToFrontendModel(book) {
  if (!book) return null;

  // Department mapping based on title/category keywords
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

  // Direct server URL (e.g. http://192.168.56.1:5001/books/Python.pdf or /storage/pdfs/...)
  let fileUrl = book.url || book.file || book.pdf_path || book.pdfUrl || "";
  if (fileUrl && fileUrl.startsWith("/") && !fileUrl.startsWith("//")) {
    fileUrl = `${API_URL}${fileUrl}`;
  }

  let coverUrl = book.cover || book.cover_url || "";
  if (coverUrl && coverUrl.startsWith("/") && !coverUrl.startsWith("//")) {
    coverUrl = `${API_URL}${coverUrl}`;
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
 * Fetch books from the Server REST API.
 */
export async function getBooks(timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_URL}/api/books`, {
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch books: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data.map(mapBookToFrontendModel) : data;
  } catch (err) {
    if (API_URL.includes("192.168.56.1:5001")) {
      try {
        const fallbackRes = await fetch("http://127.0.0.1:5001/api/books", { signal: controller.signal });
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          return Array.isArray(data) ? data.map(mapBookToFrontendModel) : data;
        }
      } catch (e) {}
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Expose on global window object for browser script tag compatibility
if (typeof window !== "undefined") {
  window.LibraryApi = {
    API_URL,
    getBooks,
    mapBookToFrontendModel
  };
  window.getBooks = getBooks;
  window.LIBRARY_API_URL = API_URL;
}
