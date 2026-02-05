import { contextBridge, ipcRenderer } from 'electron';

// Electronの機能をReactアプリから安全に使用するためのAPIを公開
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // ファイル操作
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  openMultipleFilesDialog: () => ipcRenderer.invoke('open-multiple-files-dialog'),
  openImageDialog: () => ipcRenderer.invoke('open-image-dialog'),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  saveFileDialog: (defaultName?: string) => ipcRenderer.invoke('save-file-dialog', defaultName),
  writeFile: (filePath: string, data: Uint8Array) => ipcRenderer.invoke('write-file', filePath, data),
  selectFolderDialog: () => ipcRenderer.invoke('select-folder-dialog'),
});

// TypeScript型定義をグローバルに追加
declare global {
  interface Window {
    electronAPI: {
      platform: string;
      openFileDialog: () => Promise<string | null>;
      openMultipleFilesDialog: () => Promise<string[]>;
      openImageDialog: () => Promise<string | null>;
      readFile: (filePath: string) => Promise<ArrayBuffer>;
      saveFileDialog: (defaultName?: string) => Promise<string | null>;
      writeFile: (filePath: string, data: Uint8Array) => Promise<{ success: boolean }>;
      selectFolderDialog: () => Promise<string | null>;
    };
  }
}
