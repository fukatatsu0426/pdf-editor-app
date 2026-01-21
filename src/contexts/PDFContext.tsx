import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PDFState, PDFContextType } from '../types/pdf.types';
import { loadPDF } from '../utils/pdfUtils';

const initialState: PDFState = {
  document: null,
  currentPage: 1,
  totalPages: 0,
  scale: 1.0,
  filePath: null,
  isLoading: false,
  error: null,
};

const PDFContext = createContext<PDFContextType | undefined>(undefined);

export function PDFProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PDFState>(initialState);

  // PDFドキュメントを読み込む
  const loadDocument = async (arrayBuffer: ArrayBuffer, filePath: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const pdfDocument = await loadPDF(arrayBuffer);
      setState({
        document: pdfDocument,
        currentPage: 1,
        totalPages: pdfDocument.numPages,
        scale: 1.0,
        filePath,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'PDFの読み込みに失敗しました',
      }));
    }
  };

  // ページを設定
  const setCurrentPage = (page: number) => {
    if (page >= 1 && page <= state.totalPages) {
      setState(prev => ({ ...prev, currentPage: page }));
    }
  };

  // ズームレベルを設定
  const setScale = (scale: number) => {
    if (scale >= 0.5 && scale <= 3.0) {
      setState(prev => ({ ...prev, scale }));
    }
  };

  // 次のページ
  const nextPage = () => {
    if (state.currentPage < state.totalPages) {
      setState(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  };

  // 前のページ
  const previousPage = () => {
    if (state.currentPage > 1) {
      setState(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
    }
  };

  // ズームイン
  const zoomIn = () => {
    setState(prev => ({
      ...prev,
      scale: Math.min(prev.scale + 0.25, 3.0),
    }));
  };

  // ズームアウト
  const zoomOut = () => {
    setState(prev => ({
      ...prev,
      scale: Math.max(prev.scale - 0.25, 0.5),
    }));
  };

  // ズームリセット
  const resetZoom = () => {
    setState(prev => ({ ...prev, scale: 1.0 }));
  };

  const value: PDFContextType = {
    ...state,
    loadDocument,
    setCurrentPage,
    setScale,
    nextPage,
    previousPage,
    zoomIn,
    zoomOut,
    resetZoom,
  };

  return <PDFContext.Provider value={value}>{children}</PDFContext.Provider>;
}

// カスタムフック
export function usePDF() {
  const context = useContext(PDFContext);
  if (context === undefined) {
    throw new Error('usePDF must be used within a PDFProvider');
  }
  return context;
}
