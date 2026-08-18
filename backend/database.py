import os
import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, Float, DateTime, ForeignKey, Table
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DB_PATH = os.path.join(os.path.dirname(__file__), "library.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Many-to-Many association for Book and Author
book_authors_association = Table(
    "book_authors",
    Base.metadata,
    Column("book_id", Integer, ForeignKey("books.id", ondelete="CASCADE"), primary_key=True),
    Column("author_id", Integer, ForeignKey("authors.id", ondelete="CASCADE"), primary_key=True),
)

class Author(Base):
    __tablename__ = "authors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)

    books = relationship("Book", secondary=book_authors_association, back_populates="authors")

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    subtitle = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    short_description = Column(Text, nullable=True)
    publisher = Column(String(255), nullable=True)
    publication_year = Column(String(50), nullable=True)
    edition = Column(String(100), nullable=True)
    isbn = Column(String(100), nullable=True, index=True)
    language = Column(String(50), default="English")
    category = Column(String(100), default="Computer Science & Engineering")
    department = Column(String(50), default="CSE", index=True)
    cover_url = Column(String(500), nullable=True)
    pdf_path = Column(String(500), nullable=True)
    file_hash = Column(String(64), nullable=True, index=True)
    total_pages = Column(Integer, default=0)
    processing_status = Column(
        String(50), default="REVIEW_REQUIRED", index=True
    )  # UPLOADING, PROCESSING, EXTRACTING, OCR_PROCESSING, REVIEW_REQUIRED, PUBLISHED, FAILED
    extraction_confidence = Column(Float, default=95.0)
    issues_json = Column(Text, default="[]")  # JSON string of detected potential issues
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    authors = relationship("Author", secondary=book_authors_association, back_populates="books")
    chapters = relationship("Chapter", back_populates="book", cascade="all, delete-orphan", order_by="Chapter.chapter_number")
    keywords = relationship("BookKeyword", back_populates="book", cascade="all, delete-orphan")

class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True)
    chapter_number = Column(Integer, nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    start_page = Column(Integer, default=1)
    end_page = Column(Integer, default=1)
    content = Column(Text, nullable=False)
    formatted_html = Column(Text, nullable=True)

    book = relationship("Book", back_populates="chapters")

class BookKeyword(Base):
    __tablename__ = "book_keywords"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True)
    keyword = Column(String(150), nullable=False, index=True)

    book = relationship("Book", back_populates="keywords")


def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
