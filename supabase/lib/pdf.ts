export async function extractText(arrayBuffer: ArrayBuffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: new Uint8Array(arrayBuffer) });
  const result = await parser.getText();
  return result.text;
}
