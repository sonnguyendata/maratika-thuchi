export type PdfParseFn = (buffer: Buffer) => Promise<{ text: string }>; // simplified shape used by routes

let cachedParser: PdfParseFn | null = null;
let loadingParserPromise: Promise<PdfParseFn> | null = null;

export async function getPdfParse(): Promise<PdfParseFn> {
  if (cachedParser) {
    return cachedParser;
  }

  if (!loadingParserPromise) {
    loadingParserPromise = (async () => {
      try {
        const pdfModule = await import('pdf-parse/lib/pdf-parse.js');
        const parser = pdfModule.default || pdfModule;

        if (typeof parser !== 'function') {
          throw new Error('`pdf-parse` default export is not a function');
        }

        // Wrap the parser to match our simplified interface
        cachedParser = async (buffer: Buffer) => {
          const result = await parser(buffer);
          return { text: result.text };
        };
        return cachedParser;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to load pdf-parse dynamically: ${message}`);
      } finally {
        loadingParserPromise = null;
      }
    })();
  }

  if (cachedParser) {
    return cachedParser;
  }

  return loadingParserPromise;
}
