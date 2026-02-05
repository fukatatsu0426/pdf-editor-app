// 編集ツールの種類
export type EditToolType = 'select' | 'page' | 'text' | 'highlight' | 'underline' | 'comment' | 'image';

// テキスト編集
export interface TextEdit {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  fontFamily: string;
}

// ハイライト注釈
export interface HighlightAnnotation {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
}

// 下線注釈
export interface UnderlineAnnotation {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  width: number;
  color: string;
  thickness: number;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  lineCap?: 'butt' | 'round' | 'square';
  arrowStart?: boolean;
  arrowEnd?: boolean;
}

// コメント注釈
export interface CommentAnnotation {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  text: string;
  author?: string;
  createdAt: Date;
}

// 画像編集
export interface ImageEdit {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  imageData: Uint8Array;
  mimeType: 'image/png' | 'image/jpeg';
  originalWidth: number;
  originalHeight: number;
}

// ページ回転情報
export interface PageRotation {
  pageIndex: number;
  degrees: number; // 0, 90, 180, 270
}

// 全ての編集オブジェクトの共通インターフェース
export type EditObject = TextEdit | HighlightAnnotation | UnderlineAnnotation | CommentAnnotation | ImageEdit;

// PDF.jsのドキュメント型（インポートを避けるため）
export interface PDFDocumentProxyLike {
  numPages: number;
  getPage: (pageNumber: number) => Promise<any>;
}

// 編集状態
export interface EditState {
  // PDFデータ
  pdfBuffer: ArrayBuffer | null;
  pdfDocument: PDFDocumentProxyLike | null;
  filePath: string | null;
  totalPages: number;
  currentPage: number;

  // 編集内容
  textEdits: TextEdit[];
  highlights: HighlightAnnotation[];
  underlines: UnderlineAnnotation[];
  comments: CommentAnnotation[];
  images: ImageEdit[];

  // ページ操作
  pageOrder: number[]; // 元のページインデックスの順序
  deletedPages: Set<number>; // 削除されたページのインデックス
  pageRotations: Map<number, number>; // ページごとの回転角度

  // UI状態
  activeTool: EditToolType;
  selectedObjectId: string | null;
  scale: number;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean; // 未保存の変更があるか

  // Undo/Redo
  undoStack: EditAction[];
  redoStack: EditAction[];
}

// 編集アクション（Undo/Redo用）
export type EditAction =
  | { type: 'ADD_TEXT'; payload: TextEdit }
  | { type: 'REMOVE_TEXT'; payload: string }
  | { type: 'UPDATE_TEXT'; payload: { id: string; previous: Partial<TextEdit>; current: Partial<TextEdit> } }
  | { type: 'ADD_HIGHLIGHT'; payload: HighlightAnnotation }
  | { type: 'UPDATE_HIGHLIGHT'; payload: { id: string; previous: Partial<HighlightAnnotation>; current: Partial<HighlightAnnotation> } }
  | { type: 'REMOVE_HIGHLIGHT'; payload: string }
  | { type: 'ADD_UNDERLINE'; payload: UnderlineAnnotation }
  | { type: 'UPDATE_UNDERLINE'; payload: { id: string; previous: Partial<UnderlineAnnotation>; current: Partial<UnderlineAnnotation> } }
  | { type: 'REMOVE_UNDERLINE'; payload: string }
  | { type: 'ADD_COMMENT'; payload: CommentAnnotation }
  | { type: 'REMOVE_COMMENT'; payload: string }
  | { type: 'UPDATE_COMMENT'; payload: { id: string; previous: Partial<CommentAnnotation>; current: Partial<CommentAnnotation> } }
  | { type: 'ADD_IMAGE'; payload: ImageEdit }
  | { type: 'REMOVE_IMAGE'; payload: string }
  | { type: 'UPDATE_IMAGE'; payload: { id: string; previous: Partial<ImageEdit>; current: Partial<ImageEdit> } }
  | { type: 'ROTATE_PAGE'; payload: { pageIndex: number; previousDegrees: number; currentDegrees: number } }
  | { type: 'DELETE_PAGE'; payload: number }
  | { type: 'RESTORE_PAGE'; payload: number }
  | { type: 'REORDER_PAGES'; payload: { previousOrder: number[]; currentOrder: number[] } };

// コンテキストの型
export interface EditContextType extends EditState {
  // PDFの読み込み
  loadPDF: (buffer: ArrayBuffer, filePath: string) => Promise<void>;

  // ツール選択
  setActiveTool: (tool: EditToolType) => void;

  // オブジェクト選択
  selectObject: (id: string | null) => void;

  // ページナビゲーション
  setCurrentPage: (page: number) => void;
  setScale: (scale: number) => void;

  // テキスト編集
  addText: (text: Omit<TextEdit, 'id'>) => void;
  updateText: (id: string, updates: Partial<TextEdit>) => void;
  removeText: (id: string) => void;

  // ハイライト
  addHighlight: (highlight: Omit<HighlightAnnotation, 'id'>) => void;
  updateHighlight: (id: string, updates: Partial<HighlightAnnotation>) => void;
  removeHighlight: (id: string) => void;

  // 下線
  addUnderline: (underline: Omit<UnderlineAnnotation, 'id'>) => void;
  updateUnderline: (id: string, updates: Partial<UnderlineAnnotation>) => void;
  removeUnderline: (id: string) => void;

  // コメント
  addComment: (comment: Omit<CommentAnnotation, 'id'>) => void;
  updateComment: (id: string, updates: Partial<CommentAnnotation>) => void;
  removeComment: (id: string) => void;

  // 画像
  addImage: (image: Omit<ImageEdit, 'id'>) => void;
  updateImage: (id: string, updates: Partial<ImageEdit>) => void;
  removeImage: (id: string) => void;

  // ページ操作
  rotatePage: (pageIndex: number, degrees: number) => void;
  deletePage: (pageIndex: number) => void;
  restorePage: (pageIndex: number) => void;
  reorderPages: (newOrder: number[]) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // 保存
  save: () => Promise<void>;
  saveAs: () => Promise<void>;

  // 現在のページの編集オブジェクトを取得
  getCurrentPageEdits: () => {
    texts: TextEdit[];
    highlights: HighlightAnnotation[];
    underlines: UnderlineAnnotation[];
    comments: CommentAnnotation[];
    images: ImageEdit[];
  };

  // 選択されたオブジェクトを取得
  getSelectedObject: () => EditObject | null;
}

// ページサムネイル表示用
export interface PageThumbnail {
  pageIndex: number;
  originalIndex: number;
  rotation: number;
  isDeleted: boolean;
}
