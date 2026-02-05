import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { pdfjsLib } from '../utils/pdfUtils';
import {
  EditState,
  EditContextType,
  EditToolType,
  TextEdit,
  HighlightAnnotation,
  UnderlineAnnotation,
  CommentAnnotation,
  ImageEdit,
  EditAction,
  EditObject,
} from '../types/edit.types';
import { applyEdits } from '../services/pdfEditService';

// ユニークIDを生成
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 初期状態
const initialState: EditState = {
  pdfBuffer: null,
  pdfDocument: null,
  filePath: null,
  totalPages: 0,
  currentPage: 1,
  textEdits: [],
  highlights: [],
  underlines: [],
  comments: [],
  images: [],
  pageOrder: [],
  deletedPages: new Set(),
  pageRotations: new Map(),
  activeTool: 'select',
  selectedObjectId: null,
  scale: 1.0,
  isLoading: false,
  error: null,
  isDirty: false,
  undoStack: [],
  redoStack: [],
};

const EditContext = createContext<EditContextType | null>(null);

export const EditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<EditState>(initialState);

  // アクションを実行してUndo履歴に追加
  const executeAction = useCallback((action: EditAction) => {
    setState((prev) => ({
      ...prev,
      undoStack: [...prev.undoStack, action],
      redoStack: [],
      isDirty: true,
    }));
  }, []);

  // PDFを読み込む
  const loadPDF = useCallback(async (buffer: ArrayBuffer, filePath: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      // ArrayBufferのコピーを作成して使用（デタッチを防ぐため）
      const bufferCopy = buffer.slice(0);
      // PDFドキュメントを読み込む
      const pdfDoc = await pdfjsLib.getDocument({ data: bufferCopy }).promise;
      const totalPages = pdfDoc.numPages;

      // ページ順序を初期化
      const pageOrder = Array.from({ length: totalPages }, (_, i) => i);

      // 元のバッファとPDFドキュメントを保存
      setState({
        ...initialState,
        pdfBuffer: buffer,
        pdfDocument: pdfDoc,
        filePath,
        totalPages,
        currentPage: 1,
        pageOrder,
        isLoading: false,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'PDFの読み込みに失敗しました',
      }));
    }
  }, []);

  // ツールを選択
  const setActiveTool = useCallback((tool: EditToolType) => {
    setState((prev) => ({ ...prev, activeTool: tool }));
  }, []);

  // オブジェクトを選択
  const selectObject = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedObjectId: id }));
  }, []);

  // ページナビゲーション
  const setCurrentPage = useCallback((page: number) => {
    setState((prev) => {
      const validPage = Math.max(1, Math.min(page, prev.totalPages));
      return { ...prev, currentPage: validPage };
    });
  }, []);

  const setScale = useCallback((scale: number) => {
    setState((prev) => ({ ...prev, scale: Math.max(0.25, Math.min(4.0, scale)) }));
  }, []);

  // テキスト編集
  const addText = useCallback((text: Omit<TextEdit, 'id'>) => {
    const newText: TextEdit = { ...text, id: generateId() };
    setState((prev) => ({
      ...prev,
      textEdits: [...prev.textEdits, newText],
    }));
    executeAction({ type: 'ADD_TEXT', payload: newText });
  }, [executeAction]);

  const updateText = useCallback((id: string, updates: Partial<TextEdit>) => {
    setState((prev) => {
      const text = prev.textEdits.find((t) => t.id === id);
      if (!text) return prev;

      const previous: Partial<TextEdit> = {};
      const current: Partial<TextEdit> = {};
      for (const key of Object.keys(updates) as (keyof TextEdit)[]) {
        previous[key] = text[key] as never;
        current[key] = updates[key] as never;
      }

      executeAction({ type: 'UPDATE_TEXT', payload: { id, previous, current } });

      return {
        ...prev,
        textEdits: prev.textEdits.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      };
    });
  }, [executeAction]);

  const removeText = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      textEdits: prev.textEdits.filter((t) => t.id !== id),
      selectedObjectId: prev.selectedObjectId === id ? null : prev.selectedObjectId,
    }));
    executeAction({ type: 'REMOVE_TEXT', payload: id });
  }, [executeAction]);

  // ハイライト
  const addHighlight = useCallback((highlight: Omit<HighlightAnnotation, 'id'>) => {
    const newHighlight: HighlightAnnotation = { ...highlight, id: generateId() };
    setState((prev) => ({
      ...prev,
      highlights: [...prev.highlights, newHighlight],
    }));
    executeAction({ type: 'ADD_HIGHLIGHT', payload: newHighlight });
  }, [executeAction]);

  const updateHighlight = useCallback((id: string, updates: Partial<HighlightAnnotation>) => {
    setState((prev) => {
      const highlight = prev.highlights.find((h) => h.id === id);
      if (!highlight) return prev;

      const previous: Partial<HighlightAnnotation> = {};
      const current: Partial<HighlightAnnotation> = {};
      for (const key of Object.keys(updates) as (keyof HighlightAnnotation)[]) {
        previous[key] = highlight[key] as never;
        current[key] = updates[key] as never;
      }

      executeAction({ type: 'UPDATE_HIGHLIGHT', payload: { id, previous, current } });

      return {
        ...prev,
        highlights: prev.highlights.map((h) => (h.id === id ? { ...h, ...updates } : h)),
      };
    });
  }, [executeAction]);

  const removeHighlight = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((h) => h.id !== id),
      selectedObjectId: prev.selectedObjectId === id ? null : prev.selectedObjectId,
    }));
    executeAction({ type: 'REMOVE_HIGHLIGHT', payload: id });
  }, [executeAction]);

  // 下線
  const addUnderline = useCallback((underline: Omit<UnderlineAnnotation, 'id'>) => {
    const newUnderline: UnderlineAnnotation = { ...underline, id: generateId() };
    setState((prev) => ({
      ...prev,
      underlines: [...prev.underlines, newUnderline],
    }));
    executeAction({ type: 'ADD_UNDERLINE', payload: newUnderline });
  }, [executeAction]);

  const updateUnderline = useCallback((id: string, updates: Partial<UnderlineAnnotation>) => {
    setState((prev) => {
      const underline = prev.underlines.find((u) => u.id === id);
      if (!underline) return prev;

      const previous: Partial<UnderlineAnnotation> = {};
      const current: Partial<UnderlineAnnotation> = {};
      for (const key of Object.keys(updates) as (keyof UnderlineAnnotation)[]) {
        previous[key] = underline[key] as never;
        current[key] = updates[key] as never;
      }

      executeAction({ type: 'UPDATE_UNDERLINE', payload: { id, previous, current } });

      return {
        ...prev,
        underlines: prev.underlines.map((u) => (u.id === id ? { ...u, ...updates } : u)),
      };
    });
  }, [executeAction]);

  const removeUnderline = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      underlines: prev.underlines.filter((u) => u.id !== id),
      selectedObjectId: prev.selectedObjectId === id ? null : prev.selectedObjectId,
    }));
    executeAction({ type: 'REMOVE_UNDERLINE', payload: id });
  }, [executeAction]);

  // コメント
  const addComment = useCallback((comment: Omit<CommentAnnotation, 'id'>) => {
    const newComment: CommentAnnotation = { ...comment, id: generateId() };
    setState((prev) => ({
      ...prev,
      comments: [...prev.comments, newComment],
    }));
    executeAction({ type: 'ADD_COMMENT', payload: newComment });
  }, [executeAction]);

  const updateComment = useCallback((id: string, updates: Partial<CommentAnnotation>) => {
    setState((prev) => {
      const comment = prev.comments.find((c) => c.id === id);
      if (!comment) return prev;

      const previous: Partial<CommentAnnotation> = {};
      const current: Partial<CommentAnnotation> = {};
      for (const key of Object.keys(updates) as (keyof CommentAnnotation)[]) {
        previous[key] = comment[key] as never;
        current[key] = updates[key] as never;
      }

      executeAction({ type: 'UPDATE_COMMENT', payload: { id, previous, current } });

      return {
        ...prev,
        comments: prev.comments.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      };
    });
  }, [executeAction]);

  const removeComment = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      comments: prev.comments.filter((c) => c.id !== id),
      selectedObjectId: prev.selectedObjectId === id ? null : prev.selectedObjectId,
    }));
    executeAction({ type: 'REMOVE_COMMENT', payload: id });
  }, [executeAction]);

  // 画像
  const addImage = useCallback((image: Omit<ImageEdit, 'id'>) => {
    const newImage: ImageEdit = { ...image, id: generateId() };
    setState((prev) => ({
      ...prev,
      images: [...prev.images, newImage],
    }));
    executeAction({ type: 'ADD_IMAGE', payload: newImage });
  }, [executeAction]);

  const updateImage = useCallback((id: string, updates: Partial<ImageEdit>) => {
    setState((prev) => {
      const image = prev.images.find((i) => i.id === id);
      if (!image) return prev;

      const previous: Partial<ImageEdit> = {};
      const current: Partial<ImageEdit> = {};
      for (const key of Object.keys(updates) as (keyof ImageEdit)[]) {
        previous[key] = image[key] as never;
        current[key] = updates[key] as never;
      }

      executeAction({ type: 'UPDATE_IMAGE', payload: { id, previous, current } });

      return {
        ...prev,
        images: prev.images.map((i) => (i.id === id ? { ...i, ...updates } : i)),
      };
    });
  }, [executeAction]);

  const removeImage = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      images: prev.images.filter((i) => i.id !== id),
      selectedObjectId: prev.selectedObjectId === id ? null : prev.selectedObjectId,
    }));
    executeAction({ type: 'REMOVE_IMAGE', payload: id });
  }, [executeAction]);

  // ページ操作
  const rotatePage = useCallback((pageIndex: number, degrees: number) => {
    setState((prev) => {
      const previousDegrees = prev.pageRotations.get(pageIndex) || 0;
      const newRotations = new Map(prev.pageRotations);
      const currentDegrees = (previousDegrees + degrees) % 360;
      newRotations.set(pageIndex, currentDegrees);

      executeAction({
        type: 'ROTATE_PAGE',
        payload: { pageIndex, previousDegrees, currentDegrees },
      });

      return { ...prev, pageRotations: newRotations };
    });
  }, [executeAction]);

  const deletePage = useCallback((pageIndex: number) => {
    setState((prev) => {
      const newDeletedPages = new Set(prev.deletedPages);
      newDeletedPages.add(pageIndex);

      executeAction({ type: 'DELETE_PAGE', payload: pageIndex });

      return { ...prev, deletedPages: newDeletedPages };
    });
  }, [executeAction]);

  const restorePage = useCallback((pageIndex: number) => {
    setState((prev) => {
      const newDeletedPages = new Set(prev.deletedPages);
      newDeletedPages.delete(pageIndex);

      executeAction({ type: 'RESTORE_PAGE', payload: pageIndex });

      return { ...prev, deletedPages: newDeletedPages };
    });
  }, [executeAction]);

  const reorderPages = useCallback((newOrder: number[]) => {
    setState((prev) => {
      const previousOrder = [...prev.pageOrder];

      executeAction({
        type: 'REORDER_PAGES',
        payload: { previousOrder, currentOrder: newOrder },
      });

      return { ...prev, pageOrder: newOrder };
    });
  }, [executeAction]);

  // Undo
  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.undoStack.length === 0) return prev;

      const action = prev.undoStack[prev.undoStack.length - 1];
      const newState = { ...prev };
      newState.undoStack = prev.undoStack.slice(0, -1);
      newState.redoStack = [...prev.redoStack, action];

      // アクションを元に戻す
      switch (action.type) {
        case 'ADD_TEXT':
          newState.textEdits = prev.textEdits.filter((t) => t.id !== action.payload.id);
          break;
        case 'REMOVE_TEXT':
          // 削除されたテキストを復元するにはペイロードに元のテキストが必要
          break;
        case 'UPDATE_TEXT':
          newState.textEdits = prev.textEdits.map((t) =>
            t.id === action.payload.id ? { ...t, ...action.payload.previous } : t
          );
          break;
        case 'ADD_HIGHLIGHT':
          newState.highlights = prev.highlights.filter((h) => h.id !== action.payload.id);
          break;
        case 'UPDATE_HIGHLIGHT':
          newState.highlights = prev.highlights.map((h) =>
            h.id === action.payload.id ? { ...h, ...action.payload.previous } : h
          );
          break;
        case 'ADD_UNDERLINE':
          newState.underlines = prev.underlines.filter((u) => u.id !== action.payload.id);
          break;
        case 'UPDATE_UNDERLINE':
          newState.underlines = prev.underlines.map((u) =>
            u.id === action.payload.id ? { ...u, ...action.payload.previous } : u
          );
          break;
        case 'ADD_COMMENT':
          newState.comments = prev.comments.filter((c) => c.id !== action.payload.id);
          break;
        case 'UPDATE_COMMENT':
          newState.comments = prev.comments.map((c) =>
            c.id === action.payload.id ? { ...c, ...action.payload.previous } : c
          );
          break;
        case 'ADD_IMAGE':
          newState.images = prev.images.filter((i) => i.id !== action.payload.id);
          break;
        case 'UPDATE_IMAGE':
          newState.images = prev.images.map((i) =>
            i.id === action.payload.id ? { ...i, ...action.payload.previous } : i
          );
          break;
        case 'ROTATE_PAGE': {
          const newRotations = new Map(prev.pageRotations);
          newRotations.set(action.payload.pageIndex, action.payload.previousDegrees);
          newState.pageRotations = newRotations;
          break;
        }
        case 'DELETE_PAGE': {
          const newDeletedPages = new Set(prev.deletedPages);
          newDeletedPages.delete(action.payload);
          newState.deletedPages = newDeletedPages;
          break;
        }
        case 'RESTORE_PAGE': {
          const newDeletedPages = new Set(prev.deletedPages);
          newDeletedPages.add(action.payload);
          newState.deletedPages = newDeletedPages;
          break;
        }
        case 'REORDER_PAGES':
          newState.pageOrder = action.payload.previousOrder;
          break;
      }

      return newState;
    });
  }, []);

  // Redo
  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.redoStack.length === 0) return prev;

      const action = prev.redoStack[prev.redoStack.length - 1];
      const newState = { ...prev };
      newState.redoStack = prev.redoStack.slice(0, -1);
      newState.undoStack = [...prev.undoStack, action];

      // アクションを再適用
      switch (action.type) {
        case 'ADD_TEXT':
          newState.textEdits = [...prev.textEdits, action.payload];
          break;
        case 'UPDATE_TEXT':
          newState.textEdits = prev.textEdits.map((t) =>
            t.id === action.payload.id ? { ...t, ...action.payload.current } : t
          );
          break;
        case 'ADD_HIGHLIGHT':
          newState.highlights = [...prev.highlights, action.payload];
          break;
        case 'UPDATE_HIGHLIGHT':
          newState.highlights = prev.highlights.map((h) =>
            h.id === action.payload.id ? { ...h, ...action.payload.current } : h
          );
          break;
        case 'ADD_UNDERLINE':
          newState.underlines = [...prev.underlines, action.payload];
          break;
        case 'UPDATE_UNDERLINE':
          newState.underlines = prev.underlines.map((u) =>
            u.id === action.payload.id ? { ...u, ...action.payload.current } : u
          );
          break;
        case 'ADD_COMMENT':
          newState.comments = [...prev.comments, action.payload];
          break;
        case 'UPDATE_COMMENT':
          newState.comments = prev.comments.map((c) =>
            c.id === action.payload.id ? { ...c, ...action.payload.current } : c
          );
          break;
        case 'ADD_IMAGE':
          newState.images = [...prev.images, action.payload];
          break;
        case 'UPDATE_IMAGE':
          newState.images = prev.images.map((i) =>
            i.id === action.payload.id ? { ...i, ...action.payload.current } : i
          );
          break;
        case 'ROTATE_PAGE': {
          const newRotations = new Map(prev.pageRotations);
          newRotations.set(action.payload.pageIndex, action.payload.currentDegrees);
          newState.pageRotations = newRotations;
          break;
        }
        case 'DELETE_PAGE': {
          const newDeletedPages = new Set(prev.deletedPages);
          newDeletedPages.add(action.payload);
          newState.deletedPages = newDeletedPages;
          break;
        }
        case 'RESTORE_PAGE': {
          const newDeletedPages = new Set(prev.deletedPages);
          newDeletedPages.delete(action.payload);
          newState.deletedPages = newDeletedPages;
          break;
        }
        case 'REORDER_PAGES':
          newState.pageOrder = action.payload.currentOrder;
          break;
      }

      return newState;
    });
  }, []);

  // 保存
  const save = useCallback(async () => {
    if (!state.pdfBuffer || !state.filePath) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const editedPdf = await applyEdits(
        state.pdfBuffer,
        {
          texts: state.textEdits,
          highlights: state.highlights,
          underlines: state.underlines,
          comments: state.comments,
          images: state.images,
        },
        state.pageOrder,
        state.deletedPages,
        state.pageRotations
      );

      await window.electronAPI.writeFile(state.filePath, editedPdf);

      setState((prev) => ({
        ...prev,
        pdfBuffer: editedPdf.buffer as ArrayBuffer,
        isDirty: false,
        isLoading: false,
        // 保存後は編集内容をリセット
        textEdits: [],
        highlights: [],
        underlines: [],
        comments: [],
        images: [],
        undoStack: [],
        redoStack: [],
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '保存に失敗しました',
      }));
    }
  }, [state]);

  // 名前を付けて保存
  const saveAs = useCallback(async () => {
    if (!state.pdfBuffer) return;

    try {
      const newPath = await window.electronAPI.saveFileDialog('edited.pdf');
      if (!newPath) return;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const editedPdf = await applyEdits(
        state.pdfBuffer,
        {
          texts: state.textEdits,
          highlights: state.highlights,
          underlines: state.underlines,
          comments: state.comments,
          images: state.images,
        },
        state.pageOrder,
        state.deletedPages,
        state.pageRotations
      );

      await window.electronAPI.writeFile(newPath, editedPdf);

      setState((prev) => ({
        ...prev,
        filePath: newPath,
        pdfBuffer: editedPdf.buffer as ArrayBuffer,
        isDirty: false,
        isLoading: false,
        textEdits: [],
        highlights: [],
        underlines: [],
        comments: [],
        images: [],
        undoStack: [],
        redoStack: [],
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '保存に失敗しました',
      }));
    }
  }, [state]);

  // 現在のページの編集オブジェクトを取得
  const getCurrentPageEdits = useCallback(() => {
    const pageIndex = state.currentPage - 1;
    return {
      texts: state.textEdits.filter((t) => t.pageIndex === pageIndex),
      highlights: state.highlights.filter((h) => h.pageIndex === pageIndex),
      underlines: state.underlines.filter((u) => u.pageIndex === pageIndex),
      comments: state.comments.filter((c) => c.pageIndex === pageIndex),
      images: state.images.filter((i) => i.pageIndex === pageIndex),
    };
  }, [state.currentPage, state.textEdits, state.highlights, state.underlines, state.comments, state.images]);

  // 選択されたオブジェクトを取得
  const getSelectedObject = useCallback((): EditObject | null => {
    if (!state.selectedObjectId) return null;

    const text = state.textEdits.find((t) => t.id === state.selectedObjectId);
    if (text) return text;

    const highlight = state.highlights.find((h) => h.id === state.selectedObjectId);
    if (highlight) return highlight;

    const underline = state.underlines.find((u) => u.id === state.selectedObjectId);
    if (underline) return underline;

    const comment = state.comments.find((c) => c.id === state.selectedObjectId);
    if (comment) return comment;

    const image = state.images.find((i) => i.id === state.selectedObjectId);
    if (image) return image;

    return null;
  }, [state.selectedObjectId, state.textEdits, state.highlights, state.underlines, state.comments, state.images]);

  const canUndo = state.undoStack.length > 0;
  const canRedo = state.redoStack.length > 0;

  const contextValue: EditContextType = useMemo(
    () => ({
      ...state,
      loadPDF,
      setActiveTool,
      selectObject,
      setCurrentPage,
      setScale,
      addText,
      updateText,
      removeText,
      addHighlight,
      updateHighlight,
      removeHighlight,
      addUnderline,
      updateUnderline,
      removeUnderline,
      addComment,
      updateComment,
      removeComment,
      addImage,
      updateImage,
      removeImage,
      rotatePage,
      deletePage,
      restorePage,
      reorderPages,
      undo,
      redo,
      canUndo,
      canRedo,
      save,
      saveAs,
      getCurrentPageEdits,
      getSelectedObject,
    }),
    [
      state,
      loadPDF,
      setActiveTool,
      selectObject,
      setCurrentPage,
      setScale,
      addText,
      updateText,
      removeText,
      addHighlight,
      updateHighlight,
      removeHighlight,
      addUnderline,
      updateUnderline,
      removeUnderline,
      addComment,
      updateComment,
      removeComment,
      addImage,
      updateImage,
      removeImage,
      rotatePage,
      deletePage,
      restorePage,
      reorderPages,
      undo,
      redo,
      canUndo,
      canRedo,
      save,
      saveAs,
      getCurrentPageEdits,
      getSelectedObject,
    ]
  );

  return <EditContext.Provider value={contextValue}>{children}</EditContext.Provider>;
};

export const useEdit = (): EditContextType => {
  const context = useContext(EditContext);
  if (!context) {
    throw new Error('useEdit must be used within an EditProvider');
  }
  return context;
};
