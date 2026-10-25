import { PDFParse } from 'pdf-parse';

/**
 * Extracts raw textual content from an uploaded PDF file buffer using pdf-parse v2.
 */
export const extractTextFromPdf = async (buffer: Buffer): Promise<string> => {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    if (typeof parser.destroy === 'function') {
      await parser.destroy();
    }
    return (result?.text || '').trim();
  } catch (error: any) {
    console.warn('Warning: Failed to extract text from PDF deck buffer:', error.message);
    return '';
  }
};
