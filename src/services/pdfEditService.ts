import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {
  TextEdit,
  HighlightAnnotation,
  UnderlineAnnotation,
  CommentAnnotation,
  ImageEdit,
} from '../types/edit.types';

// 編集内容をまとめた型
interface EditsToApply {
  texts: TextEdit[];
  highlights: HighlightAnnotation[];
  underlines: UnderlineAnnotation[];
  comments: CommentAnnotation[];
  images: ImageEdit[];
}

// 色文字列（#RRGGBB）をRGB値に変換
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}

// ページを回転
export async function rotatePage(
  pdfDoc: PDFDocument,
  pageIndex: number,
  rotationDegrees: number
): Promise<void> {
  const pages = pdfDoc.getPages();
  if (pageIndex < 0 || pageIndex >= pages.length) {
    throw new Error(`無効なページインデックス: ${pageIndex}`);
  }

  const page = pages[pageIndex];
  const currentRotation = page.getRotation().angle;
  const newRotation = (currentRotation + rotationDegrees) % 360;
  page.setRotation(degrees(newRotation));
}

// ページを削除
export async function removePage(pdfDoc: PDFDocument, pageIndex: number): Promise<void> {
  const pages = pdfDoc.getPages();
  if (pageIndex < 0 || pageIndex >= pages.length) {
    throw new Error(`無効なページインデックス: ${pageIndex}`);
  }

  pdfDoc.removePage(pageIndex);
}

