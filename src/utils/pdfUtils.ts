import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

// PDF.jsのワーカーを設定
// CDN依存を避けてローカルバンドルを使用（Electron/オフライン環境でも安定動作）
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
  console.log('PDF.js worker configured:', pdfjsWorkerUrl);
} catch (error) {
  console.error('Failed to configure PDF.js worker:', error);
  // フォールバック: CDNを使用
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export { pdfjsLib };

// PDFドキュメントを読み込む
export async function loadPDF(data: ArrayBuffer) {
  const loadingTask = pdfjsLib.getDocument({ data });
  return await loadingTask.promise;
}

// Canvas座標からPDF座標への変換
// Canvas: 左上が原点 (0,0)
// PDF: 左下が原点 (0,0)
export function canvasToPDFCoordinates(
  canvasX: number,
  canvasY: number,
  pdfPageHeight: number,
  scale: number
): { x: number; y: number } {
  const x = canvasX / scale;
  const y = pdfPageHeight - (canvasY / scale);
  return { x, y };
}

// PDF座標からCanvas座標への変換
export function pdfToCanvasCoordinates(
  pdfX: number,
  pdfY: number,
  pdfPageHeight: number,
  scale: number
): { x: number; y: number } {
  const x = pdfX * scale;
  const y = (pdfPageHeight - pdfY) * scale;
  return { x, y };
}
