import { useState } from 'react';
import { splitPDF } from '../../services/pdfService';
import { loadPDF } from '../../utils/pdfUtils';
import { PDFDocumentProxy } from 'pdfjs-dist';

interface SplitRange {
  id: string;
  start: number;
  end: number;
  filename: string;
}

export default function FileSplitter() {
  const [pdfFile, setPdfFile] = useState<{ path: string; name: string } | null>(null);
  const [, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [splitRanges, setSplitRanges] = useState<SplitRange[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // PDFファイルを開く
  const handleOpenFile = async () => {
    try {
      const filePath = await window.electronAPI.openFileDialog();
      if (!filePath) return;

      const arrayBuffer = await window.electronAPI.readFile(filePath);
      const pdf = await loadPDF(arrayBuffer);

      setPdfFile({
        path: filePath,
        name: filePath.split('/').pop() || filePath.split('\\').pop() || filePath,
      });
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setSplitRanges([]);
    } catch (error) {
      console.error('PDFファイルを開くエラー:', error);
      alert('PDFファイルを開けませんでした');
    }
  };

  // 分割範囲を追加
  const handleAddRange = () => {
    const newRange: SplitRange = {
      id: Math.random().toString(36).substring(7),
      start: 1,
      end: totalPages,
      filename: `part${splitRanges.length + 1}.pdf`,
    };
    setSplitRanges((prev) => [...prev, newRange]);
  };

  // 分割範囲を削除
  const handleRemoveRange = (id: string) => {
    setSplitRanges((prev) => prev.filter((range) => range.id !== id));
  };

  // 分割範囲を更新
  const handleUpdateRange = (id: string, field: keyof SplitRange, value: string | number) => {
    setSplitRanges((prev) =>
      prev.map((range) => (range.id === id ? { ...range, [field]: value } : range))
    );
  };

  // PDF分割を実行
  const handleSplit = async () => {
    if (!pdfFile || splitRanges.length === 0) {
      alert('分割範囲を指定してください');
      return;
    }

    // バリデーション
    for (const range of splitRanges) {
      if (range.start < 1 || range.end > totalPages || range.start > range.end) {
        alert(`無効なページ範囲: ${range.filename} (${range.start}-${range.end})`);
        return;
      }
      if (!range.filename.trim()) {
        alert('ファイル名を入力してください');
        return;
      }
    }

    setIsProcessing(true);

    try {
      // 保存先フォルダを選択
      const folderPath = await window.electronAPI.selectFolderDialog();
      if (!folderPath) {
        setIsProcessing(false);
        return;
      }

      // PDFファイルを読み込み
      const arrayBuffer = await window.electronAPI.readFile(pdfFile.path);

      // PDF分割を実行
      const results = await splitPDF(arrayBuffer, splitRanges);

      // 各ファイルを保存
      let savedCount = 0;
      for (const [filename, pdfBytes] of results.entries()) {
        const savePath = `${folderPath}/${filename}`;
        await window.electronAPI.writeFile(savePath, pdfBytes);
        savedCount++;
      }

      alert(`PDF分割が完了しました！\n${savedCount}個のファイルを作成しました。`);
      setSplitRanges([]);
    } catch (error) {
      console.error('PDF分割エラー:', error);
      const errorMessage = error instanceof Error ? error.message : 'PDF分割に失敗しました';
      alert(`エラー: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 bg-gray-50">
      {/* ヘッダー */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">PDF分割</h2>
        <p className="text-gray-600">1つのPDFファイルを複数のファイルに分割します</p>
      </div>

      {/* PDFファイル選択 */}
      <div className="mb-6">
        <button
          onClick={handleOpenFile}
          disabled={isProcessing}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          PDFファイルを開く
        </button>

        {pdfFile && (
          <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg">
            <p className="font-medium text-gray-900">{pdfFile.name}</p>
            <p className="text-sm text-gray-600 mt-1">総ページ数: {totalPages}ページ</p>
          </div>
        )}
      </div>

      {/* 分割範囲リスト */}
      {pdfFile && (
        <>
          <div className="flex-1 mb-6 overflow-auto">
            {splitRanges.length === 0 ? (
              <div className="flex items-center justify-center h-64 bg-white border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">「分割範囲を追加」ボタンをクリックしてください</p>
              </div>
            ) : (
              <div className="space-y-3">
                {splitRanges.map((range, index) => (
                  <div
                    key={range.id}
                    className="p-4 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {/* 番号 */}
                      <span className="text-gray-500 font-mono text-sm w-8">
                        {index + 1}
                      </span>

                      {/* ページ範囲 */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">開始:</label>
                        <input
                          type="number"
                          min="1"
                          max={totalPages}
                          value={range.start}
                          onChange={(e) =>
                            handleUpdateRange(range.id, 'start', parseInt(e.target.value) || 1)
                          }
                          className="w-20 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <span className="text-gray-400">〜</span>

                        <label className="text-sm text-gray-600">終了:</label>
                        <input
                          type="number"
                          min="1"
                          max={totalPages}
                          value={range.end}
                          onChange={(e) =>
                            handleUpdateRange(range.id, 'end', parseInt(e.target.value) || totalPages)
                          }
                          className="w-20 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <span className="text-sm text-gray-500">
                          ({range.end - range.start + 1}ページ)
                        </span>
                      </div>

                      {/* ファイル名 */}
                      <div className="flex items-center gap-2 flex-1">
                        <label className="text-sm text-gray-600">名前:</label>
                        <input
                          type="text"
                          value={range.filename}
                          onChange={(e) => handleUpdateRange(range.id, 'filename', e.target.value)}
                          placeholder="part1.pdf"
                          className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* 削除ボタン */}
                      <button
                        onClick={() => handleRemoveRange(range.id)}
                        className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 操作ボタン */}
          <div className="flex gap-4">
            <button
              onClick={handleAddRange}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              分割範囲を追加
            </button>

            <button
              onClick={handleSplit}
              disabled={splitRanges.length === 0 || isProcessing}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isProcessing ? '処理中...' : 'PDF分割を実行'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
