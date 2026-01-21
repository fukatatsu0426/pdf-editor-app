import { usePDF } from '../../contexts/PDFContext';

export default function Toolbar() {
  const {
    currentPage,
    totalPages,
    scale,
    previousPage,
    nextPage,
    zoomIn,
    zoomOut,
    resetZoom,
    loadDocument,
  } = usePDF();

  const handleOpenFile = async () => {
    try {
      const filePath = await window.electronAPI.openFileDialog();
      if (!filePath) return;

      const arrayBuffer = await window.electronAPI.readFile(filePath);
      await loadDocument(arrayBuffer, filePath);
    } catch (error) {
      console.error('ファイルを開くエラー:', error);
      alert('PDFファイルを開けませんでした');
    }
  };

  return (
    <div className="bg-gray-800 text-white p-3 flex items-center justify-between shadow-lg">
      {/* 左側: ファイル操作 */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleOpenFile}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors font-medium"
        >
          PDFを開く
        </button>
      </div>

      {/* 中央: ページ操作 */}
      {totalPages > 0 && (
        <div className="flex items-center gap-4">
          <button
            onClick={previousPage}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← 前へ
          </button>

          <span className="font-medium">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            次へ →
          </button>
        </div>
      )}

      {/* 右側: ズーム操作 */}
      {totalPages > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            −
          </button>

          <span className="font-medium min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={zoomIn}
            disabled={scale >= 3.0}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            +
          </button>

          <button
            onClick={resetZoom}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-sm"
          >
            リセット
          </button>
        </div>
      )}
    </div>
  );
}
