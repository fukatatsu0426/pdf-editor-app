import { ipcMain, dialog } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

// ファイル選択ダイアログを開く（単一ファイル）
export function registerFileHandlers() {
  // PDFファイルを開く
  ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      title: 'PDFファイルを選択'
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  // 複数のPDFファイルを開く（統合機能用）
  ipcMain.handle('open-multiple-files-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] },
      ],
      title: '統合するPDFファイルを選択'
    });

    if (result.canceled) {
      return [];
    }

    return result.filePaths;
  });

  // ファイルを読み込む
  ipcMain.handle('read-file', async (_event, filePath: string) => {
    try {
      const buffer = await fs.readFile(filePath);
      return buffer;
    } catch (error) {
      console.error('ファイル読み込みエラー:', error);
      throw error;
    }
  });

  // ファイル保存ダイアログを開く
  ipcMain.handle('save-file-dialog', async (_event, defaultName?: string) => {
    const result = await dialog.showSaveDialog({
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] },
      ],
      defaultPath: defaultName || 'document.pdf',
      title: 'PDFファイルを保存'
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    return result.filePath;
  });

  // ファイルを書き込む
  ipcMain.handle('write-file', async (_event, filePath: string, data: Uint8Array) => {
    try {
      await fs.writeFile(filePath, data);
      return { success: true };
    } catch (error) {
      console.error('ファイル書き込みエラー:', error);
      throw error;
    }
  });

  // フォルダ選択ダイアログ（分割機能用）
  ipcMain.handle('select-folder-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '保存先フォルダを選択'
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });
}
