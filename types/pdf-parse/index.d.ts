declare module 'pdf-parse/lib/pdf-parse.js' {
  interface PdfParseResult {
    text: string;
    numpages: number;
    numrender: number;
    info?: any;
    metadata?: any;
    version?: string;
  }
  
  function pdfParse(buffer: Buffer): Promise<PdfParseResult>;
  export = pdfParse;
}