// ページを並べ替え
export async function reorderPages(
  pdfBuffer: ArrayBuffer,
  newOrder: number[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const destDoc = await PDFDocument.create();

  for (const originalIndex of newOrder) {
    const [copiedPage] = await destDoc.copyPages(srcDoc, [originalIndex]);
    destDoc.addPage(copiedPage);
  }

  return destDoc.save();
}

// テキストを追加
export async function addText(
  pdfDoc: PDFDocument,
  pageIndex: number,
  textEdit: TextEdit
): Promise<void> {
  const pages = pdfDoc.getPages();
  if (pageIndex < 0 || pageIndex >= pages.length) {
    throw new Error(`無効なページインデックス: ${pageIndex}`);
  }

  const page = pages[pageIndex];
  const { height } = page.getSize();

  // 日本語フォントを埋め込む場合はfontkitを登録
  pdfDoc.registerFontkit(fontkit);

  // 日本語が含まれているか確認
  const hasJapanese = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(textEdit.text);

  let font;
  if (hasJapanese) {
    // Windowsのメイリオフォントを読み込む
    try {
      const fontPath = 'C:\\Windows\\Fonts\\meiryo.ttc';
      const fontBuffer = await window.electronAPI.readFile(fontPath);
      font = await pdfDoc.embedFont(fontBuffer, { subset: true });
    } catch {
      // フォールバック: 標準フォント（日本語は表示されない）
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
  } else {
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  const color = hexToRgb(textEdit.color);

  // Canvas座標（左上原点）からPDF座標（左下原点）に変換
  const pdfY = height - textEdit.y - textEdit.fontSize;

  page.drawText(textEdit.text, {
    x: textEdit.x,
    y: pdfY,
    size: textEdit.fontSize,
    font,
    color: rgb(color.r, color.g, color.b),
  });
}

// ハイライトを追加
export async function addHighlight(
  pdfDoc: PDFDocument,
  pageIndex: number,
  highlight: HighlightAnnotation
): Promise<void> {
  const pages = pdfDoc.getPages();
  if (pageIndex < 0 || pageIndex >= pages.length) {
    throw new Error(`無効なページインデックス: ${pageIndex}`);
  }

  const page = pages[pageIndex];
  const { height } = page.getSize();

  const color = hexToRgb(highlight.color);

  // Canvas座標からPDF座標に変換
  const pdfY = height - highlight.y - highlight.height;

  page.drawRectangle({
    x: highlight.x,
    y: pdfY,
    width: highlight.width,
    height: highlight.height,
    color: rgb(color.r, color.g, color.b),
    opacity: highlight.opacity,
  });
}

// 下線を追加
export async function addUnderline(
  pdfDoc: PDFDocument,
  pageIndex: number,
  underline: UnderlineAnnotation
): Promise<void> {
  const pages = pdfDoc.getPages();
  if (pageIndex < 0 || pageIndex >= pages.length) {
    throw new Error(`無効なページインデックス: ${pageIndex}`);
  }

  const page = pages[pageIndex];
  const { height } = page.getSize();

  const color = hexToRgb(underline.color);

  // Canvas座標からPDF座標に変換
  const pdfY = height - underline.y;

  const lineStyle = underline.lineStyle ?? 'solid';
  const dashArray =
    lineStyle === 'dashed' ? [6, 4] :
    lineStyle === 'dotted' ? [2, 4] :
    undefined;

  const x1 = underline.x;
  const y1 = pdfY;
  const x2 = (underline.x2 ?? underline.x + underline.width);
  const y2 = height - (underline.y2 ?? underline.y);

  const lineOptions: any = {
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness: underline.thickness,
    color: rgb(color.r, color.g, color.b),
    lineCap: underline.lineCap ?? 'butt',
  };

  if (dashArray) {
    lineOptions.dashArray = dashArray;
  }

  page.drawLine(lineOptions);

  // 矢印
  const arrowStart = underline.arrowStart ?? false;
  const arrowEnd = underline.arrowEnd ?? false;
  if (arrowStart || arrowEnd) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const size = Math.max(underline.thickness * 3, 8);
    const half = size * 0.5;

    const drawArrow = (px: number, py: number, dirX: number, dirY: number) => {
      const baseX = px - dirX * size;
      const baseY = py - dirY * size;
      const perpX = -dirY;
      const perpY = dirX;
      const leftX = baseX + perpX * half;
      const leftY = baseY + perpY * half;
      const rightX = baseX - perpX * half;
      const rightY = baseY - perpY * half;

      page.drawPolygon(
        [
          { x: px, y: py },
          { x: leftX, y: leftY },
          { x: rightX, y: rightY },
        ],
        { color: rgb(color.r, color.g, color.b) }
      );
    };

    if (arrowEnd) {
      drawArrow(x2, y2, ux, uy);
    }
    if (arrowStart) {
      drawArrow(x1, y1, -ux, -uy);
    }
  }
}

// コメントを追加（注釈として）
export async function addComment(
  pdfDoc: PDFDocument,
  pageIndex: number,
  comment: CommentAnnotation
): Promise<void> {
  const pages = pdfDoc.getPages();
  if (pageIndex < 0 || pageIndex >= pages.length) {
    throw new Error(`無効なページインデックス: ${pageIndex}`);
  }

  // pdf-libでは注釈の追加が限定的なため、
  // コメントアイコンと吹き出しテキストとして描画
  const page = pages[pageIndex];
  const { height } = page.getSize();

  pdfDoc.registerFontkit(fontkit);

  let font;
  const hasJapanese = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(comment.text);

  if (hasJapanese) {
    try {
      const fontPath = 'C:\\Windows\\Fonts\\meiryo.ttc';
      const fontBuffer = await window.electronAPI.readFile(fontPath);
      font = await pdfDoc.embedFont(fontBuffer, { subset: true });
    } catch {
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
  } else {
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  const pdfY = height - comment.y;

  // コメントアイコン（黄色い四角）
  page.drawRectangle({
    x: comment.x,
    y: pdfY - 20,
    width: 20,
    height: 20,
    color: rgb(1, 0.9, 0.4),
    borderColor: rgb(0.8, 0.7, 0.2),
    borderWidth: 1,
  });

  // コメントテキスト（小さく表示）
  const fontSize = 8;
  const lines = comment.text.split('\n');
  lines.forEach((line, index) => {
    page.drawText(line, {
      x: comment.x + 25,
      y: pdfY - 10 - index * (fontSize + 2),
      size: fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  });
}

// 画像を追加
export async function addImage(
  pdfDoc: PDFDocument,
  pageIndex: number,
  imageEdit: ImageEdit
): Promise<void> {
  const pages = pdfDoc.getPages();
  if (pageIndex < 0 || pageIndex >= pages.length) {
    throw new Error(`無効なページインデックス: ${pageIndex}`);
  }

  const page = pages[pageIndex];
  const { height } = page.getSize();

  let embeddedImage;
  if (imageEdit.mimeType === 'image/png') {
    embeddedImage = await pdfDoc.embedPng(imageEdit.imageData);
  } else {
    embeddedImage = await pdfDoc.embedJpg(imageEdit.imageData);
  }

  // Canvas座標からPDF座標に変換
  const pdfY = height - imageEdit.y - imageEdit.height;

  page.drawImage(embeddedImage, {
    x: imageEdit.x,
    y: pdfY,
    width: imageEdit.width,
    height: imageEdit.height,
  });
}

// すべての編集を適用
export async function applyEdits(
  pdfBuffer: ArrayBuffer,
  edits: EditsToApply,
  pageOrder: number[],
  deletedPages: Set<number>,
  pageRotations: Map<number, number>
): Promise<Uint8Array> {
  // 削除されていないページのみをフィルタリング
  const activePages = pageOrder.filter((idx) => !deletedPages.has(idx));

  // 新しいPDFを作成
  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const destDoc = await PDFDocument.create();
  destDoc.registerFontkit(fontkit);

  // ページをコピー
  const copiedPages = await destDoc.copyPages(srcDoc, activePages);

  // 元のページインデックスから新しいインデックスへのマッピング
  const pageIndexMap = new Map<number, number>();
  activePages.forEach((originalIndex, newIndex) => {
    pageIndexMap.set(originalIndex, newIndex);
    destDoc.addPage(copiedPages[newIndex]);
  });

  // ページ回転を適用
  for (const [originalIndex, rotation] of pageRotations.entries()) {
    const newIndex = pageIndexMap.get(originalIndex);
    if (newIndex !== undefined && rotation !== 0) {
      const page = destDoc.getPages()[newIndex];
      page.setRotation(degrees(rotation));
    }
  }

  // テキストを追加
  for (const text of edits.texts) {
    const newIndex = pageIndexMap.get(text.pageIndex);
    if (newIndex !== undefined) {
      await addText(destDoc, newIndex, { ...text, pageIndex: newIndex });
    }
  }

  // ハイライトを追加
  for (const highlight of edits.highlights) {
    const newIndex = pageIndexMap.get(highlight.pageIndex);
    if (newIndex !== undefined) {
      await addHighlight(destDoc, newIndex, { ...highlight, pageIndex: newIndex });
    }
  }

  // 下線を追加
  for (const underline of edits.underlines) {
    const newIndex = pageIndexMap.get(underline.pageIndex);
    if (newIndex !== undefined) {
      await addUnderline(destDoc, newIndex, { ...underline, pageIndex: newIndex });
    }
  }

  // コメントを追加
  for (const comment of edits.comments) {
    const newIndex = pageIndexMap.get(comment.pageIndex);
    if (newIndex !== undefined) {
      await addComment(destDoc, newIndex, { ...comment, pageIndex: newIndex });
    }
  }

  // 画像を追加
  for (const image of edits.images) {
    const newIndex = pageIndexMap.get(image.pageIndex);
    if (newIndex !== undefined) {
      await addImage(destDoc, newIndex, { ...image, pageIndex: newIndex });
    }
  }

  return destDoc.save();
}
