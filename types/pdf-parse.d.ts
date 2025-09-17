import type { PdfParseFn } from '../src/lib/pdfParse';

declare module 'pdf-parse/lib/pdf-parse.js' {
  const pdfParse: PdfParseFn;
  export default pdfParse;
}
