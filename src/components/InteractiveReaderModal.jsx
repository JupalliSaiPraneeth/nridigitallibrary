import React from 'react';
import { useLibrary } from '../context/LibraryContext.jsx';
import BookReader from './BookReader.jsx';

export const InteractiveReaderModal = () => {
  const { activeModal, readerBook, closeModals } = useLibrary();

  const isOpen = activeModal === 'reader' && Boolean(readerBook);

  return (
    <BookReader
      isOpen={isOpen}
      book={readerBook || {}}
      onClose={closeModals}
    />
  );
};

export default InteractiveReaderModal;
