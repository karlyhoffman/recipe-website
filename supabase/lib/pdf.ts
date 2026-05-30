import { PDFParse } from 'pdf-parse';

export async function extractText(arrayBuffer: ArrayBuffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(arrayBuffer) });
  const result = await parser.getText();
  return result.text;
}
