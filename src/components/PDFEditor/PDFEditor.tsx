import React, { useCallback } from 'react';
import { useEdit } from '../../contexts/EditContext';
import EditToolbar from './EditToolbar';
import EditCanvas from './EditCanvas';
import PageThumbnails from './PageThumbnails';
import PropertyPanel from './PropertyPanel';

const PDFEditor: React.FC = () => {
  const { pdfBuffer, filePath, isLoading, error, loadPDF, save, saveAs, isDirty, totalPages } = useEdit();

  // ファイルを開く
  const handleOpen = useCallback(async () => {
    try {
      const selectedPath = await window.electronAPI.openFileDialog();
      if (!selectedPath) return;

      const buffer = await window.electronAPI.readFile(selectedPath);
      await loadPDF(buffer, selectedPath);
    } catch (err) {
      console.error('ファイルを開けませんでした:', err);
    }
  }, [loadPDF]);

  // 保存処理
  const handleSave = useCallback(async () => {
    if (filePath) {
      await save();
    } else {
      await saveAs();
    }
  }, [filePath, save, saveAs]);

  // PDFが読み込まれていない場合
  if (!pdfBuffer) {
    return (
      <div className="flex flex-col h-full bg-gray-900">
        {/* ツールバー */}
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700">
          <button
            onClick={handleOpen}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            PDFを開く
          </button>
        </div>

        {/* メッセージ */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg
              className="mx-auto h-16 w-16 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg">PDFファイルを開いて編集を開始してください</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* メインツールバー */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700">
        <button
          onClick={handleOpen}
          className="px-3 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm"
        >
          開く
        </button>
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className={`px-3 py-1.5 rounded transition-colors text-sm ${
            isDirty
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          保存
        </button>
        <button
          onClick={saveAs}
          className="px-3 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm"
        >
          名前を付けて保存
        </button>

        <div className="h-6 w-px bg-gray-600 mx-2" />

        {/* ファイルパス表示 */}
        {filePath && (
          <span className="text-sm text-gray-400 truncate max-w-md" title={filePath}>
            {filePath.split(/[\\/]/).pop()}
            {isDirty && <span className="text-yellow-500 ml-1">*</span>}
          </span>
        )}

        <div className="flex-1" />

        {/* ページ情報 */}
        <span className="text-sm text-gray-400">
          {totalPages}ページ
        </span>
      </div>

      {/* 編集ツールバー */}
      <EditToolbar />

      {/* エラー表示 */}
      {error && (
        <div className="px-4 py-2 bg-red-900 text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* ローディング */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg px-6 py-4 text-white">
            処理中...
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="flex-1 flex overflow-hidden">
        {/* サムネイルパネル */}
        <div className="w-48 bg-gray-850 border-r border-gray-700 overflow-y-auto">
          <PageThumbnails />
        </div>

        {/* 編集キャンバス */}
        <div className="flex-1 overflow-auto">
          <EditCanvas />
        </div>

        {/* プロパティパネル */}
        <div className="w-64 bg-gray-850 border-l border-gray-700 overflow-y-auto">
          <PropertyPanel />
        </div>
      </div>
    </div>
  );
};

export default PDFEditor;
