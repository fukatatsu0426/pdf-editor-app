import { PDFDocumentProxy } from 'pdfjs-dist';

export interface PDFState {
  document: PDFDocumentProxy | null;
  currentPage: number;
  totalPages: number;
  scale: number;
  filePath: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface PDFContextType extends PDFState {
  loadDocument: (arrayBuffer: ArrayBuffer, filePath: string) => Promise<void>;
  setCurrentPage: (page: number) => void;
  setScale: (scale: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}
