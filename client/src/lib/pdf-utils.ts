/**
 * PDF Text Extraction Utility
 * 
 * Uses pdfjs-dist to extract text from PDF files client-side.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker - use CDN for reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
}

export interface PdfExtractionProgress {
  currentPage: number;
  totalPages: number;
  message: string;
}

/**
 * Extract text from a PDF file
 */
export async function extractTextFromPdf(
  file: File,
  onProgress?: (progress: PdfExtractionProgress) => void
): Promise<PdfExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const totalPages = pdf.numPages;
  let fullText = '';
  
  for (let i = 1; i <= totalPages; i++) {
    if (onProgress) {
      onProgress({
        currentPage: i,
        totalPages,
        message: `Extracting page ${i} of ${totalPages}...`
      });
    }
    
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => {
        if ('str' in item) {
          return item.str;
        }
        return '';
      })
      .join(' ');
    
    fullText += pageText + '\n\n';
  }
  
  return {
    text: fullText.trim(),
    pageCount: totalPages
  };
}

/**
 * Check if a file is a PDF
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
