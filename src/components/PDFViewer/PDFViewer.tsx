import { useEffect, useRef } from 'react';
import { usePDF } from '../../contexts/PDFContext';

export default function PDFViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { document, currentPage, scale } = usePDF();

  useEffect(() => {
    if (!document || !canvasRef.current) return;

    const renderPage = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        // ページを取得
        const page = await document.getPage(currentPage);

        // ビューポート（表示サイズ）を設定
        const viewport = page.getViewport({ scale });

        // Canvasのサイズを設定
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // ページをレンダリング
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (error) {
        console.error('ページのレンダリングエラー:', error);
      }
    };

    renderPage();
  }, [document, currentPage, scale]);

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p className="text-gray-500 text-lg">
          PDFファイルを開いてください
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full bg-gray-200 overflow-auto p-4">
      <canvas
        ref={canvasRef}
        className="shadow-2xl bg-white"
      />
    </div>
  );
}
