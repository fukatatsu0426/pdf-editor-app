/// <reference types="vite/client" />

interface ElectronAPI {
  platform: string;
  openFileDialog: () => Promise<string | null>;
  openMultipleFilesDialog: () => Promise<string[] | null>;
  saveFileDialog: (defaultFileName: string) => Promise<string | null>;
  selectFolderDialog: () => Promise<string | null>;
  readFile: (filePath: string) => Promise<ArrayBuffer>;
  writeFile: (filePath: string, data: Uint8Array) => Promise<void>;
}

interface Window {
  electronAPI: ElectronAPI;
}
