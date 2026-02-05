import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useEdit } from '../../contexts/EditContext';
import { PDFDocumentProxyLike } from '../../types/edit.types';

interface ThumbnailProps {
  pageNumber: number;
  originalIndex: number;
  pdfDoc: PDFDocumentProxyLike;
  isActive: boolean;
  isDeleted: boolean;
  rotation: number;
  isVisible: boolean;
  onClick: () => void;
  onRotate: (degrees: number) => void;
  onDelete: () => void;
  onRestore: () => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetIndex: number) => void;
  index: number;
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  pageNumber,
  originalIndex,
  pdfDoc,
  isActive,
  isDeleted,
  rotation,
  isVisible,
  onClick,
  onRotate,
  onDelete,
  onRestore,
  onDragStart,
  onDragOver,
  onDrop,
  index,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let cancelled = false;

    const renderThumbnail = async () => {
      try {
        // ページ番号がPDFのページ数内であることを確認
        const pageNum = originalIndex + 1;
        if (pageNum < 1 || pageNum > pdfDoc.numPages) {
          console.warn(`Invalid page number: ${pageNum}, total pages: ${pdfDoc.numPages}`);
          return;
        }

        const page = await pdfDoc.getPage(pageNum);
        if (cancelled) return;

        // オフスクリーンキャンバスを作成
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;

        // サムネイル用のスケール
        const thumbnailScale = 0.2;
        const viewport = page.getViewport({ scale: thumbnailScale, rotation });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // レンダリング
        const renderTask = page.render({
          canvasContext: context,
          viewport,
        });

        await renderTask.promise;

        // コンポーネントがまだマウントされていれば画像URLを設定
        if (!cancelled && mountedRef.current) {
          const dataUrl = canvas.toDataURL('image/png');
          setThumbnailUrl(dataUrl);
        }
      } catch (error) {
        // キャンセルエラーは無視
        if (error && typeof error === 'object' && 'name' in error && error.name === 'RenderingCancelledException') {
          return;
        }
        if (!cancelled) {
          console.error('サムネイルのレンダリングに失敗:', error);
        }
      }
    };

    // 少し遅延を入れて同時レンダリングを軽減
    const timeoutId = setTimeout(() => {
      renderThumbnail();
    }, originalIndex * 50);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [pdfDoc, originalIndex, rotation, isVisible]);

  return (
    <div
      className={`relative p-2 cursor-pointer transition-all ${
        isActive ? 'bg-blue-900 bg-opacity-50' : 'hover:bg-gray-700'
      } ${isDeleted ? 'opacity-50' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={!isDeleted}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
    >
      {/* サムネイル画像 */}
      <div className={`relative border-2 ${isActive ? 'border-blue-500' : 'border-transparent'}`}>
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={`Page ${pageNumber}`} className="w-full" />
        ) : (
          <div className="w-full h-24 bg-gray-700 flex items-center justify-center">
            <span className="text-xs text-gray-400">読込中...</span>
          </div>
        )}

        {isDeleted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <span className="text-white text-xs">削除済み</span>
          </div>
        )}
      </div>

      {/* ページ番号 */}
      <div className="text-center text-xs text-gray-400 mt-1">
        {pageNumber}
        {rotation !== 0 && <span className="ml-1 text-yellow-400">({rotation}°)</span>}
      </div>

      {/* ホバー時のコントロール */}
      {isHovered && !isDeleted && (
        <div className="absolute top-1 right-1 flex flex-col gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRotate(90);
            }}
            className="p-1 bg-gray-800 rounded hover:bg-gray-600 text-white"
            title="90°回転"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 bg-red-800 rounded hover:bg-red-600 text-white"
            title="ページを削除"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      {/* 削除済みの場合の復元ボタン */}
      {isHovered && isDeleted && (
        <div className="absolute top-1 right-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRestore();
            }}
            className="p-1 bg-green-800 rounded hover:bg-green-600 text-white"
            title="ページを復元"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

const PageThumbnails: React.FC = () => {
  const {
    pdfDocument,
    pageOrder,
    deletedPages,
    pageRotations,
    currentPage,
    setCurrentPage,
    rotatePage,
    deletePage,
    restorePage,
    reorderPages,
    activeTool,
  } = useEdit();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });

  const updateVisibleRange = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const itemHeight = 160;
    const scrollTop = container.scrollTop;
    const viewportHeight = container.clientHeight;
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
    const end = Math.min(pageOrder.length - 1, Math.ceil((scrollTop + viewportHeight) / itemHeight) + 2);
    setVisibleRange({ start, end });
  }, [pageOrder.length]);

  useEffect(() => {
    updateVisibleRange();
  }, [updateVisibleRange, pageOrder.length, currentPage]);

  // ドラッグ開始
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, []);

  // ドラッグオーバー
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // ドロップ
  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    const newOrder = [...pageOrder];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    reorderPages(newOrder);
    setDraggedIndex(null);
  }, [draggedIndex, pageOrder, reorderPages]);

  if (!pdfDocument) {
    return (
      <div className="p-4 text-gray-400 text-sm text-center">
        PDFを読み込み中...
      </div>
    );
  }

  // ページ操作ツールが選択されている場合のヘッダー
  const showPageTools = activeTool === 'page';

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="px-3 py-2 border-b border-gray-700 bg-gray-800">
        <h3 className="text-sm font-medium text-gray-300">ページ一覧</h3>
        {showPageTools && (
          <p className="text-xs text-gray-500 mt-1">
            ドラッグで並べ替え
          </p>
        )}
      </div>

      {/* サムネイル一覧 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-2 space-y-1"
        onScroll={updateVisibleRange}
      >
        {pageOrder.map((originalIndex, index) => {
          const isDeleted = deletedPages.has(originalIndex);
          const rotation = pageRotations.get(originalIndex) || 0;
          const isVisible = index >= visibleRange.start && index <= visibleRange.end;

          // 削除されたページは非表示にするか表示するかを選択
          // ここでは削除済みも薄く表示
          return (
            <Thumbnail
              key={`page-${originalIndex}`}
              pageNumber={index + 1}
              originalIndex={originalIndex}
              pdfDoc={pdfDocument}
              isActive={currentPage === index + 1}
              isDeleted={isDeleted}
              rotation={rotation}
              isVisible={isVisible}
              onClick={() => setCurrentPage(index + 1)}
              onRotate={(degrees) => rotatePage(originalIndex, degrees)}
              onDelete={() => deletePage(originalIndex)}
              onRestore={() => restorePage(originalIndex)}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              index={index}
            />
          );
        })}
      </div>

      {/* 削除済みページ数 */}
      {deletedPages.size > 0 && (
        <div className="px-3 py-2 border-t border-gray-700 bg-gray-800">
          <p className="text-xs text-gray-500">
            {deletedPages.size}ページが削除待ち
          </p>
        </div>
      )}
    </div>
  );
};

export default PageThumbnails;
