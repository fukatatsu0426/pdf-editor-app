import { PDFDocument } from 'pdf-lib';

/**
 * 複数のPDFファイルを1つに統合する
 * @param fileBuffers - 統合するPDFファイルのバッファ配列
 * @returns 統合されたPDFのバイト配列
 */
export async function mergePDFs(fileBuffers: ArrayBuffer[]): Promise<Uint8Array> {
  // 新しいPDFドキュメントを作成
  const mergedPdf = await PDFDocument.create();

  // 各PDFファイルを順番に統合
  for (let i = 0; i < fileBuffers.length; i++) {
    const buffer = fileBuffers[i];
    try {
      // PDFをロード（暗号化やエラーをキャッチ）
      const pdf = await PDFDocument.load(buffer, {
        ignoreEncryption: true  // 暗号化を無視して試す
      });

      // すべてのページをコピー
      const pageIndices = pdf.getPageIndices();
      const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);

      // コピーしたページを追加
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    } catch (error) {
      console.error(`PDF ${i + 1}番目の読み込みエラー:`, error);

      // エラーの種類を判定
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('encrypted') || errorMessage.includes('password')) {
        throw new Error(`${i + 1}番目のPDFファイルは暗号化されています。パスワード保護されたPDFは統合できません。`);
      } else if (errorMessage.includes('Invalid PDF')) {
        throw new Error(`${i + 1}番目のPDFファイルが破損しているか、無効なPDF形式です。`);
      } else {
        throw new Error(`${i + 1}番目のPDFファイルの処理に失敗しました: ${errorMessage}`);
      }
    }
  }

  // 統合されたPDFを保存
  try {
    return await mergedPdf.save();
  } catch (error) {
    console.error('PDF保存エラー:', error);
    throw new Error('統合されたPDFの保存に失敗しました');
  }
}

/**
 * PDFを指定された範囲で分割する
 * @param fileBuffer - 分割するPDFファイルのバッファ
 * @param ranges - 分割範囲の配列 [{start: 1, end: 5, filename: 'part1.pdf'}, ...]
 * @returns ファイル名とPDFバイト配列のマップ
 */
export async function splitPDF(
  fileBuffer: ArrayBuffer,
  ranges: { start: number; end: number; filename: string }[]
): Promise<Map<string, Uint8Array>> {
  const sourcePdf = await PDFDocument.load(fileBuffer);
  const results = new Map<string, Uint8Array>();

  for (const range of ranges) {
    try {
      // 新しいPDFドキュメントを作成
      const newPdf = await PDFDocument.create();

      // 指定範囲のページをコピー（0-indexed）
      const pageIndices = Array.from(
        { length: range.end - range.start + 1 },
        (_, i) => range.start - 1 + i
      );

      const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
      copiedPages.forEach((page) => {
        newPdf.addPage(page);
      });

      // 保存
      const pdfBytes = await newPdf.save();
      results.set(range.filename, pdfBytes);
    } catch (error) {
      console.error('PDF分割エラー:', error);
      throw new Error(`ページ ${range.start}-${range.end} の分割に失敗しました`);
    }
  }

  return results;
}
