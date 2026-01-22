import * as pdfjsLib from 'pdfjs-dist';

// PDF.jsのワーカーを設定
// これによりPDF処理がバックグラウンドで実行され、UIがフリーズしなくなります
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
