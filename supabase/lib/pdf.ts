export async function extractText(arrayBuffer: ArrayBuffer): Promise<string> {
  // pdfjs-dist v5 (used by pdf-parse v2) references DOMMatrix at module init;
  // Node.js doesn't provide it, so we stub it for text-only extraction.
  if (typeof DOMMatrix === 'undefined') {
    (globalThis as unknown as Record<string, unknown>).DOMMatrix = class DOMMatrix {
      constructor(_init?: string | number[]) {}
    };
  }
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: new Uint8Array(arrayBuffer) });
  const result = await parser.getText();
  return result.text;
}
