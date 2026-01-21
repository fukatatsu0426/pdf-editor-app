import { useState } from 'react';
import FileList from './FileList';
import { mergePDFs } from '../../services/pdfService';

interface FileItem {
  id: string;
  name: string;
  path: string;
}

export default function FileMerger() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // ファイルを追加
  const handleAddFiles = async () => {
    try {
      const filePaths = await window.electronAPI.openMultipleFilesDialog();
      if (filePaths.length === 0) return;

      const newFiles: FileItem[] = filePaths.map((path) => ({
        id: Math.random().toString(36).substring(7),
        name: path.split('/').pop() || path.split('\\').pop() || path,
        path,
      }));

      setFiles((prev) => [...prev, ...newFiles]);
    } catch (error) {
      console.error('ファイル選択エラー:', error);
      alert('ファイルの選択に失敗しました');
    }
  };

  // ファイルを削除
  const handleRemove = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  // ファイルを上に移動
  const handleMoveUp = (id: string) => {
    setFiles((prev) => {
      const index = prev.findIndex((f) => f.id === id);
      if (index <= 0) return prev;

      const newFiles = [...prev];
      [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
      return newFiles;
    });
  };

  // ファイルを下に移動
  const handleMoveDown = (id: string) => {
    setFiles((prev) => {
      const index = prev.findIndex((f) => f.id === id);
      if (index < 0 || index >= prev.length - 1) return prev;

      const newFiles = [...prev];
      [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
      return newFiles;
    });
  };

  // PDF統合を実行
  const handleMerge = async () => {
    if (files.length < 2) {
      alert('2つ以上のPDFファイルを選択してください');
      return;
    }

    setIsProcessing(true);

    try {
      // すべてのファイルを読み込み（エラー検出を改善）
      const fileBuffers: ArrayBuffer[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          console.log(`ファイル ${i + 1}/${files.length} を読み込み中: ${file.name}`);
          const buffer = await window.electronAPI.readFile(file.path);

          // ファイルが空でないか確認
          if (buffer.byteLength === 0) {
            throw new Error(`ファイルが空です: ${file.name}`);
          }

          fileBuffers.push(buffer);
        } catch (error) {
          throw new Error(`ファイルの読み込みに失敗: ${file.name}\n${error instanceof Error ? error.message : '不明なエラー'}`);
        }
      }

      console.log('PDF統合を開始...');

      // PDFを統合
      const mergedPdfBytes = await mergePDFs(fileBuffers);

      console.log('統合完了。保存先を選択...');

      // 保存先を選択
      const savePath = await window.electronAPI.saveFileDialog('merged.pdf');
      if (!savePath) {
        setIsProcessing(false);
        return;
      }

      // ファイルを保存
      await window.electronAPI.writeFile(savePath, mergedPdfBytes);

      alert('PDFの統合が完了しました！');
      setFiles([]);
    } catch (error) {
      console.error('PDF統合エラー:', error);
      const errorMessage = error instanceof Error ? error.message : 'PDFの統合に失敗しました';
      alert(`エラー: ${errorMessage}\n\n暗号化されたPDFや破損したPDFは統合できません。`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 bg-gray-50">
      {/* ヘッダー */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">PDF統合</h2>
        <p className="text-gray-600">複数のPDFファイルを1つに結合します</p>
      </div>

      {/* ファイルリスト */}
      <div className="flex-1 mb-6 overflow-auto">
        <FileList
          files={files}
          onRemove={handleRemove}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
        />
      </div>

      {/* 操作ボタン */}
      <div className="flex gap-4">
        <button
          onClick={handleAddFiles}
          disabled={isProcessing}
          className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ファイルを追加
        </button>

        <button
          onClick={handleMerge}
          disabled={files.length < 2 || isProcessing}
          className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? '処理中...' : 'PDF統合を実行'}
        </button>
      </div>

      {/* ファイル数表示 */}
      {files.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-600">
          {files.length}個のファイルが選択されています
        </div>
      )}
    </div>
  );
}
