import { extractText } from '@/lib/pdf';
import { extractRecipe } from '@/lib/recipe-extractor';

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  console.log('[extract] POST started');
  let formData: FormData;

  try {
    formData = await request.formData();
    console.log('[extract] formData parsed');
  } catch {
    return Response.json({ error: 'Invalid form data.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return Response.json({ error: 'Only PDF files are accepted.' }, { status: 400 });
  }

  if (file.type !== 'application/pdf') {
    return Response.json({ error: 'Only PDF files are accepted.' }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return Response.json({ error: 'File exceeds the 10 MB limit.' }, { status: 400 });
  }

  const filename = file.name;
  console.log('[extract] file:', filename, file.size);
  let rawText: string;

  try {
    const arrayBuffer = await file.arrayBuffer();
    console.log('[extract] arrayBuffer obtained, starting pdf extraction');
    rawText = await extractText(arrayBuffer);
    console.log('[extract] pdf extraction complete, text length:', rawText.length);
  } catch (err) {
    console.error('[extract] pdf-parse extraction failed:', err, filename);
    return Response.json(
      { error: 'pdf-parse failed', detail: String(err), stack: (err as Error)?.stack },
      { status: 500 }
    );
  }

  if (!rawText || !rawText.trim()) {
    return Response.json(
      { error: 'No text content could be extracted from this PDF. The review form has been left blank for manual entry.' },
      { status: 422 }
    );
  }

  console.log('[extract] starting Claude extraction');
  try {
    const draft = await extractRecipe(rawText, filename);
    console.log('[extract] Claude extraction complete');
    return Response.json(draft);
  } catch (err) {
    console.error('[extract] Claude extraction failed:', err, filename);
    return Response.json(
      { error: 'Claude failed', detail: String(err), stack: (err as Error)?.stack },
      { status: 500 }
    );
  }
}
