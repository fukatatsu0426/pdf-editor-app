import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useEdit } from '../../contexts/EditContext';
import { ImageEdit } from '../../types/edit.types';

const EditCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const renderSeqRef = useRef(0);

  const {
    pdfBuffer,
    pdfDocument,
    currentPage,
    scale,
    activeTool,
    selectedObjectId,
    pageRotations,
    selectObject,
    addText,
    addHighlight,
    addUnderline,
    addComment,
    addImage,
    updateText,
    updateComment,
    updateImage,
    updateHighlight,
    updateUnderline,
    getCurrentPageEdits,
  } = useEdit();

  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  // const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState<{ x: number; y: number; text: string } | null>(null);
  const [dragging, setDragging] = useState<{
    id: string;
    type: 'text' | 'highlight' | 'underline' | 'comment' | 'image';
    offsetX: number;
    offsetY: number;
    underlineDeltaX?: number;
    underlineDeltaY?: number;
  } | null>(null);
  const [resizingUnderline, setResizingUnderline] = useState<{
    id: string;
    handle: 'start' | 'end';
    otherX: number;
    otherY: number;
  } | null>(null);
  const [resizingHighlight, setResizingHighlight] = useState<{
    id: string;
    handle: 'nw' | 'ne' | 'sw' | 'se';
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);
  const [resizingImage, setResizingImage] = useState<{
    id: string;
    handle: 'nw' | 'ne' | 'sw' | 'se';
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  // ページをレンダリング
  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) {
      setPageSize({ width: 0, height: 0 });
      // setIsRendering(false);
      setRenderError(null);
      return;
    }

    const renderPage = async () => {
      const renderSeq = ++renderSeqRef.current;
      // 前のレンダリングタスクをキャンセル
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // キャンセルエラーは無視
        }
        try {
          await renderTaskRef.current.promise;
        } catch (e) {
          // キャンセルによるrejectは無視
        }
        renderTaskRef.current = null;
      }

      // setIsRendering(true);
      setRenderError(null);
      setPageSize({ width: 0, height: 0 });

      try {
        // ページ番号がPDFのページ数内であることを確認
        if (currentPage < 1 || currentPage > pdfDocument.numPages) {
          const errorMsg = `無効なページ番号: ${currentPage} (総ページ数: ${pdfDocument.numPages})`;
          console.warn(errorMsg);
          setRenderError(errorMsg);
          // setIsRendering(false);
          return;
        }

        const page = await pdfDocument.getPage(currentPage);
        if (renderSeq !== renderSeqRef.current) return;
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d');
        
        if (!context) {
          throw new Error('Canvasコンテキストの取得に失敗しました');
        }

        // ページの回転を取得
        const pageIndex = currentPage - 1;
        const rotation = pageRotations.get(pageIndex) || 0;

        // ビューポートを取得
        const viewport = page.getViewport({ scale, rotation });
        if (renderSeq !== renderSeqRef.current) return;

        // キャンバスサイズを設定（これにより前のレンダリングがキャンセルされる）
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // ページサイズを先に設定（レンダリング完了前に表示できるように）
        setPageSize({ width: viewport.width, height: viewport.height });

        // レンダリングタスクを開始
        const renderTask = page.render({
          canvasContext: context,
          viewport,
        });
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        if (renderSeq !== renderSeqRef.current) return;
        renderTaskRef.current = null;
        // setIsRendering(false);
        setRenderError(null);
      } catch (error) {
        // キャンセルエラーは無視
        if (error && typeof error === 'object' && 'name' in error && error.name === 'RenderingCancelledException') {
          // setIsRendering(false);
          return;
        }
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('ページのレンダリングに失敗:', error);
        setRenderError(`レンダリングエラー: ${errorMessage}`);
        // setIsRendering(false);
        setPageSize({ width: 0, height: 0 });
      }
    };

    renderPage();

    // クリーンアップ: コンポーネントがアンマウントされるか、依存関係が変更されたときにキャンセル
    return () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // キャンセルエラーは無視
        }
        renderTaskRef.current = null;
      }
    };
  }, [pdfDocument, currentPage, scale, pageRotations]);

  // キャンバス上のクリック位置を取得
  const getCanvasPosition = useCallback((e: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    // キャンバスの実際のサイズと表示サイズの比率を考慮
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const getCanvasPositionFromClient = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  // キャンバスクリック処理
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const pos = getCanvasPosition(e);
    const pageIndex = currentPage - 1;

    switch (activeTool) {
      case 'text':
        // テキスト追加
        addText({
          pageIndex,
          x: pos.x,
          y: pos.y,
          text: 'テキストを入力',
          fontSize: 14,
          color: '#000000',
          fontFamily: 'sans-serif',
        });
        break;

      case 'comment':
        // コメント追加（簡易インライン入力）
        setCommentDraft({ x: pos.x, y: pos.y, text: '' });
        break;

      case 'image':
        // 画像追加
        handleImageInsert(pos.x, pos.y);
        break;

      case 'select':
        // オブジェクト選択
        const edits = getCurrentPageEdits();
        const clickedObject = findObjectAtPosition(pos.x, pos.y, edits);
        selectObject(clickedObject?.id || null);
        break;
    }
  }, [activeTool, currentPage, addText, addComment, addImage, selectObject, getCurrentPageEdits, getCanvasPosition]);

  const startDrag = useCallback(
    (
      e: React.MouseEvent,
      obj: { id: string; x: number; y: number },
      type: 'text' | 'highlight' | 'underline' | 'comment' | 'image'
    ) => {
      if (activeTool !== 'select') return;
      e.stopPropagation();
      const pos = getCanvasPosition(e);
      if (type === 'underline') {
        const underline = obj as any;
        const x2 = underline.x2 ?? underline.x + underline.width;
        const y2 = underline.y2 ?? underline.y;
        setDragging({
          id: obj.id,
          type,
          offsetX: pos.x - underline.x,
          offsetY: pos.y - underline.y,
          underlineDeltaX: x2 - underline.x,
          underlineDeltaY: y2 - underline.y,
        });
      } else {
        setDragging({
          id: obj.id,
          type,
          offsetX: pos.x - obj.x,
          offsetY: pos.y - obj.y,
        });
      }
      selectObject(obj.id);
    },
    [activeTool, getCanvasPosition, selectObject]
  );

  // 画像挿入処理
  const handleImageInsert = async (x: number, y: number) => {
    try {
      const filePath = await window.electronAPI.openImageDialog?.();
      if (!filePath) return;

      const imageBuffer = await window.electronAPI.readFile(filePath);
      const uint8Array = new Uint8Array(imageBuffer);

      // 画像のMIMEタイプを判定
      const isPng = filePath.toLowerCase().endsWith('.png');
      const mimeType = isPng ? 'image/png' : 'image/jpeg';

      // 画像サイズを取得
      const blob = new Blob([uint8Array], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);

        (async () => {
          // 画像の最大辺を2000pxに制限
          const maxDimension = 2000;
          let resizedData = uint8Array;
          let resizedWidth = img.width;
          let resizedHeight = img.height;

          const maxSide = Math.max(img.width, img.height);
          if (maxSide > maxDimension) {
            const ratio = maxDimension / maxSide;
            resizedWidth = Math.round(img.width * ratio);
            resizedHeight = Math.round(img.height * ratio);

            const canvas = document.createElement('canvas');
            canvas.width = resizedWidth;
            canvas.height = resizedHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, resizedWidth, resizedHeight);
              const blob: Blob | null = await new Promise((resolve) => {
                canvas.toBlob(
                  (b) => resolve(b),
                  mimeType,
                  mimeType === 'image/jpeg' ? 0.9 : undefined
                );
              });
              if (blob) {
                const buffer = await blob.arrayBuffer();
                resizedData = new Uint8Array(buffer);
              }
            }
          }

          // デフォルト表示サイズ（最大200px）
          let width = resizedWidth;
          let height = resizedHeight;
          const maxSize = 200;

          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width *= ratio;
            height *= ratio;
          }

          addImage({
            pageIndex: currentPage - 1,
            x,
            y,
            width,
            height,
            imageData: resizedData,
            mimeType,
            originalWidth: resizedWidth,
            originalHeight: resizedHeight,
          });
        })().catch((error) => {
          console.error('画像のリサイズに失敗:', error);
        });
      };

      img.src = url;
    } catch (error) {
      console.error('画像の挿入に失敗:', error);
    }
  };

  // マウスダウン（ドラッグ開始）
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (activeTool !== 'highlight' && activeTool !== 'underline') return;

    const pos = getCanvasPosition(e);
    setIsDrawing(true);
    setDrawStart(pos);
    setDrawCurrent(pos);
  }, [activeTool, getCanvasPosition]);

  // マウス移動（ドラッグ中）
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !drawStart) return;

    const pos = getCanvasPosition(e);
    setDrawCurrent(pos);
  }, [isDrawing, drawStart, getCanvasPosition]);

  // マウスアップ（ドラッグ終了）
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !drawStart || !drawCurrent) return;

    const pos = getCanvasPosition(e);
    const pageIndex = currentPage - 1;

    const x = Math.min(drawStart.x, pos.x);
    const y = Math.min(drawStart.y, pos.y);
    const width = Math.abs(pos.x - drawStart.x);
    const height = Math.abs(pos.y - drawStart.y);

    if (activeTool === 'highlight') {
      if (width > 5 && height > 5) {
        addHighlight({
          pageIndex,
          x,
          y,
          width,
          height,
          color: '#FFFF00',
          opacity: 0.3,
        });
      }
    } else if (activeTool === 'underline') {
      const x2 = pos.x;
      const y2 = pos.y;
      const dx = x2 - drawStart.x;
      const dy = y2 - drawStart.y;
      const length = Math.hypot(dx, dy);
      if (length > 5) {
        addUnderline({
          pageIndex,
          x: drawStart.x,
          y: drawStart.y,
          x2,
          y2,
          width: length,
          color: '#FF0000',
          thickness: 2,
          lineStyle: 'solid',
          lineCap: 'butt',
          arrowStart: false,
          arrowEnd: false,
        });
      }
    }

    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  }, [isDrawing, drawStart, drawCurrent, activeTool, currentPage, addHighlight, addUnderline, getCanvasPosition]);

  // 位置にあるオブジェクトを探す
  const findObjectAtPosition = (x: number, y: number, edits: ReturnType<typeof getCurrentPageEdits>) => {
    // テキスト
    for (const text of edits.texts) {
      if (x >= text.x && x <= text.x + 100 && y >= text.y && y <= text.y + text.fontSize) {
        return text;
      }
    }

    // ハイライト
    for (const highlight of edits.highlights) {
      if (x >= highlight.x && x <= highlight.x + highlight.width &&
          y >= highlight.y && y <= highlight.y + highlight.height) {
        return highlight;
      }
    }

    // 下線（線分に近いか判定）
    for (const underline of edits.underlines) {
      const x1 = underline.x;
      const y1 = underline.y;
      const x2 = underline.x2 ?? underline.x + underline.width;
      const y2 = underline.y2 ?? underline.y;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) continue;
      const t = ((x - x1) * dx + (y - y1) * dy) / lenSq;
      if (t < 0 || t > 1) continue;
      const projX = x1 + t * dx;
      const projY = y1 + t * dy;
      const dist = Math.hypot(x - projX, y - projY);
      const threshold = Math.max(underline.thickness, 4);
      if (dist <= threshold) return underline;
    }

    // コメント
    for (const comment of edits.comments) {
      if (x >= comment.x && x <= comment.x + 24 &&
          y >= comment.y && y <= comment.y + 24) {
        return comment;
      }
    }

    // 画像
    for (const image of edits.images) {
      if (x >= image.x && x <= image.x + image.width &&
          y >= image.y && y <= image.y + image.height) {
        return image;
      }
    }

    return null;
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const pos = getCanvasPositionFromClient(e.clientX, e.clientY);

      let nextX = pos.x - dragging.offsetX;
      let nextY = pos.y - dragging.offsetY;

      if (pageSize.width > 0) {
        nextX = Math.max(0, Math.min(nextX, pageSize.width));
      }
      if (pageSize.height > 0) {
        nextY = Math.max(0, Math.min(nextY, pageSize.height));
      }

      switch (dragging.type) {
        case 'text':
          updateText(dragging.id, { x: nextX, y: nextY });
          break;
        case 'highlight':
          updateHighlight(dragging.id, { x: nextX, y: nextY });
          break;
        case 'underline':
          {
            const newX2 = (dragging.underlineDeltaX ?? 0) + nextX;
            const newY2 = (dragging.underlineDeltaY ?? 0) + nextY;
            const length = Math.max(1, Math.hypot(newX2 - nextX, newY2 - nextY));
            updateUnderline(dragging.id, {
              x: nextX,
              y: nextY,
              x2: newX2,
              y2: newY2,
              width: length,
            });
          }
          break;
        case 'comment':
          updateComment(dragging.id, { x: nextX, y: nextY });
          break;
        case 'image':
          updateImage(dragging.id, { x: nextX, y: nextY });
          break;
      }
    };

    const handleUp = () => setDragging(null);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [
    dragging,
    getCanvasPositionFromClient,
    pageSize.width,
    pageSize.height,
    updateText,
    updateHighlight,
    updateUnderline,
    updateComment,
    updateImage,
  ]);

  useEffect(() => {
    if (!resizingUnderline) return;

    const handleMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const pos = getCanvasPositionFromClient(e.clientX, e.clientY);

      if (resizingUnderline.handle === 'start') {
        const x1 = pos.x;
        const y1 = pos.y;
        const x2 = resizingUnderline.otherX;
        const y2 = resizingUnderline.otherY;
        const length = Math.max(1, Math.hypot(x2 - x1, y2 - y1));
        updateUnderline(resizingUnderline.id, { x: x1, y: y1, x2, y2, width: length });
      } else {
        const x1 = resizingUnderline.otherX;
        const y1 = resizingUnderline.otherY;
        const x2 = pos.x;
        const y2 = pos.y;
        const length = Math.max(1, Math.hypot(x2 - x1, y2 - y1));
        updateUnderline(resizingUnderline.id, { x: x1, y: y1, x2, y2, width: length });
      }
    };

    const handleUp = () => setResizingUnderline(null);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [resizingUnderline, getCanvasPositionFromClient, updateUnderline]);

  useEffect(() => {
    if (!resizingHighlight) return;

    const handleMove = (e: MouseEvent) => {
      const pos = getCanvasPositionFromClient(e.clientX, e.clientY);
      const dx = pos.x - resizingHighlight.startX;
      const dy = pos.y - resizingHighlight.startY;

      let newX = resizingHighlight.startX;
      let newY = resizingHighlight.startY;
      let newWidth = resizingHighlight.startWidth;
      let newHeight = resizingHighlight.startHeight;

      switch (resizingHighlight.handle) {
        case 'se':
          newWidth = Math.max(5, resizingHighlight.startWidth + dx);
          newHeight = Math.max(5, resizingHighlight.startHeight + dy);
          break;
        case 'sw':
          newWidth = Math.max(5, resizingHighlight.startWidth - dx);
          newHeight = Math.max(5, resizingHighlight.startHeight + dy);
          newX = resizingHighlight.startX + dx;
          break;
        case 'ne':
          newWidth = Math.max(5, resizingHighlight.startWidth + dx);
          newHeight = Math.max(5, resizingHighlight.startHeight - dy);
          newY = resizingHighlight.startY + dy;
          break;
        case 'nw':
          newWidth = Math.max(5, resizingHighlight.startWidth - dx);
          newHeight = Math.max(5, resizingHighlight.startHeight - dy);
          newX = resizingHighlight.startX + dx;
          newY = resizingHighlight.startY + dy;
          break;
      }

      updateHighlight(resizingHighlight.id, {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    };

    const handleUp = () => setResizingHighlight(null);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [resizingHighlight, getCanvasPositionFromClient, updateHighlight]);

  useEffect(() => {
    if (!resizingImage) return;

    const handleMove = (e: MouseEvent) => {
      const pos = getCanvasPositionFromClient(e.clientX, e.clientY);
      const dx = pos.x - resizingImage.startX;
      const dy = pos.y - resizingImage.startY;

      let newX = resizingImage.startX;
      let newY = resizingImage.startY;
      let newWidth = resizingImage.startWidth;
      let newHeight = resizingImage.startHeight;

      switch (resizingImage.handle) {
        case 'se':
          newWidth = Math.max(5, resizingImage.startWidth + dx);
          newHeight = Math.max(5, resizingImage.startHeight + dy);
          break;
        case 'sw':
          newWidth = Math.max(5, resizingImage.startWidth - dx);
          newHeight = Math.max(5, resizingImage.startHeight + dy);
          newX = resizingImage.startX + dx;
          break;
        case 'ne':
          newWidth = Math.max(5, resizingImage.startWidth + dx);
          newHeight = Math.max(5, resizingImage.startHeight - dy);
          newY = resizingImage.startY + dy;
          break;
        case 'nw':
          newWidth = Math.max(5, resizingImage.startWidth - dx);
          newHeight = Math.max(5, resizingImage.startHeight - dy);
          newX = resizingImage.startX + dx;
          newY = resizingImage.startY + dy;
          break;
      }

      updateImage(resizingImage.id, {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    };

    const handleUp = () => setResizingImage(null);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [resizingImage, getCanvasPositionFromClient, updateImage]);

  // 編集オブジェクトをオーバーレイに描画
  const renderEditOverlay = () => {
    const edits = getCurrentPageEdits();

    return (
      <>
        {/* ハイライト */}
        {edits.highlights.map((highlight) => {
          const canvas = canvasRef.current;
          if (!canvas) return null;
          const rect = canvas.getBoundingClientRect();
          const scaleX = rect.width / canvas.width;
          const scaleY = rect.height / canvas.height;
          const x = highlight.x * scaleX;
          const y = highlight.y * scaleY;
          const width = highlight.width * scaleX;
          const height = highlight.height * scaleY;
          return (
            <div
              key={highlight.id}
              className={`absolute cursor-pointer ${selectedObjectId === highlight.id ? 'ring-2 ring-blue-500' : ''}`}
              style={{
                left: x,
                top: y,
                width,
                height,
                backgroundColor: highlight.color,
                opacity: highlight.opacity,
                pointerEvents: 'auto',
              }}
              onMouseDown={(e) => startDrag(e, highlight, 'highlight')}
              onClick={(e) => {
                e.stopPropagation();
                selectObject(highlight.id);
              }}
            >
              {selectedObjectId === highlight.id && activeTool === 'select' ? (
                <>
                  <div
                    className="absolute w-3 h-3 bg-white border border-blue-500 rounded-full"
                    style={{ left: -6, top: -6, cursor: 'nwse-resize', pointerEvents: 'auto' }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setResizingHighlight({
                        id: highlight.id,
                        handle: 'nw',
                        startX: highlight.x,
                        startY: highlight.y,
                        startWidth: highlight.width,
                        startHeight: highlight.height,
                      });
                    }}
                  />
                  <div
                    className="absolute w-3 h-3 bg-white border border-blue-500 rounded-full"
                    style={{ right: -6, top: -6, cursor: 'nesw-resize', pointerEvents: 'auto' }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setResizingHighlight({
                        id: highlight.id,
                        handle: 'ne',
                        startX: highlight.x,
                        startY: highlight.y,
                        startWidth: highlight.width,
                        startHeight: highlight.height,
                      });
                    }}
                  />
                  <div
                    className="absolute w-3 h-3 bg-white border border-blue-500 rounded-full"
                    style={{ left: -6, bottom: -6, cursor: 'nesw-resize', pointerEvents: 'auto' }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setResizingHighlight({
                        id: highlight.id,
                        handle: 'sw',
                        startX: highlight.x,
                        startY: highlight.y,
                        startWidth: highlight.width,
                        startHeight: highlight.height,
                      });
                    }}
                  />
                  <div
                    className="absolute w-3 h-3 bg-white border border-blue-500 rounded-full"
                    style={{ right: -6, bottom: -6, cursor: 'nwse-resize', pointerEvents: 'auto' }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setResizingHighlight({
                        id: highlight.id,
                        handle: 'se',
                        startX: highlight.x,
                        startY: highlight.y,
                        startWidth: highlight.width,
                        startHeight: highlight.height,
                      });
                    }}
                  />
                </>
              ) : null}
            </div>
          );
        })}

        {/* 下線 */}
        {edits.underlines.map((underline) => {
          const canvas = canvasRef.current;
          if (!canvas) return null;
          const rect = canvas.getBoundingClientRect();
          const scaleX = rect.width / canvas.width;
          const scaleY = rect.height / canvas.height;
          const x1 = underline.x;
          const y1 = underline.y;
          const x2 = underline.x2 ?? underline.x + underline.width;
          const y2 = underline.y2 ?? underline.y;
          const minX = Math.min(x1, x2);
          const minY = Math.min(y1, y2);
          const maxX = Math.max(x1, x2);
          const maxY = Math.max(y1, y2);
          const widthPx = Math.max((maxX - minX) * scaleX, 1);
          const heightPx = Math.max((maxY - minY) * scaleY, 1);
          const lineStyle = underline.lineStyle ?? 'solid';
          const dashArray = lineStyle === 'dashed' ? '8 6' : lineStyle === 'dotted' ? '2 6' : undefined;
          const lineCap = underline.lineCap ?? 'butt';
          const arrowStart = !!underline.arrowStart;
          const arrowEnd = !!underline.arrowEnd;
          const markerId = `arrow-${underline.id}`;
          return (
            <div
              key={underline.id}
              className={`absolute cursor-pointer ${selectedObjectId === underline.id ? 'ring-2 ring-blue-500' : ''}`}
              style={{
                left: minX * scaleX,
                top: minY * scaleY,
                width: widthPx,
                height: heightPx,
                pointerEvents: 'auto',
              }}
              onMouseDown={(e) => startDrag(e, underline, 'underline')}
              onClick={(e) => {
                e.stopPropagation();
                selectObject(underline.id);
              }}
            >
              <svg width={widthPx} height={heightPx} className="block">
                <defs>
                  <marker
                    id={markerId}
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={underline.color} />
                  </marker>
                </defs>
                <line
                  x1={(x1 - minX) * scaleX}
                  y1={(y1 - minY) * scaleY}
                  x2={(x2 - minX) * scaleX}
                  y2={(y2 - minY) * scaleY}
                  stroke={underline.color}
                  strokeWidth={Math.max(underline.thickness * scaleY, 1)}
                  strokeDasharray={dashArray}
                  strokeLinecap={lineCap}
                  markerStart={arrowStart ? `url(#${markerId})` : undefined}
                  markerEnd={arrowEnd ? `url(#${markerId})` : undefined}
                />
              </svg>
              {selectedObjectId === underline.id && activeTool === 'select' ? (
                <>
                  <div
                    className="absolute w-3 h-3 bg-white border border-blue-500 rounded-full"
                    style={{
                      left: (x1 - minX) * scaleX - 6,
                      top: (y1 - minY) * scaleY - 6,
                      pointerEvents: 'auto',
                      cursor: 'grab',
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setResizingUnderline({
                        id: underline.id,
                        handle: 'start',
                        otherX: x2,
                        otherY: y2,
                      });
                    }}
                  />
                  <div
                    className="absolute w-3 h-3 bg-white border border-blue-500 rounded-full"
                    style={{
                      left: (x2 - minX) * scaleX - 6,
                      top: (y2 - minY) * scaleY - 6,
                      pointerEvents: 'auto',
                      cursor: 'grab',
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setResizingUnderline({
                        id: underline.id,
                        handle: 'end',
                        otherX: x1,
                        otherY: y1,
                      });
                    }}
                  />
                </>
              ) : null}
            </div>
          );
        })}

        {/* テキスト */}
        {edits.texts.map((text) => {
          const canvas = canvasRef.current;
          if (!canvas) return null;
          const rect = canvas.getBoundingClientRect();
          const scaleX = rect.width / canvas.width;
          const scaleY = rect.height / canvas.height;
          return (
            <div
              key={text.id}
              className={`absolute cursor-pointer ${selectedObjectId === text.id ? 'ring-2 ring-blue-500' : ''}`}
              style={{
                left: text.x * scaleX,
                top: text.y * scaleY,
                fontSize: text.fontSize * scaleY,
                color: text.color,
                fontFamily: text.fontFamily,
                whiteSpace: 'pre-wrap',
                pointerEvents: 'auto',
              }}
              onMouseDown={(e) => startDrag(e, text, 'text')}
              onClick={(e) => {
                e.stopPropagation();
                selectObject(text.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingTextId(text.id);
              }}
            >
              {editingTextId === text.id ? (
                <input
                  type="text"
                  value={text.text}
                  onChange={(e) => updateText(text.id, { text: e.target.value })}
                  onBlur={() => setEditingTextId(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setEditingTextId(null);
                  }}
                  autoFocus
                  className="bg-white text-black border border-blue-500 outline-none px-1"
                  style={{
                    fontSize: text.fontSize * scaleY,
                    fontFamily: text.fontFamily,
                  }}
                />
              ) : (
                text.text
              )}
            </div>
          );
        })}

        {/* コメント */}
        {edits.comments.map((comment) => {
          const canvas = canvasRef.current;
          if (!canvas) return null;
          const rect = canvas.getBoundingClientRect();
          const scaleX = rect.width / canvas.width;
          const scaleY = rect.height / canvas.height;
          return (
            <div
              key={comment.id}
              className={`absolute cursor-pointer ${selectedObjectId === comment.id ? 'ring-2 ring-blue-500' : ''}`}
              style={{
                left: comment.x * scaleX,
                top: comment.y * scaleY,
                pointerEvents: 'auto',
              }}
              onMouseDown={(e) => startDrag(e, comment, 'comment')}
              onClick={(e) => {
                e.stopPropagation();
                selectObject(comment.id);
              }}
              title={comment.text}
            >
              <div className="w-6 h-6 bg-yellow-400 border border-yellow-600 rounded flex items-center justify-center text-xs">
                <svg className="w-4 h-4 text-yellow-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
            </div>
          );
        })}

        {/* コメント入力（インライン） */}
        {commentDraft && (() => {
          const canvas = canvasRef.current;
          if (!canvas) return null;
          const rect = canvas.getBoundingClientRect();
          const scaleX = rect.width / canvas.width;
          const scaleY = rect.height / canvas.height;
          return (
            <div
              className="absolute"
              style={{
                left: commentDraft.x * scaleX,
                top: commentDraft.y * scaleY,
                pointerEvents: 'auto',
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                value={commentDraft.text}
                onChange={(e) => setCommentDraft((prev) => (prev ? { ...prev, text: e.target.value } : prev))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const text = commentDraft.text.trim();
                    if (text) {
                      addComment({
                        pageIndex: currentPage - 1,
                        x: commentDraft.x,
                        y: commentDraft.y,
                        text,
                        createdAt: new Date(),
                      });
                    }
                    setCommentDraft(null);
                  }
                  if (e.key === 'Escape') {
                    setCommentDraft(null);
                  }
                }}
                onBlur={() => {
                  const text = commentDraft.text.trim();
                  if (text) {
                    addComment({
                      pageIndex: currentPage - 1,
                      x: commentDraft.x,
                      y: commentDraft.y,
                      text,
                      createdAt: new Date(),
                    });
                  }
                  setCommentDraft(null);
                }}
                autoFocus
                placeholder="コメントを入力"
                className="bg-white text-black border border-blue-500 outline-none px-2 py-1 text-sm rounded shadow"
              />
            </div>
          );
        })()}

        {/* 画像 */}
        {edits.images.map((image) => {
          const canvas = canvasRef.current;
          if (!canvas) return null;
          const rect = canvas.getBoundingClientRect();
          const scaleX = rect.width / canvas.width;
          const scaleY = rect.height / canvas.height;
          return (
            <ImageOverlay
              key={image.id}
              image={image}
              scaleX={scaleX}
              scaleY={scaleY}
              isSelected={selectedObjectId === image.id}
              onSelect={() => selectObject(image.id)}
              onMouseDown={(e) => startDrag(e, image, 'image')}
              activeTool={activeTool}
              onResizeStart={(handle) => {
                setResizingImage({
                  id: image.id,
                  handle,
                  startX: image.x,
                  startY: image.y,
                  startWidth: image.width,
                  startHeight: image.height,
                });
              }}
            />
          );
        })}

        {/* ドラッグ中のプレビュー */}
        {isDrawing && drawStart && drawCurrent && (() => {
          const canvas = canvasRef.current;
          if (!canvas) return null;
          const rect = canvas.getBoundingClientRect();
          const scaleX = rect.width / canvas.width;
          const scaleY = rect.height / canvas.height;
          if (activeTool === 'underline') {
            const x1 = drawStart.x * scaleX;
            const y1 = drawStart.y * scaleY;
            const x2 = drawCurrent.x * scaleX;
            const y2 = drawCurrent.y * scaleY;
            const minX = Math.min(x1, x2);
            const minY = Math.min(y1, y2);
            const width = Math.max(Math.abs(x2 - x1), 1);
            const height = Math.max(Math.abs(y2 - y1), 1);
            return (
              <svg
                className="absolute pointer-events-none"
                style={{ left: minX, top: minY }}
                width={width}
                height={height}
              >
                <line
                  x1={x1 - minX}
                  y1={y1 - minY}
                  x2={x2 - minX}
                  y2={y2 - minY}
                  stroke="#FF0000"
                  strokeWidth={2}
                />
              </svg>
            );
          }

          const x = Math.min(drawStart.x, drawCurrent.x) * scaleX;
          const y = Math.min(drawStart.y, drawCurrent.y) * scaleY;
          const width = Math.abs(drawCurrent.x - drawStart.x) * scaleX;
          const height = Math.abs(drawCurrent.y - drawStart.y) * scaleY;
          return (
            <div
              className="absolute border-2 border-dashed pointer-events-none"
              style={{
                left: x,
                top: y,
                width: width,
                height: height,
                borderColor: '#FFFF00',
                backgroundColor: 'rgba(255, 255, 0, 0.2)',
              }}
            />
          );
        })()}
      </>
    );
  };

  // PDFが読み込まれていない場合
  if (!pdfBuffer || !pdfDocument) {
    return (
      <div
        ref={containerRef}
        className="flex items-center justify-center p-8 min-h-full"
        style={{ backgroundColor: '#525659' }}
      >
        <div className="text-center text-gray-400">
          <svg
            className="mx-auto h-16 w-16 mb-4 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <p className="text-lg">PDFを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center p-8 min-h-full"
      style={{ backgroundColor: '#525659' }}
    >
      {renderError ? (
        <div className="text-center text-red-400">
          <svg
            className="mx-auto h-16 w-16 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-lg mb-2">レンダリングエラー</p>
          <p className="text-sm">{renderError}</p>
        </div>
      ) : (
        <div
          className="relative shadow-2xl"
          style={pageSize.width > 0 && pageSize.height > 0 ? { width: pageSize.width, height: pageSize.height } : {}}
        >
          {/* PDFキャンバス */}
          <canvas
            ref={canvasRef}
            className="bg-white"
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              if (isDrawing) {
                setIsDrawing(false);
                setDrawStart(null);
                setDrawCurrent(null);
              }
            }}
            style={{ cursor: getCursor(activeTool) }}
          />

          {/* 編集オーバーレイ */}
          <div
            ref={overlayRef}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="pointer-events-auto">
              {renderEditOverlay()}
            </div>
          </div>

          {/* レンダリング中表示 */}
          {pageSize.width === 0 || pageSize.height === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <svg
                className="mx-auto h-16 w-16 mb-4 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <p className="text-lg">ページをレンダリング中...</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

// 画像オーバーレイコンポーネント
interface ImageOverlayProps {
  image: ImageEdit;
  scaleX: number;
  scaleY: number;
  isSelected: boolean;
  onSelect: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  activeTool: string;
  onResizeStart: (handle: 'nw' | 'ne' | 'sw' | 'se') => void;
}

const ImageOverlay: React.FC<ImageOverlayProps> = ({
  image,
  scaleX,
  scaleY,
  isSelected,
  onSelect,
  onMouseDown,
  activeTool,
  onResizeStart,
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const blob = new Blob([image.imageData as BlobPart], { type: image.mimeType });
    const url = URL.createObjectURL(blob);
    setImageUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [image.imageData, image.mimeType]);

  return (
    <div
      className={`absolute cursor-pointer ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        left: image.x * scaleX,
        top: image.y * scaleY,
        width: image.width * scaleX,
        height: image.height * scaleY,
        pointerEvents: 'auto',
      }}
      onMouseDown={onMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-contain"
          draggable={false}
        />
      )}
      {isSelected && (
        <>
          {activeTool === 'select' ? (
            <>
              <div
                className="absolute -left-1 -top-1 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-nwse-resize"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onResizeStart('nw');
                }}
              />
              <div
                className="absolute -right-1 -top-1 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-nesw-resize"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onResizeStart('ne');
                }}
              />
              <div
                className="absolute -left-1 -bottom-1 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-nesw-resize"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onResizeStart('sw');
                }}
              />
              <div
                className="absolute -right-1 -bottom-1 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-nwse-resize"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onResizeStart('se');
                }}
              />
            </>
          ) : null}
        </>
      )}
    </div>
  );
};

// ツールに応じたカーソルを取得
function getCursor(tool: string): string {
  switch (tool) {
    case 'text':
      return 'text';
    case 'highlight':
    case 'underline':
      return 'crosshair';
    case 'image':
      return 'copy';
    case 'comment':
      return 'cell';
    default:
      return 'default';
  }
}

export default EditCanvas;
