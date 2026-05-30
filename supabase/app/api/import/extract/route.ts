import { createSessionClient } from '@/lib/supabase';
import { extractText } from '@/lib/pdf';
import { extractRecipe } from '@/lib/recipe-extractor';

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev) {
    const supabase = await createSessionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json(
        { error: 'Authentication required to import recipes.' },
        { status: 401 }
      );
    }
  }

  let formData: FormData;
  try {
    formData = await request.formData();
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
  let rawText: string;

  try {
    const arrayBuffer = await file.arrayBuffer();
    rawText = await extractText(arrayBuffer);
  } catch (err) {
    console.error('[extract] pdf-parse extraction failed:', (err as Error).message, filename);
    return Response.json(
      { error: 'An error occurred during extraction. Please try again.' },
      { status: 500 }
    );
  }

  if (!rawText || !rawText.trim()) {
    return Response.json(
      { error: 'No text content could be extracted from this PDF. The review form has been left blank for manual entry.' },
      { status: 422 }
    );
  }

  try {
    const draft = await extractRecipe(rawText, filename);
    return Response.json(draft);
  } catch (err) {
    console.error('[extract] Claude extraction failed:', (err as Error).message, filename);
    return Response.json(
      { error: 'An error occurred during extraction. Please try again.' },
      { status: 500 }
    );
  }
}
