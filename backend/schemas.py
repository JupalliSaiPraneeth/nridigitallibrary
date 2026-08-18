from typing import List, Optional
from pydantic import BaseModel, Field
import datetime

class ChapterBase(BaseModel):
    chapter_number: int
    title: str
    description: Optional[str] = None
    start_page: int = 1
    end_page: int = 1
    content: str
    formatted_html: Optional[str] = None

class ChapterCreate(ChapterBase):
    pass

class ChapterUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_page: Optional[int] = None
    end_page: Optional[int] = None
    content: Optional[str] = None
    formatted_html: Optional[str] = None

class ChapterOut(ChapterBase):
    id: int
    book_id: int

    class Config:
        from_attributes = True

class BookBase(BaseModel):
    title: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    publisher: Optional[str] = None
    publication_year: Optional[str] = None
    edition: Optional[str] = None
    isbn: Optional[str] = None
    language: str = "English"
    category: str = "Computer Science & Engineering"
    department: str = "CSE"
    cover_url: Optional[str] = None
    total_pages: int = 0
    extraction_confidence: float = 95.0
    issues: List[str] = []
    authors: List[str] = []
    keywords: List[str] = []

class BookCreate(BookBase):
    chapters: List[ChapterCreate] = []

class BookUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    publisher: Optional[str] = None
    publication_year: Optional[str] = None
    edition: Optional[str] = None
    isbn: Optional[str] = None
    language: Optional[str] = None
    category: Optional[str] = None
    department: Optional[str] = None
    cover_url: Optional[str] = None
    authors: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    chapters: Optional[List[ChapterCreate]] = None

class BookOut(BookBase):
    id: int
    pdf_path: Optional[str] = None
    processing_status: str
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None
    chapters: List[ChapterOut] = []

    class Config:
        from_attributes = True

class IngestJobStatus(BaseModel):
    job_id: str
    book_id: Optional[int] = None
    stage_index: int = 1  # 1 to 11
    stage_name: str
    percent: int
    status: str  # PENDING, IN_PROGRESS, REVIEW_REQUIRED, COMPLETED, FAILED
    message: str
    error: Optional[str] = None
    book_preview: Optional[dict] = None

class SearchResult(BaseModel):
    book_id: int
    book_title: str
    book_author: str
    department: str
    cover_url: Optional[str] = None
    chapter_number: int
    chapter_title: str
    snippet: str
    match_count: int
